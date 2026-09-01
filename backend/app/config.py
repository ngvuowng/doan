"""Đọc cấu hình từ backend/.env."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "")
AUTH_SECRET = os.getenv("AUTH_SECRET", "")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

# Phiên đăng nhập 7 ngày, khớp với maxAge của cookie bên Next.js.
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

if not DATABASE_URL:
    raise RuntimeError("Thiếu DATABASE_URL trong backend/.env")
if not AUTH_SECRET:
    raise RuntimeError("Thiếu AUTH_SECRET trong backend/.env")

# ---------- Trợ lý ảo (Gemini) ----------
# Cố tình KHÔNG fail-fast như DATABASE_URL/AUTH_SECRET ở trên: thiếu khoá thì cả
# website vẫn chạy bình thường, chỉ riêng /api/chat trả 503 kèm thông báo tiếng Việt.
# Nhờ vậy tính năng này viết, chạy và kiểm thử được trước khi có khoá thật.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "25"))
# Bật (=1) để thử toàn bộ luồng chat — lưu CSDL, lịch sử, giao diện — khi chưa có khoá.
GEMINI_MOCK = os.getenv("GEMINI_MOCK", "") == "1"

# Số sản phẩm tối đa nhồi vào system prompt mỗi lượt hỏi.
CHAT_CATALOG_LIMIT = 80
# Số tin nhắn cũ phát lại cho Gemini (6 lượt hỏi–đáp gần nhất).
CHAT_HISTORY_MESSAGES = 12
# Chống lạm dụng: mỗi phiên gửi tối đa ngần này câu hỏi trong CHAT_RATE_WINDOW_MINUTES phút.
CHAT_RATE_LIMIT = int(os.getenv("GEMINI_RATE_LIMIT", "20"))
CHAT_RATE_WINDOW_MINUTES = 10
