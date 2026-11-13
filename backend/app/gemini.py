"""Gọi Gemini qua REST bằng httpx.

Cố tình không dùng SDK `google-genai`: cả dự án chỉ cần đúng một lời gọi HTTP, thêm
SDK là kéo theo cả chuỗi phụ thuộc mà `requirements.txt` đang giữ rất gọn.

Gemini thỉnh thoảng trả 503 ("model is overloaded") hoặc treo hàng chục giây. Gọi đúng
một lần thì khách thấy lỗi và phải bấm "Thử lại", nên `generate_reply` tự thử lại cùng
model một nhịp, rồi chuyển sang các model dự phòng, tất cả trong một hạn chót chung
(GEMINI_TIMEOUT_SECONDS) để khách không phải chờ lâu hơn trước.
"""

import logging
import random
import time

import httpx

from app.config import (
    GEMINI_API_KEY,
    GEMINI_ATTEMPT_TIMEOUT_SECONDS,
    GEMINI_FALLBACK_MODELS,
    GEMINI_MOCK,
    GEMINI_MODEL,
    GEMINI_TIMEOUT_SECONDS,
)

# Mượn logger của uvicorn: dự án không cấu hình logging riêng, còn logger này đã có sẵn
# handler nên dòng log hiện ngay trong cửa sổ backend, cùng định dạng "WARNING:  ...".
logger = logging.getLogger("uvicorn.error")

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Câu trả lời bị bộ lọc an toàn chặn: vẫn đáp lịch sự thay vì ném lỗi kỹ thuật ra khách.
BLOCKED_REPLY = (
    "Xin lỗi bạn, câu này mình chưa trả lời được. Bạn hỏi mình về hoa quả, cách bảo "
    "quản hay công thức nước ép nhé."
)

NOT_CONFIGURED_MESSAGE = (
    "Trợ lý ảo chưa được cấu hình. Bạn dùng trang Liên hệ để được hỗ trợ nhé."
)
TIMEOUT_MESSAGE = "Trợ lý ảo phản hồi hơi lâu. Bạn thử gửi lại câu hỏi giúp mình nhé."
NETWORK_MESSAGE = "Hiện chưa kết nối được tới trợ lý ảo. Bạn thử lại sau ít phút nhé."
BAD_KEY_MESSAGE = "Khoá API của trợ lý ảo không hợp lệ hoặc đã hết hạn."
RATE_LIMIT_MESSAGE = "Trợ lý ảo đang quá tải. Bạn chờ một chút rồi hỏi lại nhé."
BUSY_MESSAGE = "Trợ lý ảo đang bận. Bạn thử lại sau ít phút nhé."

# Mã Gemini trả khi máy chủ của họ nghẽn tạm thời: chờ một nhịp rồi gọi lại chính model
# đó thường là được. Các lỗi khác (429 hết hạn mức, 404 model đã tắt, 400...) gọi lại
# cũng vậy nên chuyển thẳng sang model kế.
RETRY_SAME_MODEL = {500, 502, 503, 504}
RETRY_DELAY_SECONDS = 1.0
# Thời gian còn lại ít hơn ngần này thì thôi, gọi cũng không kịp nhận câu trả lời.
MIN_ATTEMPT_SECONDS = 2.0

# Dùng lại một client duy nhất để tái sử dụng kết nối TLS. `httpx.Client` an toàn khi
# nhiều luồng cùng gửi request — endpoint /api/chat khai báo `def` nên FastAPI chạy nó
# trên threadpool chứ không phải trên event loop. Timeout thật đặt theo từng lần gọi.
_client = httpx.Client(
    timeout=httpx.Timeout(GEMINI_ATTEMPT_TIMEOUT_SECONDS, connect=5.0),
    headers={"Content-Type": "application/json"},
)


class GeminiError(RuntimeError):
    """Lỗi khi gọi Gemini. `status_code` là mã HTTP router sẽ trả về cho frontend."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class _AttemptFailed(Exception):
    """Một lần gọi hỏng. `reason` chỉ để ghi log, `error` là thứ báo cho khách nếu hết cách."""

    def __init__(
        self, error: GeminiError, reason: str, *, retry_same: bool = False, fatal: bool = False
    ):
        super().__init__(reason)
        self.error = error
        self.reason = reason
        self.retry_same = retry_same
        self.fatal = fatal


def is_configured() -> bool:
    """Có gọi được trợ lý không. Kiểm trước khi chạm CSDL để không lưu hội thoại cụt."""
    return bool(GEMINI_API_KEY) or GEMINI_MOCK


def generate_reply(
    system_prompt: str,
    history: list[tuple[str, str]],
    message: str,
    temperature: float = 0.4,
) -> str:
    """Trả về câu trả lời dạng văn bản thuần. `history` là các cặp (role, content).

    `temperature` do chủ đề quyết định (app/chat_modes.py): tra cứu giá cần chính xác
    nên thấp, gợi ý công thức cần đa dạng nên cao hơn.
    """
    if GEMINI_MOCK:
        return (
            "[CHẾ ĐỘ THỬ — chưa gắn khoá Gemini] Mình đã nhận câu hỏi: "
            f"“{message}”. Khi có GEMINI_API_KEY, câu trả lời thật sẽ hiện ở đây."
        )
    if not GEMINI_API_KEY:
        raise GeminiError(503, NOT_CONFIGURED_MESSAGE)

    contents = [
        {"role": role, "parts": [{"text": content}]} for role, content in history
    ] + [{"role": "user", "parts": [{"text": message}]}]

    deadline = time.monotonic() + GEMINI_TIMEOUT_SECONDS
    last_error = GeminiError(504, TIMEOUT_MESSAGE)
    attempt = 0

    # dict.fromkeys: bỏ model trùng nhưng giữ thứ tự (model chính luôn đứng đầu).
    for model in dict.fromkeys([GEMINI_MODEL, *GEMINI_FALLBACK_MODELS]):
        for round_ in range(2):
            if round_ > 0:
                delay = RETRY_DELAY_SECONDS + random.uniform(0, 0.5)
                if deadline - time.monotonic() - delay < MIN_ATTEMPT_SECONDS:
                    break
                time.sleep(delay)

            remaining = deadline - time.monotonic()
            if remaining < MIN_ATTEMPT_SECONDS:
                logger.warning(
                    "Gemini: hết %.0fs chờ sau %d lần thử", GEMINI_TIMEOUT_SECONDS, attempt
                )
                raise last_error

            attempt += 1
            started = time.monotonic()
            try:
                text = _call_once(
                    model,
                    system_prompt,
                    contents,
                    temperature,
                    timeout=min(GEMINI_ATTEMPT_TIMEOUT_SECONDS, remaining),
                )
            except _AttemptFailed as failure:
                logger.warning(
                    "Gemini %s lần thử %d hỏng sau %.1fs: %s",
                    model,
                    attempt,
                    time.monotonic() - started,
                    failure.reason,
                )
                last_error = failure.error
                if failure.fatal:
                    raise failure.error from failure
                if failure.retry_same:
                    continue
                break

            if attempt > 1:
                logger.info("Gemini %s trả lời được ở lần thử %d", model, attempt)
            return text

    raise last_error


def _call_once(
    model: str,
    system_prompt: str,
    contents: list[dict],
    temperature: float,
    timeout: float,
) -> str:
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "topP": 0.9,
            "maxOutputTokens": 800,
            "thinkingConfig": _thinking_config(model),
        },
    }

    try:
        # Đặt khoá ở header thay vì ?key=... để khoá không lọt vào log truy cập.
        response = _client.post(
            f"{BASE_URL}/{model}:generateContent",
            json=payload,
            headers={"x-goog-api-key": GEMINI_API_KEY},
            timeout=httpx.Timeout(timeout, connect=min(5.0, timeout)),
        )
    except httpx.TimeoutException as error:
        raise _AttemptFailed(
            GeminiError(504, TIMEOUT_MESSAGE), f"quá {timeout:.0f}s không trả lời"
        ) from error
    except httpx.HTTPError as error:
        raise _AttemptFailed(
            GeminiError(502, NETWORK_MESSAGE),
            f"lỗi mạng {type(error).__name__}: {error}",
            retry_same=True,
        ) from error

    status_code = response.status_code
    if status_code < 400:
        return _read_text(response.json(), model)

    summary = _error_summary(response)
    reason = f"HTTP {status_code} {summary}"
    # Khoá sai thì Gemini thường trả 400 "API key not valid", đôi khi 401/403. Đổi model
    # cũng không cứu được nên dừng ngay.
    if status_code in (401, 403) or "API key" in summary:
        raise _AttemptFailed(GeminiError(503, BAD_KEY_MESSAGE), reason, fatal=True)
    if status_code == 429:
        raise _AttemptFailed(GeminiError(429, RATE_LIMIT_MESSAGE), reason)
    raise _AttemptFailed(
        GeminiError(502, BUSY_MESSAGE), reason, retry_same=status_code in RETRY_SAME_MODEL
    )


def _thinking_config(model: str) -> dict:
    """Tắt (hoặc giảm tối đa) phần "thinking": tư vấn bán hàng không cần suy luận sâu, mà
    phần suy nghĩ còn ăn vào maxOutputTokens, có khi trả về `parts` rỗng.

    Đời 2.x chỉ hiểu `thinkingBudget` (0 = tắt hẳn); từ đời 3 dùng `thinkingLevel`, gửi
    nhầm kiểu là Gemini trả 400. "minimal" gần như tắt hẳn, nhưng gemini-3.8-flash và
    đời 4 không nhận mức này, thấp nhất chỉ là "low".
    """
    if model.startswith("gemini-2."):
        return {"thinkingBudget": 0}
    if model == "gemini-3.8-flash" or model.startswith("gemini-4"):
        return {"thinkingLevel": "LOW"}
    return {"thinkingLevel": "MINIMAL"}


def _error_summary(response: httpx.Response) -> str:
    """`error.status` + `error.message` của Gemini, rút gọn để ghi một dòng log."""
    try:
        data = response.json()
        if isinstance(data, list) and data:
            data = data[0]
        error = data.get("error") or {}
        text = f"{error.get('status', '')} {error.get('message', '')}"
    except (ValueError, AttributeError):
        text = response.text
    return " ".join(text.split())[:200]


def _read_text(data: dict, model: str) -> str:
    """Rút văn bản khỏi phản hồi; mọi đường cụt đều rơi về BLOCKED_REPLY."""
    candidates = data.get("candidates") or []
    if not candidates:
        # promptFeedback.blockReason: câu hỏi bị chặn ngay từ đầu vào.
        block_reason = (data.get("promptFeedback") or {}).get("blockReason")
        logger.warning("Gemini %s không trả lời, blockReason=%s", model, block_reason)
        return BLOCKED_REPLY

    candidate = candidates[0]
    parts = (candidate.get("content") or {}).get("parts") or []
    text = "".join(part.get("text", "") for part in parts).strip()
    if not text:
        # finishReason SAFETY / MAX_TOKENS / RECITATION đều cho `parts` rỗng.
        logger.warning(
            "Gemini %s trả lời rỗng, finishReason=%s", model, candidate.get("finishReason")
        )
    return text or BLOCKED_REPLY
