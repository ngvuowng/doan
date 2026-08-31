from fastapi import APIRouter, status

from app.deps import DbSession
from app.models import ContactMessage
from app.schemas import ContactIn, ContactOut

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_message(data: ContactIn, db: DbSession):
    message = ContactMessage(
        name=data.name,
        email=data.email,
        phone=data.phone or None,
        subject=data.subject or None,
        message=data.message,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
