"""Lớp Pydantic cho request/response.

Cột trong MySQL là snake_case, nhưng JSON trả ra phải là camelCase vì frontend
Next.js đang dùng đúng những tên đó (`salePrice`, `hoverImage`, `createdAt`...).
`ApiModel` lo việc đổi tên này ở một chỗ duy nhất.
"""

from datetime import date, datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer, computed_field
from pydantic.alias_generators import to_camel

from app.chat_modes import ChatMode
from app.permissions import PermissionKey, StaffRole


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
    # Danh mục cha; None = danh mục gốc (mục menu chính).
    parent_id: str | None = None


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
    # Card cũng cần tồn kho để hiện "Hết hàng" và khoá nút thêm vào giỏ.
    stock: int
    updated_at: UtcDatetime


class ProductOut(ProductCard):
    short_description: str
    description: str
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
    # Khoá quyền của nhân viên (rỗng với khách hàng và ADMIN — ADMIN có toàn quyền).
    permissions: list[str] = []
    # Cửa hàng nhân viên làm việc; None với ADMIN và khách hàng.
    store_id: str | None = None
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


# ---------- Cửa hàng ----------


class StoreOut(ApiModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float


class StoreQuote(StoreOut):
    """Cửa hàng kèm khoảng cách và phí giao hàng ứng với vị trí khách gửi lên."""

    # None khi khách chưa chia sẻ vị trí; khi đó shipping_fee là mức phí chuẩn.
    distance_km: float | None = None
    shipping_fee: int


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
    payment_status: str
    paid_at: UtcDatetime | None = None
    payment_expires_at: UtcDatetime | None = None
    store_id: str | None = None
    store: StoreOut | None = None
    shipping_fee: int = 0
    distance_km: float | None = None
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
    store_id: str = Field(min_length=1)
    # Toạ độ do trình duyệt khách cung cấp (tuỳ chọn). Backend tự tính khoảng cách và
    # phí từ đây; client không bao giờ gửi số tiền.
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
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
    # Chủ đề khách chọn ở lượt hỏi này; None với tin cũ. Trang quản trị hiện thành nhãn.
    mode: str | None = None
    created_at: UtcDatetime


class ChatIn(ApiModel):
    # UUID do trình duyệt sinh và giữ ở localStorage, dùng để nhận lại phiên sau khi tải lại trang.
    client_key: str = Field(min_length=8, max_length=64)
    message: str = Field(min_length=1, max_length=1000)
    # Chủ đề tư vấn, tuỳ chọn. Khung chat cho hỏi thẳng nên không gửi (None = prompt
    # chung); vẫn nhận khi gọi tay qua Swagger. Chuỗi lạ bị chặn 422.
    mode: ChatMode | None = None
    # Tên sản phẩm trong giỏ hàng (localStorage của trình duyệt), dùng cho prompt chung và
    # chủ đề công thức để gợi ý đúng từ những gì khách đang có.
    cart_items: list[Annotated[str, Field(max_length=255)]] = Field(
        default_factory=list, max_length=20
    )


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


# ---------- Nhân sự ----------


class StaffUpdateIn(ApiModel):
    name: str = Field(min_length=2)
    phone: str | None = None
    role: StaffRole
    # Bắt buộc với mọi vai trò trừ ADMIN; router kiểm tra vì phụ thuộc vào `role`.
    store_id: str | None = None
    # `Literal` chặn khoá lạ ngay ở biên API (422).
    permissions: list[PermissionKey] = []


class StaffCreateIn(StaffUpdateIn):
    email: EmailStr
    password: str = Field(min_length=6)


class StaffActiveIn(ApiModel):
    is_active: bool


class StaffPasswordIn(ApiModel):
    password: str = Field(min_length=6)


class StaffOut(UserOut):
    is_active: bool
    created_at: UtcDatetime
    store: StoreOut | None = None


# ---------- Khách hàng (quản trị) ----------


class CustomerOut(UserOut):
    is_active: bool
    created_at: UtcDatetime


class CustomerSummary(CustomerOut):
    """Ba trường thống kê không nằm trên model, router tính từ bảng orders."""

    order_count: int
    # Không tính đơn đã huỷ, giống cách tính doanh thu ở bảng điều khiển.
    total_spent: int
    last_order_at: UtcDatetime | None = None


class CustomerPage(ApiModel):
    items: list[CustomerSummary]
    total: int
    page: int
    page_size: int


class CustomerDetail(CustomerSummary):
    orders: list[OrderOut] = []


# ---------- Báo cáo thống kê ----------


class ReportCompare(ApiModel):
    """Giá trị của kỳ đang xem và kỳ liền trước có cùng số ngày."""

    current: int
    previous: int


class ReportRateCompare(ApiModel):
    """Như `ReportCompare` nhưng là tỉ lệ 0..1."""

    current: float
    previous: float


class ReportKpis(ApiModel):
    # Doanh thu = tổng tiền các đơn không bị huỷ (đã gồm phí giao), giống /stats.
    revenue: ReportCompare
    shipping_total: ReportCompare
    # Mọi đơn đặt trong kỳ, kể cả đơn đã huỷ.
    order_count: ReportCompare
    valid_order_count: ReportCompare
    cancelled_count: ReportCompare
    # revenue / valid_order_count — chia cho số đơn không huỷ.
    avg_order_value: ReportCompare
    cancel_rate: ReportRateCompare
    items_sold: ReportCompare
    # Tài khoản khách tạo trong kỳ, tính toàn hệ thống (không lọc theo cửa hàng).
    new_customers: ReportCompare


class ReportPoint(ApiModel):
    """Một cột của biểu đồ: ngày (hoặc ngày đầu tháng khi gộp theo tháng)."""

    bucket: date
    order_count: int
    revenue: int


class ReportStatusRow(ApiModel):
    status: str
    order_count: int
    total: int


class ReportPaymentRow(ApiModel):
    method: str
    order_count: int
    revenue: int


class ReportStoreRow(ApiModel):
    # None = đơn đặt trước khi có tính năng chọn cửa hàng.
    store_id: str | None
    name: str
    order_count: int
    revenue: int


class ReportProductRow(ApiModel):
    # None khi sản phẩm đã bị xoá; tên lấy từ ảnh chụp trong đơn.
    product_id: str | None
    name: str
    quantity: int
    # Chỉ tiền hàng, không gồm phí giao.
    revenue: int


class ReportLowStock(ApiModel):
    id: str
    name: str
    slug: str
    stock: int


class AdminReport(ApiModel):
    start: date
    end: date
    previous_start: date
    previous_end: date
    granularity: Literal["day", "month"]
    store_id: str | None = None
    store_name: str | None = None
    kpis: ReportKpis
    series: list[ReportPoint]
    status_breakdown: list[ReportStatusRow]
    payment_breakdown: list[ReportPaymentRow]
    store_breakdown: list[ReportStoreRow]
    top_products: list[ReportProductRow]
    low_stock: list[ReportLowStock]
    low_stock_threshold: int


# ---------- Tình trạng ----------


class HealthOut(ApiModel):
    status: str
