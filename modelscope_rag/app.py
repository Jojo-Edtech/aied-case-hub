from __future__ import annotations

import csv
import io
import json
import math
import os
import re
import sys
import tempfile
import time
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


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
DAILY_GENERATION_LIMIT = int(os.getenv("RAG_DAILY_GENERATION_LIMIT", "50"))
QUOTA_STATE_FILE = Path(
    os.getenv("RAG_QUOTA_STATE_FILE", str(Path(tempfile.gettempdir()) / "aied_case_hub_rag_quota.json"))
)


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
        return f"{base_url.rstrip('/')}/{filename}"
    return str(Path(base_url).expanduser().resolve() / filename)


def read_text(source: str) -> str:
    if source.startswith(("http://", "https://")):
        request = Request(source, headers={"User-Agent": "aiedcase-rag/0.1"})
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                with urlopen(request, timeout=25) as response:
                    return response.read().decode("utf-8-sig")
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


def get_index(refresh: bool = False) -> RagIndex:
    global _INDEX, _INDEX_ERROR
    if _INDEX is not None and not refresh:
        return _INDEX

    base_url = os.getenv("RAG_DATA_BASE_URL", DEFAULT_DATA_BASE_URL)
    try:
        _INDEX = RagIndex(build_documents(base_url))
        _INDEX_ERROR = None
        return _INDEX
    except (OSError, HTTPError, URLError, csv.Error) as error:
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


def call_modelscope(question: str, results: list[tuple[Document, float]]) -> tuple[str | None, str | None]:
    token = os.getenv("MODELSCOPE_API_TOKEN") or os.getenv("MODELSCOPE_TOKEN")
    if not token:
        return None, "未配置 MODELSCOPE_API_TOKEN。"

    payload = {
        "model": os.getenv("MODELSCOPE_MODEL", DEFAULT_MODEL),
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是 AIED Case Hub 的研究助手。只能根据给定资料回答。"
                    "如果资料不足，必须说“当前资料库没有足够依据”。"
                    "用简体中文回答，结构清晰，关键结论后使用 [1] 这样的引用编号。"
                ),
            },
            {
                "role": "user",
                "content": f"用户问题：{question}\n\n资料：\n{context_for(results)}",
            },
        ],
        "temperature": float(os.getenv("MODELSCOPE_TEMPERATURE", "0.2")),
        "max_tokens": int(os.getenv("MODELSCOPE_MAX_TOKENS", "900")),
        "stream": False,
    }

    request = Request(
        os.getenv("MODELSCOPE_API_BASE", DEFAULT_API_BASE),
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "aiedcase-rag/0.1",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=MODEL_TIMEOUT_SEC) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        return None, f"魔搭 API 返回 HTTP {error.code}。"
    except (OSError, URLError, json.JSONDecodeError) as error:
        return None, f"魔搭 API 暂时不可用：{type(error).__name__}。"

    try:
        return data["choices"][0]["message"]["content"].strip(), None
    except (KeyError, IndexError, TypeError):
        return None, "魔搭 API 返回格式无法解析。"


def answer_question(question: str, top_k: int = DEFAULT_TOP_K) -> tuple[str, str]:
    question = normalize_spaces(question)
    if not question:
        return "请输入一个研究问题。", ""
    if len(question) > MAX_QUESTION_CHARS:
        return f"问题太长，请控制在 {MAX_QUESTION_CHARS} 个字符以内。", ""

    try:
        index = get_index()
    except RuntimeError as error:
        return str(error), ""

    results = index.search(question, top_k)
    if not results or results[0][1] < 0.2:
        return "当前资料库没有足够依据。", sources_markdown(results)

    if os.getenv("MODELSCOPE_API_TOKEN") or os.getenv("MODELSCOPE_TOKEN"):
        allowed, quota_message = claim_generation_quota()
        if not allowed:
            fallback = (
                f"{quota_message}\n\n"
                "我先不调用魔搭模型，以避免继续消耗免费额度。下面是当前检索到的相关来源。"
            )
            return fallback, sources_markdown(results)
    else:
        quota_message = quota_label()

    answer, error = call_modelscope(question, results)
    if answer:
        return f"{answer}\n\n---\n{quota_message}", sources_markdown(results)

    fallback = (
        "我找到了相关资料，但生成服务暂时不可用。"
        f"{error or ''}\n\n"
        "你可以先查看右侧引用来源；恢复魔搭模型调用后，这里会生成完整回答。"
    )
    return fallback, sources_markdown(results)


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
