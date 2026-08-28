from __future__ import annotations

import os
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from io import BytesIO
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

os.environ["RAG_DATA_BASE_URL"] = str(Path(__file__).resolve().parents[1] / "data")
os.environ["RAG_QUOTA_STATE_FILE"] = str(Path(tempfile.gettempdir()) / "aiedcase-test-quota.json")
os.environ.pop("MODELSCOPE_API_TOKEN", None)
os.environ.pop("MODELSCOPE_TOKEN", None)

from modelscope_rag import api_server, app


class ApiSecurityTests(unittest.TestCase):
    def test_allowed_origin_normalization_rejects_header_injection(self) -> None:
        self.assertIsNone(api_server.normalize_allowed_origin("https://example.com\r\nX-Test: injected"))
        self.assertIsNone(api_server.normalize_allowed_origin("https://example.com/path"))
        self.assertIsNone(api_server.normalize_allowed_origin("https://user@example.com"))
        self.assertEqual(api_server.normalize_allowed_origin("https://example.com/"), "https://example.com")

    def test_client_key_ignores_spoofed_forwarded_prefix(self) -> None:
        self.assertEqual(
            api_server.normalize_client_key("127.0.0.1", "203.0.113.20", "1.2.3.4, 5.6.7.8"),
            "203.0.113.20",
        )
        self.assertEqual(
            api_server.normalize_client_key("198.51.100.7", "1.2.3.4", "5.6.7.8"),
            "198.51.100.7",
        )

    def test_limiter_bounds_tracked_client_keys(self) -> None:
        limiter = api_server.SlidingWindowLimiter(2, max_clients=100)
        for index in range(130):
            limiter.allow(f"203.0.113.{index}")
        self.assertLessEqual(len(limiter.events), 101)


class RagApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        app.QUOTA_STATE_FILE = Path(os.environ["RAG_QUOTA_STATE_FILE"])
        app.get_index(refresh=True)

    def setUp(self) -> None:
        try:
            app.QUOTA_STATE_FILE.unlink()
        except FileNotFoundError:
            pass

    def test_index_contains_all_three_libraries(self) -> None:
        index = app.get_index()
        kinds = {document.kind for document in index.documents}
        self.assertGreaterEqual(len(index.documents), 500)
        self.assertEqual(kinds, {"教学案例", "教材资源", "Prompt 模板"})

    def test_chat_returns_structured_sources(self) -> None:
        with patch.dict(os.environ, {"MODELSCOPE_API_TOKEN": "test-token"}):
            with patch.object(app, "call_modelscope_messages", return_value=("可执行回答 [1]", None)):
                result = app.answer_chat("香港中学 AI 教育案例", language="zh-Hans")
        self.assertTrue(result["ok"])
        self.assertEqual(result["status"], "generated")
        self.assertTrue(result["sources"])
        self.assertIn("url", result["sources"][0])

    def test_chat_ignores_non_object_history_entries(self) -> None:
        with patch.dict(os.environ, {"MODELSCOPE_API_TOKEN": "test-token"}):
            with patch.object(app, "call_modelscope_messages", return_value=("可执行回答 [1]", None)):
                result = app.answer_chat("香港中学 AI 教育案例", history=["bad", None, {"role": "user", "content": "hi"}])
        self.assertTrue(result["ok"])

    def test_teacher_tool_requires_core_fields(self) -> None:
        result = app.generate_teacher_tool({"subject": "英语"})
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"], "invalid")

    def test_teacher_tool_uses_retrieved_evidence(self) -> None:
        payload = {
            "output_type": "课堂活动",
            "subject": "科学",
            "level": "中学",
            "topic": "生态系统",
            "language": "zh-Hans",
        }
        with patch.dict(os.environ, {"MODELSCOPE_API_TOKEN": "test-token"}):
            with patch.object(app, "call_modelscope_messages", return_value=("活动方案 [1]", None)):
                result = app.generate_teacher_tool(payload)
        self.assertTrue(result["ok"])
        self.assertEqual(result["answer"], "活动方案 [1]")
        self.assertTrue(result["sources"])

    def test_modelscope_endpoint_is_bound_to_official_https_origin(self) -> None:
        self.assertEqual(app.validate_modelscope_api_url(f"{app.DEFAULT_API_BASE}/"), app.DEFAULT_API_BASE)
        for value in [
            "http://api-inference.modelscope.cn/v1/chat/completions",
            "https://api-inference.modelscope.cn.evil.example/v1/chat/completions",
            "https://user@api-inference.modelscope.cn/v1/chat/completions",
            "https://api-inference.modelscope.cn/v1/chat/completions?next=evil",
        ]:
            with self.assertRaises(ValueError):
                app.validate_modelscope_api_url(value)

    def test_remote_data_base_requires_plain_https(self) -> None:
        self.assertEqual(
            app.validate_remote_data_base("https://jojo-edtech.github.io/aiedcase/data/"),
            "https://jojo-edtech.github.io/aiedcase/data",
        )
        for value in [
            "http://jojo-edtech.github.io/aiedcase/data",
            "https://user@jojo-edtech.github.io/aiedcase/data",
            "https://jojo-edtech.github.io/aiedcase/data?next=evil",
        ]:
            with self.assertRaises(ValueError):
                app.validate_remote_data_base(value)

    def test_remote_response_size_is_bounded(self) -> None:
        class Response:
            def __init__(self, payload: bytes, length: str | None = None) -> None:
                self.headers = {"Content-Length": length} if length is not None else {}
                self.stream = BytesIO(payload)

            def read(self, amount: int) -> bytes:
                return self.stream.read(amount)

        self.assertEqual(app.read_limited_response(Response(b"ok"), 2), b"ok")
        with self.assertRaises(ValueError):
            app.read_limited_response(Response(b"abc"), 2)
        with self.assertRaises(ValueError):
            app.read_limited_response(Response(b"", "3"), 2)
        with self.assertRaises(ValueError):
            app.read_limited_response(Response(b"", "-1"), 2)

    def test_teacher_tool_rejects_non_text_required_fields(self) -> None:
        result = app.generate_teacher_tool(
            {"output_type": None, "subject": ["English"], "level": {}, "topic": 123}
        )
        self.assertEqual(result["status"], "invalid")

    def test_chat_ignores_non_text_history_content(self) -> None:
        with patch.dict(os.environ, {"MODELSCOPE_API_TOKEN": "test-token"}):
            with patch.object(app, "call_modelscope_messages", return_value=("可执行回答 [1]", None)) as call:
                result = app.answer_chat(
                    "香港中学 AI 教育案例",
                    history=[{"role": "user", "content": {"unexpected": "object"}}],
                )
        self.assertTrue(result["ok"])
        messages = call.call_args.args[0]
        self.assertFalse(any(message.get("content") == "{'unexpected': 'object'}" for message in messages))


class ApiHttpBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), api_server.ApiHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self, method: str, path: str, body: bytes | None = None, headers: dict[str, str] | None = None):
        connection = HTTPConnection("127.0.0.1", self.port, timeout=3)
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        payload = response.read()
        result = response.status, dict(response.getheaders()), payload
        connection.close()
        return result

    def test_health_response_hides_runtime_and_sets_security_headers(self) -> None:
        status, headers, payload = self.request("GET", "/health")
        self.assertEqual(status, 200)
        self.assertIn(b'"ok": true', payload)
        self.assertNotIn("Python", headers.get("Server", ""))
        self.assertEqual(headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(headers.get("Cache-Control"), "no-store")
        self.assertIn("frame-ancestors 'none'", headers.get("Content-Security-Policy", ""))

    def test_post_rejects_disallowed_origin_before_processing(self) -> None:
        status, _, _ = self.request(
            "POST",
            "/chat",
            b'{}',
            {"Content-Type": "application/json", "Origin": "https://evil.example"},
        )
        self.assertEqual(status, 403)

    def test_post_requires_json_content_type(self) -> None:
        status, _, _ = self.request("POST", "/chat", b'{}', {"Content-Type": "text/plain"})
        self.assertEqual(status, 415)

    def test_post_rejects_oversized_declared_body(self) -> None:
        status, _, _ = self.request(
            "POST",
            "/chat",
            b'{}',
            {"Content-Type": "application/json", "Content-Length": str(api_server.MAX_BODY_BYTES + 1)},
        )
        self.assertEqual(status, 413)


if __name__ == "__main__":
    unittest.main()
