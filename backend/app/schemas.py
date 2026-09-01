"""Lớp Pydantic cho request/response.

Cột trong MySQL là snake_case, nhưng JSON trả ra phải là camelCase vì frontend
Next.js đang dùng đúng những tên đó (`salePrice`, `hoverImage`, `createdAt`...).
`ApiModel` lo việc đổi tên này ở một chỗ duy nhất.
"""

from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer, computed_field
from pydantic.alias_generators import to_camel


def _iso_utc(value: datetime) -> str:
    """MySQL DATETIME không lưu múi giờ; ta quy ước đã lưu UTC nên gắn lại hậu tố Z.

    Thiếu chữ Z thì `new Date(...)` bên JS sẽ hiểu là giờ địa phương và ngày hiển
    thị có thể lệch một ngày.
    """
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


UtcDatetime = Annotated[datetime, PlainSerializer(_iso_utc, return_type=str)]


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,
    )


# ---------- Danh mục ----------


class CategoryOut(ApiModel):
    id: str
    slug: str
    name: str
    kind: str
    subtitle: str | None = None
    position: int


class CategoryWithCount(CategoryOut):
    product_count: int = 0
    post_count: int = 0


# ---------- Sản phẩm ----------


class ProductCard(ApiModel):
    id: str
    slug: str
    name: str
    price: int
    sale_price: int | None = None
    image: str
    hover_image: str | None = None
    updated_at: UtcDatetime


class ProductOut(ProductCard):
    short_description: str
    description: str
    stock: int
    created_at: UtcDatetime
    categories: list[CategoryOut] = []


class ProductDetail(ProductOut):
    related: list[ProductCard] = []


class ProductPage(ApiModel):
    items: list[ProductCard]
    total: int
    page: int
    page_size: int | None = None


class ProductIn(ApiModel):
    name: str = Field(min_length=2)
    slug: str = Field(min_length=1, pattern=r"^[a-z0-9-]+$")
    price: int = Field(gt=0)
    sale_price: int | None = Field(default=None, gt=0)
    stock: int = Field(ge=0)
    image: str = Field(min_length=1)
    hover_image: str | None = None
    short_description: str = Field(min_length=5)
    description: str = Field(min_length=5)
    category_ids: list[str] = []


# ---------- Bài viết ----------


class PostCard(ApiModel):
    id: str
    slug: str
    title: str
    excerpt: str
    image: str
    published_at: UtcDatetime


class PostOut(PostCard):
    content: str
    categories: list[CategoryOut] = []


# ---------- Người dùng & xác thực ----------


class UserOut(ApiModel):
    id: str
    email: str
    name: str
    role: str
    phone: str | None = None
    address: str | None = None


class AuthOut(ApiModel):
    token: str
    user: UserOut


class LoginIn(ApiModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RegisterIn(ApiModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)


class ProfileIn(ApiModel):
    name: str = Field(min_length=2)
    phone: str | None = None
    address: str | None = None


# ---------- Đơn hàng ----------


class OrderItemOut(ApiModel):
    id: str
    order_id: str
    product_id: str | None = None
    name: str
    price: int
    quantity: int
    image: str


class OrderOut(ApiModel):
    id: str
    code: str
    user_id: str | None = None
    customer_name: str
    email: str
    phone: str
    address: str
    note: str | None = None
    payment_method: str
    status: str
    total: int
    created_at: UtcDatetime
    updated_at: UtcDatetime
    items: list[OrderItemOut] = []

    @computed_field
    @property
    def item_count(self) -> int:
        """Suy ra từ `items` để không phải vá tay ở từng router."""
        return len(self.items)


class OrderLineIn(ApiModel):
    product_id: str = Field(min_length=1)
    quantity: int = Field(gt=0, le=999)


class OrderIn(ApiModel):
    customer_name: str = Field(min_length=2)
    email: EmailStr
    phone: str = Field(pattern=r"^0\d{9,10}$")
    address: str = Field(min_length=8)
    note: str | None = Field(default=None, max_length=500)
    payment_method: Literal["COD", "BANK"] = "COD"
    items: list[OrderLineIn] = Field(min_length=1)


class OrderStatusIn(ApiModel):
    status: Literal["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]


# ---------- Liên hệ ----------


class ContactIn(ApiModel):
    name: str = Field(min_length=2)
    email: EmailStr
    phone: str | None = None
    subject: str | None = Field(default=None, max_length=150)
    message: str = Field(min_length=10)


class ContactOut(ApiModel):
    id: str
    name: str
    email: str
    phone: str | None = None
    subject: str | None = None
    message: str
    handled: bool
    created_at: UtcDatetime


# ---------- Trợ lý ảo ----------


class ChatMessageOut(ApiModel):
    id: str
    role: str  # "user" | "model"
    content: str
    created_at: UtcDatetime


class ChatIn(ApiModel):
    # UUID do trình duyệt sinh và giữ ở localStorage, dùng để nhận lại phiên sau khi tải lại trang.
    client_key: str = Field(min_length=8, max_length=64)
    message: str = Field(min_length=1, max_length=1000)


class ChatOut(ApiModel):
    session_id: str
    reply: ChatMessageOut
    # Sản phẩm được nhắc tên trong câu trả lời. Giá và slug lấy thẳng từ CSDL nên giao
    # diện luôn hiện đúng giá, kể cả khi model nói sai số trong câu chữ.
    suggestions: list[ProductCard] = []


class ChatHistoryOut(ApiModel):
    """`session_id` là None khi client_key chưa từng có hội thoại nào."""

    session_id: str | None = None
    messages: list[ChatMessageOut] = []


class ChatSessionSummary(ApiModel):
    id: str
    client_key: str
    user_name: str | None = None
    user_email: str | None = None
    title: str | None = None
    message_count: int = 0
    created_at: UtcDatetime
    updated_at: UtcDatetime


class ChatTranscript(ChatSessionSummary):
    messages: list[ChatMessageOut] = []


# ---------- Quản trị ----------


class AdminStats(ApiModel):
    product_count: int
    order_count: int
    post_count: int
    pending_contact_count: int
    revenue: int
    recent_orders: list[OrderOut] = []


# ---------- Tình trạng ----------


class HealthOut(ApiModel):
    status: str
