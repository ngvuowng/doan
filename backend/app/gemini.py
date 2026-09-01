"""Gọi Gemini qua REST bằng httpx.

Cố tình không dùng SDK `google-genai`: cả dự án chỉ cần đúng một lời gọi HTTP, thêm
SDK là kéo theo cả chuỗi phụ thuộc mà `requirements.txt` đang giữ rất gọn.
"""

import httpx

from app.config import (
    GEMINI_API_KEY,
    GEMINI_MOCK,
    GEMINI_MODEL,
    GEMINI_TIMEOUT_SECONDS,
)

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Câu trả lời bị bộ lọc an toàn chặn: vẫn đáp lịch sự thay vì ném lỗi kỹ thuật ra khách.
BLOCKED_REPLY = (
    "Xin lỗi bạn, câu này mình chưa trả lời được. Bạn hỏi mình về hoa quả, cách bảo "
    "quản hay công thức nước ép nhé."
)

NOT_CONFIGURED_MESSAGE = (
    "Trợ lý ảo chưa được cấu hình. Bạn dùng trang Liên hệ để được hỗ trợ nhé."
)

# Dùng lại một client duy nhất để tái sử dụng kết nối TLS. `httpx.Client` an toàn khi
# nhiều luồng cùng gửi request — endpoint /api/chat khai báo `def` nên FastAPI chạy nó
# trên threadpool chứ không phải trên event loop.
_client = httpx.Client(
    timeout=httpx.Timeout(GEMINI_TIMEOUT_SECONDS, connect=5.0),
    headers={"Content-Type": "application/json"},
)


class GeminiError(RuntimeError):
    """Lỗi khi gọi Gemini. `status_code` là mã HTTP router sẽ trả về cho frontend."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def is_configured() -> bool:
    """Có gọi được trợ lý không. Kiểm trước khi chạm CSDL để không lưu hội thoại cụt."""
    return bool(GEMINI_API_KEY) or GEMINI_MOCK


def generate_reply(system_prompt: str, history: list[tuple[str, str]], message: str) -> str:
    """Trả về câu trả lời dạng văn bản thuần. `history` là các cặp (role, content)."""
    if GEMINI_MOCK:
        return (
            "[CHẾ ĐỘ THỬ — chưa gắn khoá Gemini] Mình đã nhận câu hỏi: "
            f"“{message}”. Khi có GEMINI_API_KEY, câu trả lời thật sẽ hiện ở đây."
        )
    if not GEMINI_API_KEY:
        raise GeminiError(503, NOT_CONFIGURED_MESSAGE)

    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [
            {"role": role, "parts": [{"text": content}]} for role, content in history
        ]
        + [{"role": "user", "parts": [{"text": message}]}],
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.9,
            "maxOutputTokens": 800,
            # Gemini 2.5 Flash mặc định bật "thinking"; phần suy nghĩ ăn hết
            # maxOutputTokens và trả về `parts` rỗng. Tư vấn bán hàng không cần suy
            # luận sâu nên tắt hẳn cho nhanh và rẻ.
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    try:
        # Đặt khoá ở header thay vì ?key=... để khoá không lọt vào log truy cập.
        response = _client.post(
            f"{BASE_URL}/{GEMINI_MODEL}:generateContent",
            json=payload,
            headers={"x-goog-api-key": GEMINI_API_KEY},
        )
    except httpx.TimeoutException as error:
        raise GeminiError(
            504, "Trợ lý ảo phản hồi hơi lâu. Bạn thử gửi lại câu hỏi giúp mình nhé."
        ) from error
    except httpx.HTTPError as error:
        raise GeminiError(
            502, "Hiện chưa kết nối được tới trợ lý ảo. Bạn thử lại sau ít phút nhé."
        ) from error

    if response.status_code in (401, 403):
        raise GeminiError(503, "Khoá API của trợ lý ảo không hợp lệ hoặc đã hết hạn.")
    if response.status_code == 429:
        raise GeminiError(429, "Trợ lý ảo đang quá tải. Bạn chờ một chút rồi hỏi lại nhé.")
    if response.status_code >= 400:
        raise GeminiError(502, "Trợ lý ảo đang bận. Bạn thử lại sau ít phút nhé.")

    return _read_text(response.json())


def _read_text(data: dict) -> str:
    """Rút văn bản khỏi phản hồi; mọi đường cụt đều rơi về BLOCKED_REPLY."""
    candidates = data.get("candidates") or []
    if not candidates:
        # promptFeedback.blockReason: câu hỏi bị chặn ngay từ đầu vào.
        return BLOCKED_REPLY

    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(part.get("text", "") for part in parts).strip()
    # finishReason SAFETY / MAX_TOKENS / RECITATION đều cho `parts` rỗng.
    return text or BLOCKED_REPLY
