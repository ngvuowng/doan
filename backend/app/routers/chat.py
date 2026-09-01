"""Trợ lý tư vấn bán hàng chạy trên Gemini.

Các route ở đây khai báo `def` chứ không `async def`, giống 7 router còn lại: FastAPI
chạy route đồng bộ trên threadpool nên khoảng chờ Gemini (tối đa GEMINI_TIMEOUT_SECONDS)
không chặn event loop. Viết `async def` mà bên trong vẫn gọi SQLAlchemy đồng bộ thì mới
là thứ làm nghẽn cả server.
"""

import hashlib
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import gemini
from app.chat_prompt import build_system_prompt, load_catalog, match_products
from app.config import (
    AUTH_SECRET,
    CHAT_HISTORY_MESSAGES,
    CHAT_RATE_LIMIT,
    CHAT_RATE_WINDOW_MINUTES,
)
from app.deps import DbSession, OptionalUser
from app.models import ChatMessage, ChatSession, User, utcnow
from app.schemas import ChatHistoryOut, ChatIn, ChatMessageOut, ChatOut, ProductCard

router = APIRouter(prefix="/api/chat", tags=["chat"])

TOO_MANY_MESSAGE = "Bạn đang gửi hơi nhanh. Chờ giúp mình một chút rồi hỏi tiếp nhé."


def _ip_hash(request: Request) -> str | None:
    """Băm IP kèm muối để đếm hạn mức mà không lưu địa chỉ thật của khách."""
    host = request.client.host if request.client else None
    if not host:
        return None
    return hashlib.sha256(f"{AUTH_SECRET}:{host}".encode()).hexdigest()


def _find_session(db: Session, client_key: str) -> ChatSession | None:
    return db.execute(
        select(ChatSession).where(ChatSession.client_key == client_key)
    ).scalar_one_or_none()


def _assert_owner(session: ChatSession, user: User | None) -> None:
    """Phiên đã gắn tài khoản thì người khác không đọc được, dù có biết client_key."""
    if session.user_id and (user is None or user.id != session.user_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bạn không xem được cuộc trò chuyện này.")


def _assert_within_rate_limit(
    db: Session, session: ChatSession | None, ip_hash: str | None
) -> None:
    """Chặn spam và chặn tốn tiền gọi API. Đếm trong CSDL nên không cần thêm hạ tầng."""
    since = utcnow() - timedelta(minutes=CHAT_RATE_WINDOW_MINUTES)
    base = (
        select(func.count())
        .select_from(ChatMessage)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .where(ChatMessage.role == "user", ChatMessage.created_at >= since)
    )

    if session is not None:
        used = db.execute(base.where(ChatSession.id == session.id)).scalar_one()
        if used >= CHAT_RATE_LIMIT:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, TOO_MANY_MESSAGE)

    if ip_hash:
        # Nới hơn cho IP vì cả một mạng LAN (trường học, quán cà phê) có thể dùng chung.
        used_ip = db.execute(base.where(ChatSession.ip_hash == ip_hash)).scalar_one()
        if used_ip >= CHAT_RATE_LIMIT * 3:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, TOO_MANY_MESSAGE)


@router.post("/messages", response_model=ChatOut)
def send_message(data: ChatIn, request: Request, db: DbSession, user: OptionalUser):
    """Gửi câu hỏi cho trợ lý và nhận câu trả lời trong một lượt (không streaming)."""
    # Kiểm cấu hình TRƯỚC khi chạm vào CSDL: thiếu khoá thì không để lại hội thoại cụt
    # (chỉ có câu hỏi, không có câu trả lời) trong bảng.
    if not gemini.is_configured():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, gemini.NOT_CONFIGURED_MESSAGE)

    session = _find_session(db, data.client_key)
    if session is not None:
        _assert_owner(session, user)
    ip_hash = _ip_hash(request)
    _assert_within_rate_limit(db, session, ip_hash)

    products, total = load_catalog(db)
    system_prompt = build_system_prompt(products, total)

    history: list[tuple[str, str]] = []
    if session is not None:
        # Lấy các tin mới nhất rồi đảo lại: Gemini cần thứ tự cũ -> mới.
        recent = (
            db.execute(
                select(ChatMessage)
                .where(ChatMessage.session_id == session.id)
                .order_by(ChatMessage.created_at.desc())
                .limit(CHAT_HISTORY_MESSAGES)
            )
            .scalars()
            .all()
        )
        history = [(m.role, m.content) for m in reversed(recent)]

    try:
        reply_text = gemini.generate_reply(system_prompt, history, data.message)
    except gemini.GeminiError as error:
        raise HTTPException(error.status_code, error.message) from error

    # Chỉ ghi CSDL khi đã có câu trả lời: lịch sử luôn xen kẽ user/model đúng như Gemini
    # mong đợi, và một lần gọi lỗi không để lại rác.
    if session is None:
        session = ChatSession(
            client_key=data.client_key,
            ip_hash=ip_hash,
            title=data.message[:120],
        )
        db.add(session)
    if user is not None:
        session.user_id = user.id
    session.updated_at = utcnow()

    db.add(ChatMessage(session=session, role="user", content=data.message))
    reply = ChatMessage(session=session, role="model", content=reply_text)
    db.add(reply)
    db.commit()
    db.refresh(reply)

    return ChatOut(
        session_id=session.id,
        reply=ChatMessageOut.model_validate(reply),
        suggestions=[ProductCard.model_validate(p) for p in match_products(reply_text, products)],
    )


@router.get("/sessions/{client_key}", response_model=ChatHistoryOut)
def get_history(client_key: str, db: DbSession, user: OptionalUser):
    """Lịch sử của một client_key.

    Chưa có hội thoại thì trả danh sách rỗng chứ không phải 404 — lần mở khung chat đầu
    tiên của mỗi khách không nên đi vào đường lỗi.
    """
    session = _find_session(db, client_key)
    if session is None:
        return ChatHistoryOut()
    _assert_owner(session, user)

    messages = (
        db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.asc())
        )
        .scalars()
        .all()
    )
    return ChatHistoryOut(
        session_id=session.id,
        messages=[ChatMessageOut.model_validate(m) for m in messages],
    )


@router.delete("/sessions/{client_key}", status_code=status.HTTP_204_NO_CONTENT)
def clear_history(client_key: str, db: DbSession, user: OptionalUser):
    """Khách bấm "Xoá cuộc trò chuyện". Tin nhắn đi theo nhờ ON DELETE CASCADE."""
    session = _find_session(db, client_key)
    if session is None:
        return  # Xoá hai lần vẫn coi là thành công.
    _assert_owner(session, user)
    db.delete(session)
    db.commit()
