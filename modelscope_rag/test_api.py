from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

os.environ["RAG_DATA_BASE_URL"] = str(Path(__file__).resolve().parents[1] / "data")
os.environ["RAG_QUOTA_STATE_FILE"] = str(Path(tempfile.gettempdir()) / "aiedcase-test-quota.json")
os.environ.pop("MODELSCOPE_API_TOKEN", None)
os.environ.pop("MODELSCOPE_TOKEN", None)

from modelscope_rag import app


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


if __name__ == "__main__":
    unittest.main()
