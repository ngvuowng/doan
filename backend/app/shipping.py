"""Tính phí giao hàng theo khoảng cách từ cửa hàng tới khách.

Khoảng cách là đường chim bay (haversine) giữa toạ độ cửa hàng và toạ độ do trình
duyệt của khách gửi lên. Không gọi dịch vụ geocode ngoài: địa chỉ tự nhập của khách
không được đổi ra toạ độ, nên khách không chia sẻ vị trí thì áp một mức phí chuẩn.
"""

import math

# Bậc phí theo khoảng cách: (km tối đa, VND). Vượt bậc cuối thì dùng SHIPPING_FEE_BEYOND.
SHIPPING_TIERS: list[tuple[float, int]] = [(3, 15_000), (10, 25_000), (30, 40_000)]
SHIPPING_FEE_BEYOND = 60_000
# Khách không chia sẻ vị trí → phí chuẩn, không phụ thuộc cửa hàng đã chọn.
SHIPPING_FEE_DEFAULT = 30_000

_EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Khoảng cách đường chim bay giữa hai toạ độ, đơn vị km."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def distance_to(store_lat: float, store_lng: float, lat: float | None, lng: float | None) -> float | None:
    """Khoảng cách khách → cửa hàng, làm tròn 1 chữ số thập phân.

    Làm tròn trước khi tra bậc phí để số km hiển thị cho khách và bậc phí áp dụng
    luôn khớp nhau. Thiếu một trong hai toạ độ thì trả None.
    """
    if lat is None or lng is None:
        return None
    return round(haversine_km(lat, lng, store_lat, store_lng), 1)


def shipping_fee(distance_km: float | None) -> int:
    """Phí giao hàng (VND) cho một khoảng cách; None = chưa xác định vị trí."""
    if distance_km is None:
        return SHIPPING_FEE_DEFAULT
    for max_km, fee in SHIPPING_TIERS:
        if distance_km <= max_km:
            return fee
    return SHIPPING_FEE_BEYOND
