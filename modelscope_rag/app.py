from __future__ import annotations

import csv
import io
import json
import math
import os
import re
import sys
import tempfile
import threading
import time
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


DEFAULT_DATA_BASE_URL = "https://jojo-edtech.github.io/aiedcase/data"
DEFAULT_MODEL = "Qwen/Qwen3-30B-A3B-Instruct-2507"
DEFAULT_API_BASE = "https://api-inference.modelscope.cn/v1/chat/completions"

DATA_FILES = {
    "cases": "cases.csv",
    "resources": "resources.csv",
    "prompts": "prompts.csv",
}

MAX_QUESTION_CHARS = int(os.getenv("RAG_MAX_QUESTION_CHARS", "360"))
DEFAULT_TOP_K = int(os.getenv("RAG_TOP_K", "6"))
MAX_CONTEXT_CHARS = int(os.getenv("RAG_MAX_CONTEXT_CHARS", "9000"))
MODEL_TIMEOUT_SEC = int(os.getenv("MODELSCOPE_TIMEOUT_SEC", "60"))
MAX_DATA_RESPONSE_BYTES = int(os.getenv("RAG_MAX_DATA_RESPONSE_BYTES", str(8 * 1024 * 1024)))
MAX_MODEL_RESPONSE_BYTES = int(os.getenv("MODELSCOPE_MAX_RESPONSE_BYTES", str(4 * 1024 * 1024)))
DAILY_GENERATION_LIMIT = int(os.getenv("RAG_DAILY_GENERATION_LIMIT", "50"))
QUOTA_STATE_FILE = Path(
    os.getenv("RAG_QUOTA_STATE_FILE", str(Path(tempfile.gettempdir()) / "aied_case_hub_rag_quota.json"))
)


class NoRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


NO_REDIRECT_OPENER = build_opener(NoRedirectHandler())


@dataclass
class Document:
    doc_id: str
    kind: str
    title: str
    text: str
    source_url: str
    meta: str
    tokens: list[str]
    counts: Counter
    length: int


def value(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        found = (row.get(key) or "").strip()
        if found:
            return found
    return ""


def compact(parts: Iterable[str]) -> str:
    return "\n".join(part.strip() for part in parts if part and part.strip())


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def normalize_user_text(value: Any) -> str:
    return normalize_spaces(value) if isinstance(value, str) else ""


def tokenize(text: str) -> list[str]:
    lowered = (text or "").lower()
    tokens = re.findall(r"[a-z0-9][a-z0-9_+.-]*", lowered)
    for sequence in re.findall(r"[\u4e00-\u9fff]+", text or ""):
        tokens.extend(sequence)
        for width in (2, 3):
            if len(sequence) >= width:
                tokens.extend(sequence[index : index + width] for index in range(len(sequence) - width + 1))
    return tokens


def data_url(base_url: str, filename: str) -> str:
    if base_url.startswith(("http://", "https://")):
        return f"{validate_remote_data_base(base_url)}/{filename}"
    return str(Path(base_url).expanduser().resolve() / filename)


def validate_remote_data_base(value: str) -> str:
    candidate = str(value or "").strip()
    parsed = urlparse(candidate)
    try:
        port = parsed.port
    except ValueError as error:
        raise ValueError("RAG_DATA_BASE_URL has an invalid port.") from error
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or port not in {None, 443}
        or parsed.params
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("Remote RAG_DATA_BASE_URL must be a plain HTTPS base URL.")
    return candidate.rstrip("/")


def validate_modelscope_api_url(value: str) -> str:
    candidate = str(value or "").strip()
    parsed = urlparse(candidate)
    try:
        port = parsed.port
    except ValueError as error:
        raise ValueError("MODELSCOPE_API_BASE has an invalid port.") from error
    if (
        parsed.scheme != "https"
        or parsed.hostname != "api-inference.modelscope.cn"
        or parsed.username
        or parsed.password
        or port not in {None, 443}
        or parsed.path.rstrip("/") != "/v1/chat/completions"
        or parsed.params
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("MODELSCOPE_API_BASE must be the official HTTPS chat-completions endpoint.")
    return DEFAULT_API_BASE


def read_limited_response(response, max_bytes: int) -> bytes:
    if max_bytes <= 0:
        raise ValueError("Response byte limit must be positive.")
    declared = response.headers.get("Content-Length")
    if declared:
        try:
            declared_bytes = int(declared)
        except ValueError as error:
            raise ValueError("Response has an invalid Content-Length header.") from error
        if declared_bytes < 0:
            raise ValueError("Response has an invalid Content-Length header.")
        if declared_bytes > max_bytes:
            raise ValueError(f"Response exceeds {max_bytes} bytes.")
    payload = response.read(max_bytes + 1)
    if len(payload) > max_bytes:
        raise ValueError(f"Response exceeds {max_bytes} bytes.")
    return payload


def read_text(source: str) -> str:
    if source.startswith(("http://", "https://")):
        request = Request(source, headers={"User-Agent": "aiedcase-rag/0.1"})
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                with NO_REDIRECT_OPENER.open(request, timeout=25) as response:
                    return read_limited_response(response, MAX_DATA_RESPONSE_BYTES).decode("utf-8-sig")
            except ValueError:
                raise
            except (OSError, HTTPError, URLError) as error:
                last_error = error
                time.sleep(1.5 * (attempt + 1))
        if Path("data").exists():
            local_source = str(Path("data") / source.rstrip("/").split("/")[-1])
            return Path(local_source).read_text(encoding="utf-8-sig")
        if last_error:
            raise last_error
        raise RuntimeError(f"无法读取 {source}")
    return Path(source).read_text(encoding="utf-8-sig")


def load_csv(base_url: str, key: str) -> list[dict[str, str]]:
    text = read_text(data_url(base_url, DATA_FILES[key]))
    return list(csv.DictReader(io.StringIO(text)))


def make_document(doc_id: str, kind: str, title: str, text: str, source_url: str, meta: str) -> Document:
    tokens = tokenize(f"{title}\n{text}\n{meta}")
    return Document(
        doc_id=doc_id,
        kind=kind,
        title=title or doc_id,
        text=text,
        source_url=source_url,
        meta=meta,
        tokens=tokens,
        counts=Counter(tokens),
        length=max(1, len(tokens)),
    )


def build_documents(base_url: str) -> list[Document]:
    documents: list[Document] = []

    for row in load_csv(base_url, "cases"):
        title = value(row, "title_cn", "title_original", "id")
        text = compact(
            [
                value(row, "title_original"),
                value(row, "summary_cn"),
                value(row, "workflow_cn"),
            ]
        )
        meta = " / ".join(
            part
            for part in [
                value(row, "category"),
                value(row, "subcategory"),
                value(row, "subject"),
                value(row, "education_level"),
                value(row, "region"),
                value(row, "ai_tool_or_method"),
                value(row, "source_type"),
            ]
            if part
        )
        documents.append(make_document(value(row, "id"), "教学案例", title, text, value(row, "source_url"), meta))

    for row in load_csv(base_url, "resources"):
        title = value(row, "title_cn", "title_original", "id")
        text = compact(
            [
                value(row, "title_original"),
                value(row, "summary_cn"),
                value(row, "use_case_cn"),
            ]
        )
        meta = " / ".join(
            part
            for part in [
                value(row, "resource_type"),
                value(row, "category"),
                value(row, "subject"),
                value(row, "education_level"),
                value(row, "audience"),
                value(row, "region"),
                value(row, "publisher"),
                value(row, "access_type"),
            ]
            if part
        )
        documents.append(make_document(value(row, "id"), "教材资源", title, text, value(row, "source_url"), meta))

    for row in load_csv(base_url, "prompts"):
        title = value(row, "title_cn", "id")
        text = compact(
            [
                value(row, "use_case_cn"),
                value(row, "prompt_cn"),
                value(row, "source_title"),
            ]
        )
        meta = " / ".join(
            part
            for part in [
                value(row, "prompt_type"),
                value(row, "category"),
                value(row, "subject"),
                value(row, "education_level"),
                value(row, "audience"),
                value(row, "output_format"),
                value(row, "ai_tool_or_method"),
            ]
            if part
        )
        documents.append(make_document(value(row, "id"), "Prompt 模板", title, text, value(row, "source_url"), meta))

    return documents


class RagIndex:
    def __init__(self, documents: list[Document]) -> None:
        self.documents = documents
        self.avg_length = sum(doc.length for doc in documents) / max(1, len(documents))
        self.doc_freq = Counter()
        for doc in documents:
            self.doc_freq.update(set(doc.tokens))

    def search(self, query: str, top_k: int = DEFAULT_TOP_K) -> list[tuple[Document, float]]:
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        query_counts = Counter(query_tokens)
        scored: list[tuple[Document, float]] = []
        total_docs = max(1, len(self.documents))
        k1 = 1.4
        b = 0.72
        lowered_query = query.lower().strip()

        for doc in self.documents:
            score = 0.0
            for token, query_weight in query_counts.items():
                frequency = doc.counts.get(token, 0)
                if frequency == 0:
                    continue
                idf = math.log((total_docs - self.doc_freq[token] + 0.5) / (self.doc_freq[token] + 0.5) + 1)
                denominator = frequency + k1 * (1 - b + b * doc.length / self.avg_length)
                score += query_weight * idf * (frequency * (k1 + 1)) / denominator

            if lowered_query and lowered_query in doc.title.lower():
                score += 4.0
            if lowered_query and lowered_query in doc.text.lower():
                score += 2.0
            if any(keyword in lowered_query for keyword in ["prompt", "提示词", "模板"]) and doc.kind == "Prompt 模板":
                score += 28.0
            if "备课" in lowered_query and "备课" in f"{doc.title} {doc.text} {doc.meta}":
                score += 16.0
            if "案例" in lowered_query and doc.kind == "教学案例":
                score += 5.0
            if any(keyword in lowered_query for keyword in ["资源", "教材"]) and doc.kind == "教材资源":
                score += 5.0
            if "香港" in lowered_query and "香港" in f"{doc.title} {doc.text} {doc.meta}":
                score += 3.0
            if "stem" in lowered_query and "AI+STEM" in doc.meta:
                score += 4.0

            if score > 0:
                scored.append((doc, score))

        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[: max(1, min(12, int(top_k)))]


_INDEX: RagIndex | None = None
_INDEX_ERROR: str | None = None
_QUOTA_LOCK = threading.Lock()


def get_index(refresh: bool = False) -> RagIndex:
    global _INDEX, _INDEX_ERROR
    if _INDEX is not None and not refresh:
        return _INDEX

    base_url = os.getenv("RAG_DATA_BASE_URL", DEFAULT_DATA_BASE_URL)
    try:
        _INDEX = RagIndex(build_documents(base_url))
        _INDEX_ERROR = None
        return _INDEX
    except (OSError, HTTPError, URLError, ValueError, csv.Error) as error:
        _INDEX_ERROR = f"{type(error).__name__}: {error}"
        raise RuntimeError(f"无法读取知识库数据：{_INDEX_ERROR}") from error


def context_for(results: list[tuple[Document, float]]) -> str:
    chunks: list[str] = []
    used_chars = 0
    for number, (doc, score) in enumerate(results, start=1):
        snippet = normalize_spaces(doc.text)[:1200]
        chunk = (
            f"[{number}] 类型：{doc.kind}\n"
            f"标题：{doc.title}\n"
            f"标签：{doc.meta}\n"
            f"内容：{snippet}\n"
            f"来源：{doc.source_url}\n"
            f"检索分数：{score:.2f}"
        )
        if used_chars + len(chunk) > MAX_CONTEXT_CHARS:
            break
        chunks.append(chunk)
        used_chars += len(chunk)
    return "\n\n".join(chunks)


def sources_markdown(results: list[tuple[Document, float]]) -> str:
    lines = []
    for number, (doc, score) in enumerate(results, start=1):
        link = doc.source_url or "#"
        lines.append(f"{number}. [{doc.kind}] [{doc.title}]({link})  \n   {doc.meta} · score {score:.2f}")
    return "\n".join(lines) if lines else "未找到可引用来源。"


def source_records(results: list[tuple[Document, float]]) -> list[dict[str, str | float]]:
    return [
        {
            "id": doc.doc_id,
            "kind": doc.kind,
            "title": doc.title,
            "url": doc.source_url,
            "meta": doc.meta,
            "score": round(score, 2),
        }
        for doc, score in results
    ]


def quota_label() -> str:
    if DAILY_GENERATION_LIMIT <= 0:
        return "生成回答：不限额"
    state = read_quota_state()
    today = date.today().isoformat()
    used = state.get("used", 0) if state.get("date") == today else 0
    remaining = max(0, DAILY_GENERATION_LIMIT - int(used))
    return f"今日生成额度：{remaining}/{DAILY_GENERATION_LIMIT}"


def read_quota_state() -> dict[str, int | str]:
    try:
        return json.loads(QUOTA_STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"date": date.today().isoformat(), "used": 0}


def claim_generation_quota() -> tuple[bool, str]:
    with _QUOTA_LOCK:
        if DAILY_GENERATION_LIMIT <= 0:
            return True, "生成回答：不限额"

        today = date.today().isoformat()
        state = read_quota_state()
        if state.get("date") != today:
            state = {"date": today, "used": 0}

        used = int(state.get("used", 0))
        if used >= DAILY_GENERATION_LIMIT:
            return False, f"今日公开试用额度已用完（{DAILY_GENERATION_LIMIT}/{DAILY_GENERATION_LIMIT}）。"

        state["used"] = used + 1
        try:
            QUOTA_STATE_FILE.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
        except OSError:
            return False, "额度状态文件暂时不可写。"

        remaining = max(0, DAILY_GENERATION_LIMIT - int(state["used"]))
        return True, f"今日生成额度：{remaining}/{DAILY_GENERATION_LIMIT}"


def language_instruction(language: str) -> str:
    return {
        "en": "Answer in English.",
        "zh-Hant": "使用繁體中文回答。",
        "zh-Hans": "使用简体中文回答。",
    }.get(language, "使用简体中文回答。")


def model_generation_configured() -> bool:
    return bool(os.getenv("MODELSCOPE_API_TOKEN") or os.getenv("MODELSCOPE_TOKEN"))


def call_modelscope_messages(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.2,
    max_tokens: int = 1100,
) -> tuple[str | None, str | None]:
    token = os.getenv("MODELSCOPE_API_TOKEN") or os.getenv("MODELSCOPE_TOKEN")
    if not token:
        return None, "生成服务尚未配置。"

    payload = {
        "model": os.getenv("MODELSCOPE_MODEL", DEFAULT_MODEL),
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    try:
        api_url = validate_modelscope_api_url(os.getenv("MODELSCOPE_API_BASE", DEFAULT_API_BASE))
    except ValueError:
        return None, "生成服务地址配置无效。"

    request = Request(
        api_url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "aiedcase-rag/0.2",
        },
        method="POST",
    )

    try:
        with NO_REDIRECT_OPENER.open(request, timeout=MODEL_TIMEOUT_SEC) as response:
            data = json.loads(read_limited_response(response, MAX_MODEL_RESPONSE_BYTES).decode("utf-8"))
    except HTTPError as error:
        return None, f"生成服务返回 HTTP {error.code}。"
    except (OSError, URLError, ValueError, json.JSONDecodeError) as error:
        return None, f"生成服务暂时不可用：{type(error).__name__}。"

    try:
        return data["choices"][0]["message"]["content"].strip(), None
    except (KeyError, IndexError, TypeError):
        return None, "生成服务返回格式无法解析。"


def call_modelscope(
    question: str,
    results: list[tuple[Document, float]],
    *,
    history: list[dict[str, str]] | None = None,
    language: str = "zh-Hans",
) -> tuple[str | None, str | None]:
    safe_history = []
    for item in (history or [])[-6:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = normalize_user_text(item.get("content", ""))[:700]
        if role in {"user", "assistant"} and content:
            safe_history.append({"role": role, "content": content})

    messages = [
        {
            "role": "system",
            "content": (
                "你是 AIED Case Hub 的教师研究助手。只能根据当前提供的资料回答，"
                "不可编造来源、学习成效或课堂事实。资料不足时明确说明。"
                "回答应直接、可执行，并在关键结论后使用 [1] 这样的引用编号。"
                f"{language_instruction(language)}"
            ),
        },
        *safe_history,
        {
            "role": "user",
            "content": f"当前问题：{question}\n\n可用资料：\n{context_for(results)}",
        },
    ]
    return call_modelscope_messages(
        messages,
        temperature=float(os.getenv("MODELSCOPE_TEMPERATURE", "0.2")),
        max_tokens=int(os.getenv("MODELSCOPE_MAX_TOKENS", "1100")),
    )


def answer_chat(
    question: str,
    *,
    history: list[dict[str, str]] | None = None,
    top_k: int = DEFAULT_TOP_K,
    language: str = "zh-Hans",
) -> dict[str, Any]:
    question = normalize_spaces(question)
    if not question:
        return {"ok": False, "status": "invalid", "answer": "请输入一个问题。", "sources": []}
    if len(question) > MAX_QUESTION_CHARS:
        return {
            "ok": False,
            "status": "invalid",
            "answer": f"问题太长，请控制在 {MAX_QUESTION_CHARS} 个字符以内。",
            "sources": [],
        }

    try:
        results = get_index().search(question, top_k)
    except RuntimeError as error:
        return {"ok": False, "status": "data_error", "answer": str(error), "sources": []}

    sources = source_records(results)
    if not results or results[0][1] < 0.2:
        return {
            "ok": True,
            "status": "no_evidence",
            "answer": "当前资料库没有足够依据。请补充学科、学段、地区或想完成的教学任务。",
            "sources": sources,
            "quota": quota_label(),
        }

    if not model_generation_configured():
        return {
            "ok": False,
            "status": "service_error",
            "answer": "我找到了相关资料，但生成服务尚未配置。",
            "sources": sources,
            "quota": quota_label(),
        }

    allowed, quota_message = claim_generation_quota()
    if not allowed:
        return {
            "ok": True,
            "status": "quota_exhausted",
            "answer": f"{quota_message}\n\n已为你保留最相关的资料来源，可先查看引用。",
            "sources": sources,
            "quota": quota_message,
        }

    answer, error = call_modelscope(
        question,
        results,
        history=history,
        language=language,
    )
    if answer:
        return {
            "ok": True,
            "status": "generated",
            "answer": answer,
            "sources": sources,
            "quota": quota_message,
        }

    return {
        "ok": False,
        "status": "service_error",
        "answer": f"我找到了相关资料，但生成服务暂时不可用。{error or ''}",
        "sources": sources,
        "quota": quota_message,
    }


def generate_teacher_tool(payload: dict[str, Any]) -> dict[str, Any]:
    fields = {
        key: normalize_user_text(payload.get(key, ""))
        for key in [
            "output_type",
            "subject",
            "level",
            "topic",
            "duration",
            "student_context",
            "language",
            "constraints",
            "source_material",
        ]
    }
    missing = [key for key in ["output_type", "subject", "level", "topic"] if not fields[key]]
    if missing:
        return {
            "ok": False,
            "status": "invalid",
            "answer": "请先填写产出类型、学科、学段和教学主题。",
            "sources": [],
        }
    if any(len(value) > 3000 for value in fields.values()):
        return {
            "ok": False,
            "status": "invalid",
            "answer": "单项输入过长，请缩短材料或约束条件后重试。",
            "sources": [],
        }

    retrieval_query = " ".join(
        part for part in [fields["subject"], fields["level"], fields["topic"], fields["output_type"]] if part
    )
    try:
        results = get_index().search(retrieval_query, DEFAULT_TOP_K)
    except RuntimeError as error:
        return {"ok": False, "status": "data_error", "answer": str(error), "sources": []}

    if not model_generation_configured():
        return {
            "ok": False,
            "status": "service_error",
            "answer": "生成服务尚未配置。",
            "sources": source_records(results),
            "quota": quota_label(),
        }

    allowed, quota_message = claim_generation_quota()
    if not allowed:
        return {
            "ok": False,
            "status": "quota_exhausted",
            "answer": quota_message,
            "sources": source_records(results),
            "quota": quota_message,
        }

    requested_language = fields["language"] or "zh-Hans"
    user_brief = compact(
        [
            f"产出类型：{fields['output_type']}",
            f"学科：{fields['subject']}",
            f"学段：{fields['level']}",
            f"主题：{fields['topic']}",
            f"课堂时间：{fields['duration']}" if fields["duration"] else "",
            f"学生情况：{fields['student_context']}" if fields["student_context"] else "",
            f"约束条件：{fields['constraints']}" if fields["constraints"] else "",
            f"原始材料：{fields['source_material']}" if fields["source_material"] else "",
        ]
    )
    messages = [
        {
            "role": "system",
            "content": (
                "你是服务香港教师的课程设计助手。根据教师简报和检索资料生成可直接编辑的课堂材料。"
                "输出必须包含：1. 学习目标；2. 所需材料；3. 分钟级课堂流程；4. 学习证据或评价方式；"
                "5. 差异化支持；6. AI 使用边界、事实核查和隐私提醒；7. 教师课后检查清单。"
                "不得虚构引用或声称未经资料支持的学习成效；使用资料时以 [1] 编号。"
                f"{language_instruction(requested_language)}"
            ),
        },
        {
            "role": "user",
            "content": f"教师简报：\n{user_brief}\n\n可用资料：\n{context_for(results)}",
        },
    ]
    answer, error = call_modelscope_messages(messages, temperature=0.25, max_tokens=1600)
    if answer:
        return {
            "ok": True,
            "status": "generated",
            "answer": answer,
            "sources": source_records(results),
            "quota": quota_message,
        }
    return {
        "ok": False,
        "status": "service_error",
        "answer": f"生成服务暂时不可用。{error or ''}",
        "sources": source_records(results),
        "quota": quota_message,
    }


def answer_question(question: str, top_k: int = DEFAULT_TOP_K) -> tuple[str, str]:
    result = answer_chat(question, top_k=top_k)
    answer = result.get("answer", "")
    quota = result.get("quota", "")
    if quota:
        answer = f"{answer}\n\n---\n{quota}"
    sources = [
        (
            make_document(
                str(source.get("id", "")),
                str(source.get("kind", "")),
                str(source.get("title", "")),
                "",
                str(source.get("url", "")),
                str(source.get("meta", "")),
            ),
            float(source.get("score", 0)),
        )
        for source in result.get("sources", [])
    ]
    return answer, sources_markdown(sources)


def build_demo():
    import gradio as gr

    with gr.Blocks(
        title="AIED Case Hub RAG 助手",
        css="""
        .gradio-container { max-width: 1180px !important; }
        footer { display: none !important; }
        """,
    ) as demo:
        gr.Markdown("# AIED Case Hub RAG 助手")
        gr.Markdown(f"公开有限额试用。{quota_label()}；额度用完后只返回检索引用，不继续调用模型。")
        if _INDEX_ERROR:
            gr.Markdown(f"知识库会在首次提问时重新加载。最近一次加载错误：{_INDEX_ERROR}")
        with gr.Row():
            question = gr.Textbox(
                label="问题",
                placeholder="例如：香港中学有哪些 AI 教育案例？",
                lines=3,
                max_lines=5,
            )
        with gr.Row():
            top_k = gr.Slider(3, 10, value=DEFAULT_TOP_K, step=1, label="引用数量")
            ask = gr.Button("生成回答", variant="primary")
        with gr.Row():
            answer = gr.Markdown(label="回答")
            sources = gr.Markdown(label="引用来源")

        gr.Examples(
            examples=[
                "香港中学有哪些 AI 教育案例？",
                "给我推荐 AI+STEM 的课堂活动。",
                "有没有适合教师备课的 Prompt？",
            ],
            inputs=question,
        )

        ask.click(answer_question, inputs=[question, top_k], outputs=[answer, sources])
        question.submit(answer_question, inputs=[question, top_k], outputs=[answer, sources])

    return demo


def self_test() -> None:
    index = get_index(refresh=True)
    print(f"loaded_documents={len(index.documents)}")
    for query in [
        "香港中学有哪些 AI 教育案例？",
        "给我推荐 AI+STEM 的课堂活动",
        "有没有适合教师备课的 Prompt",
    ]:
        results = index.search(query, 3)
        print(f"query={query}")
        for doc, score in results:
            print(f"- {doc.kind}: {doc.title} ({score:.2f})")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
    else:
        server_port = int(os.getenv("PORT") or os.getenv("GRADIO_SERVER_PORT") or "7860")
        build_demo().launch(server_name="0.0.0.0", server_port=server_port, show_error=False)
