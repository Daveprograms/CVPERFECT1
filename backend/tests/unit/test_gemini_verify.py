"""Tests for Gemini API key verification helper (no live API by default)."""

from unittest.mock import MagicMock, patch

from app.services.gemini_service import verify_gemini_api_key


def test_verify_gemini_api_key_rejects_missing_key():
    ok, msg = verify_gemini_api_key(api_key="")
    assert ok is False
    assert "missing" in msg.lower() or "placeholder" in msg.lower()


def test_verify_gemini_api_key_rejects_placeholder():
    ok, msg = verify_gemini_api_key(api_key="your-existing-gemini-api-key")
    assert ok is False


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
def test_verify_gemini_api_key_success(mock_configure, mock_model_cls):
    mock_resp = MagicMock()
    mock_resp.text = "OK"
    mock_model_cls.return_value.generate_content.return_value = mock_resp

    ok, msg = verify_gemini_api_key(api_key="fake-key-for-test")

    assert ok is True
    assert msg == ""
    mock_configure.assert_called_once_with(api_key="fake-key-for-test")
    assert mock_model_cls.call_count >= 1
    assert mock_model_cls.return_value.generate_content.call_count >= 1
