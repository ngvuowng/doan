"""Báo cáo thống kê cho quản trị viên: doanh thu theo thời gian, cơ cấu đơn, sản phẩm
bán chạy, hàng sắp hết và so sánh với kỳ liền trước.

Chỉ ADMIN được vào; ADMIN xem toàn hệ thống hoặc lọc theo một cửa hàng. Doanh thu tính
giống `/api/admin/stats`: tổng tiền các đơn không bị huỷ, đã gồm phí giao hàng.

`created_at` lưu giờ UTC không kèm múi giờ, còn người xem chọn ngày theo giờ Việt Nam.
Khoảng ngày được đổi sang mốc UTC trước khi so sánh (cột không bị bọc hàm), chỉ khi gom
theo ngày mới đổi ngược sang giờ VN bằng CONVERT_TZ với độ lệch cố định — không cần nạp
bảng múi giờ của MySQL.
"""

from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, case, desc, func, literal_column, select
from sqlalchemy.orm import Session

from app.deps import DbSession, admin_user, or_404
from app.models import Order, OrderItem, Product, Store, User
from app.routers.orders import expire_unpaid_orders
from app.schemas import (
    AdminReport,
    ReportCompare,
    ReportKpis,
    ReportLowStock,
    ReportPaymentRow,
    ReportPoint,
    ReportProductRow,
    ReportRateCompare,
    ReportStatusRow,
    ReportStoreRow,
)

router = APIRouter(
    prefix="/api/admin/reports", tags=["reports"], dependencies=[Depends(admin_user)]
)

# Việt Nam không có giờ mùa hè nên độ lệch cố định là đủ, khỏi phụ thuộc tzdata.
VN_OFFSET = timedelta(hours=7)
VN_TZ = timezone(VN_OFFSET)
MAX_RANGE_DAYS = 366
# Dài hơn ngưỡng này thì gom theo tháng để biểu đồ không quá dày.
DAY_BUCKET_MAX_DAYS = 92
DEFAULT_RANGE_DAYS = 30
TOP_PRODUCTS = 10
LOW_STOCK_THRESHOLD = 10
LOW_STOCK_LIMIT = 20
ORDER_STATUSES = ("PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED")
PAYMENT_METHODS = ("COD", "BANK")
UNASSIGNED_STORE = "Chưa gán cửa hàng"

_NOT_CANCELLED = Order.status != "CANCELLED"
_REVENUE = func.coalesce(func.sum(case((_NOT_CANCELLED, Order.total), else_=0)), 0)


def _resolve_range(start: date | None, end: date | None) -> tuple[date, date]:
    today = datetime.now(VN_TZ).date()
    if end is None:
        end = today if start is None or start <= today else start
    if start is None:
        start = end - timedelta(days=DEFAULT_RANGE_DAYS - 1)
    if start > end:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.",
        )
    if (end - start).days + 1 > MAX_RANGE_DAYS:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Chỉ xem được tối đa {MAX_RANGE_DAYS} ngày mỗi lần.",
        )
    return start, end


def _utc_bounds(start: date, end: date) -> tuple[datetime, datetime]:
    """Nửa khoảng [lo, hi) theo giờ UTC phủ trọn các ngày start..end giờ Việt Nam."""
    lo = datetime.combine(start, time.min) - VN_OFFSET
    hi = datetime.combine(end + timedelta(days=1), time.min) - VN_OFFSET
    return lo, hi


def _conds(lo: datetime, hi: datetime, store_id: str | None) -> list:
    conds = [Order.created_at >= lo, Order.created_at < hi]
    if store_id:
        conds.append(Order.store_id == store_id)
    return conds


def _local_day():
    # Hai độ lệch viết thẳng vào câu SQL để biểu thức ở SELECT và GROUP BY giống hệt nhau.
    return func.date(
        func.convert_tz(
            Order.created_at, literal_column("'+00:00'"), literal_column("'+07:00'")
        )
    )


def _kpis(db: Session, lo: datetime, hi: datetime, store_id: str | None) -> dict:
    conds = _conds(lo, hi, store_id)
    order_count, valid, cancelled, revenue, shipping = db.execute(
        select(
            func.count(Order.id),
            func.coalesce(func.sum(case((_NOT_CANCELLED, 1), else_=0)), 0),
            func.coalesce(func.sum(case((Order.status == "CANCELLED", 1), else_=0)), 0),
            _REVENUE,
            func.coalesce(func.sum(case((_NOT_CANCELLED, Order.shipping_fee), else_=0)), 0),
        ).where(*conds)
    ).one()
    items_sold = db.execute(
        select(func.coalesce(func.sum(OrderItem.quantity), 0))
        .join(Order, OrderItem.order_id == Order.id)
        .where(*conds, _NOT_CANCELLED)
    ).scalar_one()
    new_customers = db.execute(
        select(func.count(User.id)).where(
            User.role == "USER", User.created_at >= lo, User.created_at < hi
        )
    ).scalar_one()
    # SUM trên MySQL trả Decimal; ép về int để phép chia bên dưới và JSON đều gọn.
    return {
        "order_count": int(order_count),
        "valid_order_count": int(valid),
        "cancelled_count": int(cancelled),
        "revenue": int(revenue),
        "shipping_total": int(shipping),
        "items_sold": int(items_sold),
        "new_customers": int(new_customers),
    }


def _avg_order_value(k: dict) -> int:
    return round(k["revenue"] / k["valid_order_count"]) if k["valid_order_count"] else 0


def _cancel_rate(k: dict) -> float:
    return k["cancelled_count"] / k["order_count"] if k["order_count"] else 0.0


def _build_kpis(current: dict, previous: dict) -> ReportKpis:
    def compare(key: str) -> ReportCompare:
        return ReportCompare(current=current[key], previous=previous[key])

    return ReportKpis(
        revenue=compare("revenue"),
        shipping_total=compare("shipping_total"),
        order_count=compare("order_count"),
        valid_order_count=compare("valid_order_count"),
        cancelled_count=compare("cancelled_count"),
        avg_order_value=ReportCompare(
            current=_avg_order_value(current), previous=_avg_order_value(previous)
        ),
        cancel_rate=ReportRateCompare(
            current=_cancel_rate(current), previous=_cancel_rate(previous)
        ),
        items_sold=compare("items_sold"),
        new_customers=compare("new_customers"),
    )


def _series(
    db: Session, start: date, end: date, conds: list, granularity: str
) -> list[ReportPoint]:
    day = _local_day().label("bucket_day")
    rows = db.execute(
        select(day, func.count(Order.id), _REVENUE).where(*conds).group_by(day)
    ).all()
    by_day = {d: (int(count), int(revenue)) for d, count, revenue in rows}

    # Điền đủ mọi ngày (kể cả ngày không có đơn) rồi gộp theo tháng nếu cần, để trục
    # thời gian của biểu đồ liền mạch.
    buckets: dict[date, list[int]] = {}
    current = start
    while current <= end:
        key = current if granularity == "day" else current.replace(day=1)
        count, revenue = by_day.get(current, (0, 0))
        bucket = buckets.setdefault(key, [0, 0])
        bucket[0] += count
        bucket[1] += revenue
        current += timedelta(days=1)
    return [
        ReportPoint(bucket=key, order_count=count, revenue=revenue)
        for key, (count, revenue) in buckets.items()
    ]


def _status_breakdown(db: Session, conds: list) -> list[ReportStatusRow]:
    rows = db.execute(
        select(Order.status, func.count(Order.id), func.coalesce(func.sum(Order.total), 0))
        .where(*conds)
        .group_by(Order.status)
    ).all()
    found = {s: (int(count), int(total)) for s, count, total in rows}
    return [
        ReportStatusRow(status=s, order_count=count, total=total)
        for s in ORDER_STATUSES
        for count, total in [found.get(s, (0, 0))]
    ]


def _payment_breakdown(db: Session, conds: list) -> list[ReportPaymentRow]:
    rows = db.execute(
        select(Order.payment_method, func.count(Order.id), _REVENUE)
        .where(*conds, _NOT_CANCELLED)
        .group_by(Order.payment_method)
    ).all()
    found = {m: (int(count), int(revenue)) for m, count, revenue in rows}
    return [
        ReportPaymentRow(method=m, order_count=count, revenue=revenue)
        for m in PAYMENT_METHODS
        for count, revenue in [found.get(m, (0, 0))]
    ]


def _store_breakdown(
    db: Session, lo: datetime, hi: datetime, store_id: str | None
) -> list[ReportStoreRow]:
    # Điều kiện thời gian đặt trong ON để cửa hàng chưa có đơn nào vẫn có một dòng 0.
    stmt = (
        select(Store.id, Store.name, func.count(Order.id), _REVENUE)
        .select_from(Store)
        .outerjoin(
            Order,
            and_(
                Order.store_id == Store.id,
                Order.created_at >= lo,
                Order.created_at < hi,
                _NOT_CANCELLED,
            ),
        )
        .group_by(Store.id, Store.name, Store.position)
        .order_by(Store.position)
    )
    if store_id:
        stmt = stmt.where(Store.id == store_id)
    result = [
        ReportStoreRow(store_id=sid, name=name, order_count=int(count), revenue=int(revenue))
        for sid, name, count, revenue in db.execute(stmt).all()
    ]
    if not store_id:
        count, revenue = db.execute(
            select(func.count(Order.id), _REVENUE).where(
                *_conds(lo, hi, None), Order.store_id.is_(None), _NOT_CANCELLED
            )
        ).one()
        if count:
            result.append(
                ReportStoreRow(
                    store_id=None,
                    name=UNASSIGNED_STORE,
                    order_count=int(count),
                    revenue=int(revenue),
                )
            )
    return result


def _top_products(db: Session, conds: list) -> list[ReportProductRow]:
    # Gom theo sản phẩm; sản phẩm đã xoá (product_id NULL) thì gom theo tên đã chụp.
    # Chỉ chọn hàm gộp nên an toàn với ONLY_FULL_GROUP_BY.
    quantity = func.sum(OrderItem.quantity).label("quantity")
    revenue = func.sum(OrderItem.price * OrderItem.quantity).label("revenue")
    rows = db.execute(
        select(func.max(OrderItem.product_id), func.max(OrderItem.name), quantity, revenue)
        .join(Order, OrderItem.order_id == Order.id)
        .where(*conds, _NOT_CANCELLED)
        .group_by(func.coalesce(OrderItem.product_id, OrderItem.name))
        .order_by(desc("revenue"), desc("quantity"))
        .limit(TOP_PRODUCTS)
    ).all()
    return [
        ReportProductRow(product_id=pid, name=name, quantity=int(qty), revenue=int(rev))
        for pid, name, qty, rev in rows
    ]


def _low_stock(db: Session) -> list[ReportLowStock]:
    products = db.execute(
        select(Product)
        .where(Product.stock <= LOW_STOCK_THRESHOLD)
        .order_by(Product.stock, Product.name)
        .limit(LOW_STOCK_LIMIT)
    ).scalars()
    return [ReportLowStock.model_validate(p) for p in products]


@router.get("", response_model=AdminReport)
def get_report(
    db: DbSession,
    start: date | None = Query(default=None, description="ngày bắt đầu (giờ Việt Nam)"),
    end: date | None = Query(default=None, description="ngày kết thúc, tính cả ngày này"),
    store_id: str | None = Query(default=None, description="chỉ tính đơn của cửa hàng này"),
):
    # Đơn chuyển khoản quá hạn bị huỷ trước để doanh thu không tính nhầm.
    expire_unpaid_orders(db)

    start, end = _resolve_range(start, end)
    days = (end - start).days + 1
    previous_end = start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=days - 1)

    store_name = None
    if store_id:
        store_name = or_404(db.get(Store, store_id), "Không tìm thấy cửa hàng.").name

    lo, hi = _utc_bounds(start, end)
    prev_lo, prev_hi = _utc_bounds(previous_start, previous_end)
    conds = _conds(lo, hi, store_id)
    granularity = "day" if days <= DAY_BUCKET_MAX_DAYS else "month"

    return AdminReport(
        start=start,
        end=end,
        previous_start=previous_start,
        previous_end=previous_end,
        granularity=granularity,
        store_id=store_id,
        store_name=store_name,
        kpis=_build_kpis(_kpis(db, lo, hi, store_id), _kpis(db, prev_lo, prev_hi, store_id)),
        series=_series(db, start, end, conds, granularity),
        status_breakdown=_status_breakdown(db, conds),
        payment_breakdown=_payment_breakdown(db, conds),
        store_breakdown=_store_breakdown(db, lo, hi, store_id),
        top_products=_top_products(db, conds),
        low_stock=_low_stock(db),
        low_stock_threshold=LOW_STOCK_THRESHOLD,
    )
