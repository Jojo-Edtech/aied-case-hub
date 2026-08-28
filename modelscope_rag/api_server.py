from __future__ import annotations

import json
import os
import threading
import time
from collections import defaultdict, deque
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from ipaddress import ip_address
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
MAX_TRACKED_CLIENTS = int(os.getenv("AIEDCASE_MAX_TRACKED_CLIENTS", "10000"))


def normalize_allowed_origin(value: str) -> str | None:
    candidate = value.strip()
    if not candidate or "\r" in candidate or "\n" in candidate:
        return None
    parsed = urlparse(candidate)
    try:
        port = parsed.port
    except ValueError:
        return None
    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or port not in {None, 80, 443, 4173, 4175}
    ):
        return None
    if parsed.path not in {"", "/"} or parsed.params or parsed.query or parsed.fragment:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def normalize_client_key(peer: str, real_ip: str = "", forwarded_for: str = "") -> str:
    try:
        peer_address = ip_address(peer.strip())
    except ValueError:
        return "unknown"
    if not peer_address.is_loopback:
        return peer_address.compressed

    candidates = [real_ip.strip()]
    candidates.extend(part.strip() for part in reversed(forwarded_for.split(",")) if part.strip())
    for candidate in candidates:
        try:
            return ip_address(candidate).compressed
        except ValueError:
            continue
    return peer_address.compressed


ALLOWED_ORIGINS = {
    normalized
    for raw_origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "https://jojo-edtech.github.io,http://127.0.0.1:4173,http://localhost:4173",
    ).split(",")
    if (normalized := normalize_allowed_origin(raw_origin)) is not None
}


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: int = 3600, max_clients: int = 10000) -> None:
        self.limit = max(1, limit)
        self.window_seconds = max(60, window_seconds)
        self.max_clients = max(100, max_clients)
        self.events: dict[str, deque[float]] = defaultdict(deque)
        self.lock = threading.Lock()
        self.last_cleanup = 0.0

    def allow(self, key: str) -> tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self.lock:
            if now - self.last_cleanup >= 60 or len(self.events) >= self.max_clients:
                for existing_key, existing_bucket in list(self.events.items()):
                    while existing_bucket and existing_bucket[0] < cutoff:
                        existing_bucket.popleft()
                    if not existing_bucket:
                        self.events.pop(existing_key, None)
                self.last_cleanup = now
            if key not in self.events and len(self.events) >= self.max_clients:
                key = "__overflow__"
            bucket = self.events[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.limit:
                retry_after = max(1, int(self.window_seconds - (now - bucket[0])))
                return False, retry_after
            bucket.append(now)
            return True, 0


LIMITER = SlidingWindowLimiter(REQUESTS_PER_HOUR, max_clients=MAX_TRACKED_CLIENTS)


class ApiHandler(BaseHTTPRequestHandler):
    server_version = "AIEDCaseAPI"
    sys_version = ""

    def log_message(self, format: str, *args: Any) -> None:
        # Never log request bodies or authorization data.
        super().log_message(format, *args)

    def origin(self) -> str:
        return self.headers.get("Origin", "").strip()

    def allowed_origin(self) -> str | None:
        requested = self.origin()
        return next((allowed for allowed in ALLOWED_ORIGINS if requested == allowed), None)

    def origin_allowed(self) -> bool:
        return not self.origin() or self.allowed_origin() is not None

    def client_key(self) -> str:
        return normalize_client_key(
            self.client_address[0],
            self.headers.get("X-Real-IP", ""),
            self.headers.get("X-Forwarded-For", ""),
        )

    def api_path(self) -> str:
        path = urlparse(self.path).path.rstrip("/") or "/"
        prefix = "/aiedcase-api"
        if path == prefix:
            return "/"
        if path.startswith(f"{prefix}/"):
            return path[len(prefix) :]
        return path

    def send_security_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

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
        self.send_security_headers()
        allowed_origin = self.allowed_origin()
        if allowed_origin is not None:
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
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
        allowed_origin = self.allowed_origin()
        if allowed_origin is not None:
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Vary", "Origin")
        self.send_security_headers()
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
        if self.headers.get_content_type() != "application/json":
            self.send_json(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                {"ok": False, "status": "invalid", "answer": "请求必须使用 application/json。"},
            )
            return None
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

        try:
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
        except Exception as error:
            self.log_error("request failed: %s", type(error).__name__)
            self.send_json(
                HTTPStatus.SERVICE_UNAVAILABLE,
                {"ok": False, "status": "service_error", "answer": "服务暂时不可用。", "sources": []},
            )
            return

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
