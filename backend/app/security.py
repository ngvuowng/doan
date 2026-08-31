"""Băm mật khẩu và ký JWT.

Giữ đúng thuật toán của bản Next.js cũ để dữ liệu tương thích:
  - bcrypt (chuỗi băm `$2b$...`, cùng định dạng với bcryptjs)
  - JWT HS256, `sub` là id người dùng
"""

from datetime import datetime, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import AUTH_SECRET, TOKEN_TTL_SECONDS

ALGORITHM = "HS256"

# bcrypt chỉ dùng 72 byte đầu; bcryptjs cắt ngầm còn thư viện bcrypt của Python
# thì báo lỗi, nên cắt tay để hai bên hành xử giống nhau.
BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:BCRYPT_MAX_BYTES], bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:BCRYPT_MAX_BYTES], password_hash.encode())
    except ValueError:
        # Chuỗi băm hỏng trong CSDL: coi như sai mật khẩu, không làm sập API.
        return False


def create_token(user_id: str, email: str, name: str, role: str) -> str:
    now = int(datetime.now(timezone.utc).timestamp())
    return jwt.encode(
        {
            "sub": user_id,
            "email": email,
            "name": name,
            "role": role,
            "iat": now,
            "exp": now + TOKEN_TTL_SECONDS,
        },
        AUTH_SECRET,
        algorithm=ALGORITHM,
    )


def read_token(token: str) -> dict | None:
    """Trả payload nếu token hợp lệ và còn hạn, ngược lại trả None."""
    try:
        return jwt.decode(token, AUTH_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None
