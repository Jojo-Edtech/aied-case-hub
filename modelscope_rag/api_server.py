from __future__ import annotations

import json
import os
import threading
import time
from collections import defaultdict, deque
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

try:
    from .app import answer_chat, generate_teacher_tool, get_index, model_generation_configured, quota_label
except ImportError:
    from app import answer_chat, generate_teacher_tool, get_index, model_generation_configured, quota_label


HOST = os.getenv("AIEDCASE_API_HOST", "127.0.0.1")
PORT = int(os.getenv("AIEDCASE_API_PORT", "8792"))
MAX_BODY_BYTES = int(os.getenv("AIEDCASE_MAX_BODY_BYTES", "65536"))
REQUESTS_PER_HOUR = int(os.getenv("AIEDCASE_REQUESTS_PER_HOUR", "24"))
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "https://jojo-edtech.github.io,http://127.0.0.1:4173,http://localhost:4173",
    ).split(",")
    if origin.strip()
}


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: int = 3600) -> None:
        self.limit = max(1, limit)
        self.window_seconds = max(60, window_seconds)
        self.events: dict[str, deque[float]] = defaultdict(deque)
        self.lock = threading.Lock()

    def allow(self, key: str) -> tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self.lock:
            bucket = self.events[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.limit:
                retry_after = max(1, int(self.window_seconds - (now - bucket[0])))
                return False, retry_after
            bucket.append(now)
            return True, 0


LIMITER = SlidingWindowLimiter(REQUESTS_PER_HOUR)


class ApiHandler(BaseHTTPRequestHandler):
    server_version = "AIEDCaseAPI/0.2"

    def log_message(self, format: str, *args: Any) -> None:
        # Never log request bodies or authorization data.
        super().log_message(format, *args)

    def origin(self) -> str:
        return self.headers.get("Origin", "").strip()

    def origin_allowed(self) -> bool:
        origin = self.origin()
        return not origin or origin in ALLOWED_ORIGINS

    def client_key(self) -> str:
        forwarded = self.headers.get("X-Forwarded-For", "").split(",", 1)[0].strip()
        return forwarded or self.client_address[0]

    def api_path(self) -> str:
        path = urlparse(self.path).path.rstrip("/") or "/"
        prefix = "/aiedcase-api"
        if path == prefix:
            return "/"
        if path.startswith(f"{prefix}/"):
            return path[len(prefix) :]
        return path

    def send_json(
        self,
        status: int,
        payload: dict[str, Any],
        *,
        retry_after: int | None = None,
    ) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        origin = self.origin()
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        if retry_after is not None:
            self.send_header("Retry-After", str(retry_after))
        self.end_headers()
        self.wfile.write(encoded)

    def do_OPTIONS(self) -> None:
        if not self.origin_allowed():
            self.send_json(HTTPStatus.FORBIDDEN, {"ok": False, "error": "Origin not allowed"})
            return
        self.send_response(HTTPStatus.NO_CONTENT)
        origin = self.origin()
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def do_GET(self) -> None:
        if self.api_path() != "/health":
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not found"})
            return
        try:
            documents = len(get_index().documents)
        except RuntimeError:
            self.send_json(
                HTTPStatus.SERVICE_UNAVAILABLE,
                {"ok": False, "status": "data_error", "documents": 0},
            )
            return
        self.send_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "status": "ready",
                "documents": documents,
                "generation_configured": model_generation_configured(),
                "quota": quota_label(),
            },
        )

    def read_payload(self) -> dict[str, Any] | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY_BYTES:
            self.send_json(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE if length > MAX_BODY_BYTES else HTTPStatus.BAD_REQUEST,
                {"ok": False, "status": "invalid", "answer": "请求内容为空或过大。"},
            )
            return None
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(
                HTTPStatus.BAD_REQUEST,
                {"ok": False, "status": "invalid", "answer": "请求格式无效。"},
            )
            return None
        if not isinstance(payload, dict):
            self.send_json(
                HTTPStatus.BAD_REQUEST,
                {"ok": False, "status": "invalid", "answer": "请求必须是 JSON 对象。"},
            )
            return None
        return payload

    def do_POST(self) -> None:
        if not self.origin_allowed():
            self.send_json(HTTPStatus.FORBIDDEN, {"ok": False, "status": "forbidden", "answer": "Origin not allowed"})
            return

        path = self.api_path()
        if path not in {"/chat", "/teacher-tool"}:
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not found"})
            return

        allowed, retry_after = LIMITER.allow(self.client_key())
        if not allowed:
            self.send_json(
                HTTPStatus.TOO_MANY_REQUESTS,
                {
                    "ok": False,
                    "status": "rate_limited",
                    "answer": "请求较频繁，请稍后再试。",
                    "sources": [],
                },
                retry_after=retry_after,
            )
            return

        payload = self.read_payload()
        if payload is None:
            return

        if path == "/chat":
            history = payload.get("history", [])
            if not isinstance(history, list):
                history = []
            try:
                top_k = max(3, min(10, int(payload.get("top_k", 6) or 6)))
            except (TypeError, ValueError):
                top_k = 6
            result = answer_chat(
                str(payload.get("question", "")),
                history=history,
                top_k=top_k,
                language=str(payload.get("language", "zh-Hans")),
            )
        else:
            result = generate_teacher_tool(payload)

        status = HTTPStatus.OK
        if result.get("status") == "invalid":
            status = HTTPStatus.BAD_REQUEST
        elif result.get("status") in {"service_error", "data_error"}:
            status = HTTPStatus.SERVICE_UNAVAILABLE
        elif result.get("status") == "rate_limited":
            status = HTTPStatus.TOO_MANY_REQUESTS
        self.send_json(status, result)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), ApiHandler)
    print(f"AIED Case API listening on http://{HOST}:{PORT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
