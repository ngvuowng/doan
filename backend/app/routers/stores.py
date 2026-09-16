from fastapi import APIRouter, Query
from sqlalchemy import select

from app.deps import DbSession
from app.models import Store
from app.schemas import StoreQuote
from app.shipping import distance_to, shipping_fee

router = APIRouter(prefix="/api/stores", tags=["stores"])


@router.get("", response_model=list[StoreQuote])
def list_stores(
    db: DbSession,
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
):
    """Danh sách cửa hàng kèm phí giao hàng.

    Có toạ độ khách (trình duyệt gửi lên) thì tính khoảng cách tới từng cửa hàng và
    sắp cửa hàng gần nhất lên đầu; không có thì giữ thứ tự `position` và báo mức
    phí chuẩn. Trang thanh toán dùng cùng một endpoint cho cả hai trường hợp.
    """
    stores = db.execute(select(Store).order_by(Store.position)).scalars().all()
    quotes = []
    for store in stores:
        distance = distance_to(store.lat, store.lng, lat, lng)
        quotes.append(
            StoreQuote(
                id=store.id,
                name=store.name,
                address=store.address,
                lat=store.lat,
                lng=store.lng,
                distance_km=distance,
                shipping_fee=shipping_fee(distance),
            )
        )
    if lat is not None and lng is not None:
        quotes.sort(key=lambda q: q.distance_km)
    return quotes
