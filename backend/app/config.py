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
