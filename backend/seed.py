"""Nạp dữ liệu gốc của nongsan.maugiaodien.com vào MySQL.

Chuyển từ prisma/seed.ts của bản Next.js + SQLite, giữ nguyên cách làm:
sản phẩm/danh mục chép từ trang chủ lưu trữ, còn nội dung bài viết đọc trực tiếp
từ RSS lưu trữ (`_reference/original-feed.xml`) để giữ đúng văn bản gốc.

Chạy: python seed.py
"""

import json
import random
import re
from datetime import datetime, time, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

from sqlalchemy import delete, update

from app.config import PAYMENT_TIMEOUT_MINUTES
from app.database import SessionLocal, engine
from app.models import (
    Category,
    ContactMessage,
    Order,
    OrderItem,
    Post,
    Product,
    Store,
    User,
    utcnow,
)
from app.security import hash_password
from app.shipping import shipping_fee

BASE_DIR = Path(__file__).resolve().parent
FEED_PATH = BASE_DIR.parent / "_reference" / "original-feed.xml"
KLEVER_PATH = BASE_DIR.parent / "_reference" / "kleverfruits-products.json"

# Danh mục sản phẩm là cây nhiều cấp (hiện 3 cấp) qua `parent`: chỉ một gốc `san-pham` =
# mục "Sản phẩm" của menu chính (xổ mega menu); 2 nhóm theo kleverfruits.com.vn (Quà tặng
# trái cây, Trái cây tươi hàng ngày) và 5 danh mục của site gốc Halona đều là con của nó.
# Cha phải khai báo trước con (seed gán qua `parent`). `position` toàn cục mỗi cấp một hàng
# số (gốc 100, con 110/120…, cháu 111, 112…) để ORDER BY position ra đúng thứ tự
# cha-rồi-con-cháu, và 4 sản phẩm gốc vẫn lấy `trai-cay-nhap-khau` (120) làm danh mục chính.
PRODUCT_CATEGORIES = [
    {
        "slug": "san-pham",
        "name": "Sản phẩm",
        "subtitle": "Toàn bộ trái cây, nước ép, hạt và rau củ tại Halona Fruits",
        "position": 100,
    },
    {
        "slug": "qua-tang-trai-cay",
        "name": "Quà tặng trái cây",
        "subtitle": "Giỏ quà trái cây tươi gói sẵn, trao gửi yêu thương trong mọi dịp",
        "position": 110,
        "parent": "san-pham",
    },
    {
        "slug": "gio-qua-tang-trai-cay-cao-cap",
        "name": "Giỏ quà tặng trái cây cao cấp",
        "subtitle": "Trái cây nhập khẩu tuyển chọn, gói trong giỏ mây sang trọng",
        "position": 111,
        "parent": "qua-tang-trai-cay",
    },
    {
        "slug": "chuc-mung-cac-dip-le",
        "name": "Chúc mừng các dịp lễ",
        "subtitle": "Quà tặng cho sinh nhật, khai trương, lễ Tết và ngày kỷ niệm",
        "position": 112,
        "parent": "qua-tang-trai-cay",
    },
    {
        "slug": "trai-cay-nhap-khau",
        "name": "Trái cây nhập khẩu",
        "subtitle": "Là nhà cung cấp thực phẩm tươi sạch hàng đầu khu vực phía nam",
        "position": 120,
        "parent": "san-pham",
    },
    {
        "slug": "trai-cay-noi-dia",
        "name": "Trái cây nội địa",
        "subtitle": "Có hàng ngàn mẫu hoa quả tươi đủ loại cho bạn chọn!",
        "position": 130,
        "parent": "san-pham",
    },
    # Tên theo menu kleverfruits nhưng giữ slug `nuoc-ep` của bản gốc vì trang chủ
    # (HOME_SECTIONS), PromoBanners và e2e đều tham chiếu.
    {
        "slug": "nuoc-ep",
        "name": "Nước ép trái cây",
        "subtitle": "Mang lại sự sảng khoái khi thưởng thức nước ép tại Halona Fruits",
        "position": 140,
        "parent": "san-pham",
    },
    {
        "slug": "cac-loai-hat-dinh-duong",
        "name": "Các loại hạt dinh dưỡng",
        "subtitle": "Nguồn dinh dưỡng tự nhiên cho cả gia đình",
        "position": 150,
        "parent": "san-pham",
    },
    # "Oragnic" là lỗi chính tả có sẵn trên site gốc — giữ nguyên để trung thành với bản clone.
    {
        "slug": "cac-loai-rau-cu-qua-oragnic",
        "name": "Các loại rau củ quả Oragnic",
        "subtitle": "Rau củ quả canh tác hữu cơ, không hoá chất",
        "position": 160,
        "parent": "san-pham",
    },
    {
        "slug": "trai-cay-tuoi-hang-ngay",
        "name": "Trái cây tươi hàng ngày",
        "subtitle": "Hoa quả tươi sơ chế sẵn, tiện dùng mỗi ngày",
        "position": 170,
        "parent": "san-pham",
    },
    {
        "slug": "khay-set-hoa-qua",
        "name": "Khay/set hoa quả",
        "subtitle": "Khay và set hoa quả cắt sẵn cho văn phòng, tiệc nhỏ và gia đình",
        "position": 171,
        "parent": "trai-cay-tuoi-hang-ngay",
    },
    {
        "slug": "bo-doi-dinh-duong",
        "name": "Bộ đôi dinh dưỡng",
        "subtitle": "Hai loại quả bổ trợ nhau trong một combo tiết kiệm",
        "position": 172,
        "parent": "trai-cay-tuoi-hang-ngay",
    },
]

POST_CATEGORIES = [
    {"slug": "tin-tuc", "name": "Tin tức", "position": 1},
]

# 4 sản phẩm của site gốc. Giá tính bằng VND.
PRODUCTS = [
    {
        "slug": "bom-my",
        "name": "Bom mỹ",
        "price": 200000,
        "sale_price": 180000,
        "image": "/images/product-bom-my.png",
        "short_description": "Bom Mỹ nhập khẩu, quả to đều, giòn ngọt và mọng nước.",
        "description": "<p>Bom Mỹ (táo Mỹ) được nhập khẩu trực tiếp, quả to đều, vỏ đỏ bóng, thịt quả giòn ngọt và mọng nước. Sản phẩm được bảo quản lạnh trong suốt quá trình vận chuyển nên giữ được độ tươi và hương vị đặc trưng.</p><p>Bom Mỹ giàu chất xơ và vitamin C, thích hợp ăn trực tiếp, làm salad hoặc ép lấy nước.</p><ul><li>Xuất xứ: Hoa Kỳ</li><li>Quy cách: tính theo kilogram</li><li>Bảo quản: ngăn mát 2-5°C</li></ul>",
    },
    {
        "slug": "vai-nhap-khau",
        "name": "Vải nhập khẩu",
        "price": 80000,
        "sale_price": 60000,
        "image": "/images/product-vai-nhap-khau.png",
        "short_description": "Vải thiều nhập khẩu, cùi dày, hạt nhỏ, ngọt thanh.",
        "description": "<p>Vải nhập khẩu quả to, cùi dày, hạt nhỏ, vị ngọt thanh và thơm dịu. Hàng được tuyển chọn kỹ, loại bỏ quả dập nát trước khi đóng gói.</p><p>Vải chứa nhiều vitamin C và khoáng chất, thích hợp ăn tráng miệng hoặc làm chè, sinh tố.</p><ul><li>Quy cách: tính theo kilogram</li><li>Bảo quản: ngăn mát, dùng trong 3-5 ngày</li></ul>",
    },
    {
        "slug": "tao-nhap-khau",
        "name": "Táo nhập khẩu",
        "price": 50000,
        "sale_price": 30000,
        "image": "/images/product-tao-nhap-khau.png",
        "short_description": "Táo nhập khẩu giòn ngọt, vỏ mỏng, an toàn cho cả gia đình.",
        "description": "<p>Táo nhập khẩu có vỏ mỏng, thịt quả giòn, vị ngọt xen chút chua nhẹ rất dễ ăn. Sản phẩm có nguồn gốc rõ ràng, đạt tiêu chuẩn kiểm định an toàn thực phẩm.</p><p>Đây là loại trái cây quen thuộc cho bữa phụ của trẻ nhỏ và người lớn tuổi.</p><ul><li>Quy cách: tính theo kilogram</li><li>Bảo quản: nơi khô mát hoặc ngăn mát tủ lạnh</li></ul>",
    },
    {
        "slug": "ca-chua-da-lat",
        "name": "Cà chua Đà Lạt",
        "price": 100000,
        "sale_price": 80000,
        "image": "/images/product-ca-chua-da-lat.png",
        "short_description": "Cà chua Đà Lạt chín cây, đỏ mọng, canh tác an toàn.",
        "description": "<p>Cà chua Đà Lạt được trồng trên vùng cao nguyên khí hậu mát mẻ, quả chín cây nên đỏ mọng, chắc thịt và nhiều nước. Canh tác theo hướng an toàn, hạn chế tối đa thuốc bảo vệ thực vật.</p><p>Thích hợp nấu canh, sốt, làm salad hoặc ép nước uống mỗi ngày.</p><ul><li>Xuất xứ: Đà Lạt, Lâm Đồng</li><li>Quy cách: tính theo kilogram</li><li>Bảo quản: ngăn mát 5-8°C</li></ul>",
    },
]

# Sản phẩm thật nhập từ kleverfruits.com.vn cho 7 danh mục lá của menu mới (site gốc Halona
# chỉ có 4 sản phẩm). File do `npm run fetch:kleverfruits` (frontend/scripts/fetch-kleverfruits.ts)
# sinh ra và commit kèm ảnh trong public/images, nên seed chạy được offline. `category` là
# slug danh mục LÁ (không gán vào cha; trang danh mục cha tự gom sản phẩm của các con);
# `source` là URL sản phẩm gốc, chỉ để đối chiếu. Hai danh mục `cac-loai-hat-dinh-duong` và
# `cac-loai-rau-cu-qua-oragnic` không có tương đương trên kleverfruits nên để trống.
KLEVER_PRODUCTS: list[dict] = json.loads(KLEVER_PATH.read_text(encoding="utf-8"))

# Bản gốc dùng CHUNG một ảnh cắt vuông (Screenshot_4-300x300) làm ảnh hover cho cả 4
# sản phẩm, nên rê chuột lên "Cà chua Đà Lạt" lại hiện quả táo. Đó là lỗi cấu hình của
# site demo; ở đây bỏ ảnh hover và dùng hiệu ứng phóng to nhẹ thay thế.
HOVER_IMAGE = None

# Hệ thống cửa hàng. Cửa hàng đầu (position nhỏ nhất) là địa chỉ gốc của site và được
# chọn sẵn ở trang thanh toán. Toạ độ lấy xấp xỉ từ Google Maps, chỉ dùng để ước lượng
# khoảng cách tính phí giao hàng.
STORES = [
    {
        "name": "Halona Fruist Tân Bình",
        "address": "Phạm Văn Bạch, P. 15, Q. Tân Bình, Tp. HCM",
        "lat": 10.8163,
        "lng": 106.6403,
        "position": 1,
    },
    {
        "name": "Halona Fruist 120 Yên Lãng",
        "address": "120 Yên Lãng, P. Thịnh Quang, Q. Đống Đa, Hà Nội",
        "lat": 21.0112,
        "lng": 105.8150,
        "position": 2,
    },
    {
        "name": "Halona Fruist ngõ 38 Yên Lãng",
        "address": "Số 25, ngõ 38, phố Yên Lãng, Q. Đống Đa, Hà Nội",
        "lat": 21.0135,
        "lng": 105.8172,
        "position": 3,
    },
]

# ---------- Đơn hàng mẫu cho trang báo cáo ----------
# Sinh ngẫu nhiên có seed cố định; mốc thời gian tính lùi từ lúc chạy để khoảng "30 ngày gần
# nhất" của trang báo cáo luôn có số liệu. Chỉ khoảng 270 đơn vì /admin/don-hang chưa phân trang.
DEMO_SEED = 2026
DEMO_DAYS = 90
# Tỉ trọng đơn theo thứ tự STORES (Tân Bình, 120 Yên Lãng, ngõ 38 Yên Lãng).
DEMO_STORE_WEIGHTS = [0.45, 0.35, 0.20]
DEMO_BANK_RATIO = 0.35
DEMO_CANCEL_RATIO = 0.09

# Khách mẫu có tài khoản (mật khẩu khach123), tạo rải rác để chỉ số "Khách hàng mới" có số
# liệu ở cả kỳ này lẫn kỳ trước. Tên và email tránh chữ "khach" kể cả khi bỏ dấu: e2e tìm
# `khachhang` và chờ đúng một kết quả, mà collation của MySQL không phân biệt dấu.
DEMO_CUSTOMERS = [
    {"name": "Nguyễn Thị Lan", "email": "lan.nguyen@example.com", "phone": "0903112233",
     "address": "45 Lê Văn Sỹ, P. 13, Q. 3, TP. HCM", "days_ago": 150},
    {"name": "Trần Minh Quân", "email": "quan.tran@example.com", "phone": "0912556677",
     "address": "18 Láng Hạ, Q. Đống Đa, Hà Nội", "days_ago": 120},
    {"name": "Lê Hoàng Yến", "email": "yen.le@example.com", "phone": "0938221144",
     "address": "220 Cộng Hoà, P. 12, Q. Tân Bình, TP. HCM", "days_ago": 75},
    {"name": "Phạm Đức Anh", "email": "anh.pham@example.com", "phone": "0987334455",
     "address": "9 Thái Hà, Q. Đống Đa, Hà Nội", "days_ago": 52},
    {"name": "Vũ Thu Hà", "email": "ha.vu@example.com", "phone": "0976889900",
     "address": "62 Chùa Láng, Q. Đống Đa, Hà Nội", "days_ago": 40},
    {"name": "Đặng Quốc Bảo", "email": "bao.dang@example.com", "phone": "0909667788",
     "address": "131 Hoàng Văn Thụ, P. 8, Q. Phú Nhuận, TP. HCM", "days_ago": 24},
    {"name": "Bùi Ngọc Mai", "email": "mai.bui@example.com", "phone": "0965112299",
     "address": "27 Nguyễn Chí Thanh, Q. Đống Đa, Hà Nội", "days_ago": 12},
    {"name": "Hoàng Gia Huy", "email": "huy.hoang@example.com", "phone": "0918443322",
     "address": "88 Trường Chinh, P. 15, Q. Tân Bình, TP. HCM", "days_ago": 5},
]
DEMO_GUEST_NAMES = [
    "Ngô Thanh Tùng", "Đỗ Thị Hằng", "Lý Văn Phúc", "Trịnh Mỹ Linh", "Phan Quang Vinh",
    "Mai Thị Thảo", "Đinh Công Sơn", "Tạ Thu Trang", "Hồ Minh Khoa", "Dương Thị Nga",
    "Lâm Bảo Ngọc", "Cao Văn Lực", "Võ Thị Hồng", "Kiều Anh Tuấn", "Châu Mỹ Duyên",
    "Lưu Đức Thịnh", "Tôn Nữ Vy", "Quách Hải Đăng", "Huỳnh Kim Chi", "Triệu Văn Hậu",
]
DEMO_ADDRESSES_HCM = [
    "15 Bạch Đằng, P. 2, Q. Tân Bình, TP. HCM",
    "302 Nguyễn Văn Trỗi, P. 8, Q. Phú Nhuận, TP. HCM",
    "71 Lý Thường Kiệt, P. 7, Q. Tân Bình, TP. HCM",
    "24 Phan Đăng Lưu, P. 5, Q. Bình Thạnh, TP. HCM",
]
DEMO_ADDRESSES_HN = [
    "56 Tây Sơn, Q. Đống Đa, Hà Nội",
    "12 Huỳnh Thúc Kháng, Q. Đống Đa, Hà Nội",
    "102 Trường Chinh, Q. Thanh Xuân, Hà Nội",
    "7 Nguyễn Khang, Q. Cầu Giấy, Hà Nội",
]
# Tồn kho còn lại (sau các đơn mẫu) của vài sản phẩm, để bảng "Sắp hết hàng" có dữ liệu.
DEMO_LOW_STOCK = {"viet-quat-my": 7, "cherry-do-canada": 3, "nuoc-ep-nho-kyoho-nhat-ban-720ml": 2}
# e2e đặt mua 4 sản phẩm gốc (Bom mỹ tới 3 quả) nên đơn mẫu không kéo tồn của chúng xuống
# dưới mức này.
E2E_STOCK_FLOOR = 20

# Ảnh trong nội dung bài viết trỏ về domain gốc — đổi sang ảnh đã tải về máy.
IMAGE_REWRITES = {
    "blog-img-6": "/images/post-trong-rau-sach.jpg",
    "eat-clean-bi-kip": "/images/post-eat-clean.svg",
    "lay-lai-vong-eo-con-kien": "/images/post-vong-eo-con-kien.jpg",
    "km-thang-giai-phong-mo-thua": "/images/post-km-thang.png",
}

ENTITIES = [
    ("&#8217;", "’"), ("&#039;", "’"), ("&#8211;", "–"), ("&#8220;", "“"),
    ("&#8221;", "”"), ("&#8230;", "…"), ("&lt;", "<"), ("&gt;", ">"),
    ("&quot;", '"'), ("&amp;", "&"),
]


def decode(text: str) -> str:
    for entity, char in ENTITIES:
        text = text.replace(entity, char)
    return text


def parse_feed() -> list[dict]:
    xml = FEED_PATH.read_text(encoding="utf-8")
    items = []

    for match in re.finditer(r"<item>(.*?)</item>", xml, re.S):
        raw = match.group(1)

        def pick(tag: str) -> str:
            found = re.search(rf"<{tag}>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{tag}>", raw, re.S)
            return found.group(1).strip() if found else ""

        slug = pick("link").rstrip("/").split("/")[-1]

        # Đổi mọi URL ảnh của domain gốc sang file cục bộ đã tải về.
        def rewrite(url_match: re.Match) -> str:
            url = url_match.group(0)
            for key, local in IMAGE_REWRITES.items():
                if key in url:
                    return local
            return url

        content = re.sub(
            r"https?://nongsan\.maugiaodien\.com/wp-content/uploads/[^\"' )]+",
            rewrite,
            pick("content:encoded"),
        )

        inline = re.search(r'src="(/images/[^"]+)"', content)
        categories = [
            c for c in re.findall(r"<category><!\[CDATA\[(.*?)\]\]></category>", raw)
            if c != "Chưa phân loại"
        ]

        # MySQL DATETIME không lưu múi giờ nên quy về UTC rồi bỏ tzinfo.
        published_at = parsedate_to_datetime(pick("pubDate")).astimezone(timezone.utc).replace(tzinfo=None)

        items.append(
            {
                "slug": slug,
                "title": decode(pick("title")),
                "excerpt": re.sub(r"\s+", " ", decode(pick("description"))).strip(),
                "content": content,
                "image": inline.group(1) if inline else "/images/post-eat-clean.svg",
                "published_at": published_at,
                "categories": categories,
            }
        )
    return items


def _demo_weight(product: Product) -> float:
    """Sản phẩm gốc và hàng rẻ bán chạy hơn giỏ quà tiền triệu."""
    if product.slug in {p["slug"] for p in PRODUCTS}:
        return 6
    price = product.sale_price or product.price
    if price <= 250_000:
        return 5
    if price <= 700_000:
        return 3
    if price <= 1_500_000:
        return 1.5
    return 0.6


def _demo_status(rng: random.Random, age_days: int, method: str) -> str:
    """Đơn cũ đã hoàn thành, đơn mới còn đang xử lý. Đơn BANK không bao giờ để ở PENDING
    (chưa trả tiền) vì `expire_unpaid_orders` sẽ tự huỷ nó."""
    if rng.random() < DEMO_CANCEL_RATIO:
        return "CANCELLED"
    if age_days >= 5:
        return "COMPLETED"
    if age_days >= 2:
        return rng.choice(["COMPLETED", "SHIPPING"])
    if method == "BANK":
        return rng.choice(["CONFIRMED", "SHIPPING"])
    return rng.choice(["PENDING", "CONFIRMED", "SHIPPING"])


def build_demo_orders(
    rng: random.Random,
    products: list[Product],
    stores: list[Store],
    customers: list[User],
    now: datetime,
) -> list[Order]:
    """Đơn mẫu trải đều DEMO_DAYS ngày gần nhất, theo giờ Việt Nam.

    Giữ đúng các bất biến của app/inventory.py: đơn đã hoàn thành hoặc đã nhận chuyển khoản
    thì có `stock_deducted_at` và tồn kho sản phẩm bị trừ thật; đơn khác chưa trừ.
    """
    vn_offset = timedelta(hours=7)
    today = (now + vn_offset).date()
    originals = {p["slug"] for p in PRODUCTS}
    weights = [_demo_weight(p) for p in products]
    used_codes: set[str] = set()
    guest_count = 0
    orders: list[Order] = []

    for offset in range(DEMO_DAYS - 1, -1, -1):
        day = today - timedelta(days=offset)
        progress = (DEMO_DAYS - 1 - offset) / (DEMO_DAYS - 1)
        weekend = 1.0 if day.weekday() >= 5 else 0.0
        count = max(0, round(2.0 + 1.2 * progress + weekend + rng.uniform(-1, 1)))
        # Giờ đặt 8h–21h giờ VN, đổi về UTC không kèm múi giờ như cột created_at.
        times = sorted(
            datetime.combine(day, time(8)) - vn_offset + timedelta(seconds=rng.randrange(13 * 3600))
            for _ in range(count)
        )
        for created in times:
            # Đơn mẫu luôn cũ hơn lúc chạy seed để đơn do e2e tạo đứng đầu danh sách.
            if created > now - timedelta(minutes=10):
                continue
            age_days = (now - created).days
            store_index = rng.choices(range(len(stores)), weights=DEMO_STORE_WEIGHTS)[0]
            method = "BANK" if rng.random() < DEMO_BANK_RATIO else "COD"
            status = _demo_status(rng, age_days, method)
            paid_at = created + timedelta(minutes=rng.randint(2, 12))
            done_at = min(created + timedelta(hours=rng.randint(20, 72)), now - timedelta(minutes=5))
            deducted_at = None
            if method == "BANK" and status != "CANCELLED":
                deducted_at = paid_at
            elif status == "COMPLETED":
                deducted_at = done_at

            picked: list[Product] = []
            size = rng.choices([1, 2, 3, 4], weights=[45, 30, 17, 8])[0]
            for _ in range(size * 3):
                product = rng.choices(products, weights=weights)[0]
                if product not in picked:
                    picked.append(product)
                if len(picked) == size:
                    break
            items: list[OrderItem] = []
            for product in picked:
                price = product.sale_price or product.price
                quantity = 1 if price > 1_000_000 else rng.randint(1, 3)
                if deducted_at:
                    floor = E2E_STOCK_FLOOR if product.slug in originals else 0
                    if product.stock - quantity < floor:
                        continue
                    product.stock -= quantity
                items.append(
                    OrderItem(
                        product=product,
                        name=product.name,
                        price=price,
                        quantity=quantity,
                        image=product.image,
                    )
                )
            if not items:
                continue

            customer = None
            if rng.random() < 0.5:
                eligible = [c for c in customers if c.created_at <= created]
                customer = rng.choice(eligible) if eligible else None
            if customer:
                name, email, phone, address = (
                    customer.name, customer.email, customer.phone, customer.address
                )
            else:
                guest_count += 1
                name = rng.choice(DEMO_GUEST_NAMES)
                email = f"guest{guest_count:03d}@example.com"
                phone = f"09{rng.randint(0, 99_999_999):08d}"
                address = rng.choice(DEMO_ADDRESSES_HCM if store_index == 0 else DEMO_ADDRESSES_HN)

            code = f"HL-{rng.randrange(16**6):06X}"
            while code in used_codes:
                code = f"HL-{rng.randrange(16**6):06X}"
            used_codes.add(code)

            distance = round(rng.uniform(0.8, 28), 1) if rng.random() < 0.65 else None
            fee = shipping_fee(distance)
            goods = sum(item.price * item.quantity for item in items)
            orders.append(
                Order(
                    code=code,
                    user=customer,
                    customer_name=name,
                    email=email,
                    phone=phone,
                    address=address,
                    payment_method=method,
                    status=status,
                    payment_status="PAID" if deducted_at and method == "BANK" else "UNPAID",
                    paid_at=paid_at if deducted_at and method == "BANK" else None,
                    payment_expires_at=(
                        created + timedelta(minutes=PAYMENT_TIMEOUT_MINUTES)
                        if method == "BANK"
                        else None
                    ),
                    stock_deducted_at=deducted_at,
                    store=stores[store_index],
                    shipping_fee=fee,
                    distance_km=distance,
                    total=goods + fee,
                    created_at=created,
                    updated_at=done_at if status in ("COMPLETED", "CANCELLED") else created,
                    items=items,
                )
            )
    return orders


def main() -> None:
    with SessionLocal() as db:
        # Xoá sạch để chạy lại seed nhiều lần mà không nhân đôi dữ liệu.
        # Bảng nối được dọn qua quan hệ nên chỉ cần xoá các bảng chính.
        # Gỡ liên kết cha-con trước rồi xoá hết để không phụ thuộc cách InnoDB xử lý FK
        # tự tham chiếu khi xoá hàng loạt ở cây sâu tuỳ ý.
        db.execute(update(Category).values(parent_id=None))
        for model in (OrderItem, Order, ContactMessage, Post, Product, Category, User, Store):
            db.execute(delete(model))
        db.commit()

        categories: dict[str, Category] = {}
        for data in PRODUCT_CATEGORIES:
            fields = dict(data)
            parent_slug = fields.pop("parent", None)
            category = Category(**fields, kind="product")
            if parent_slug:
                # Gán qua quan hệ để không phải chờ flush lấy id; cha phải khai báo trước con.
                category.parent = categories[parent_slug]
            categories[data["slug"]] = category
        for data in POST_CATEGORIES:
            categories[data["slug"]] = Category(**data, kind="post")
        db.add_all(categories.values())
        # Giữ danh sách để gắn nhân viên mẫu vào cửa hàng bên dưới.
        stores = [Store(**data) for data in STORES]
        db.add_all(stores)

        # Bản gốc hiển thị cả 4 sản phẩm ở 3 danh mục Halona đầu tiên (nay đều là con của
        # "Sản phẩm"); sản phẩm kleverfruits chỉ nằm trong một danh mục lá. Sản phẩm gốc đi
        # trước để thứ tự trang chủ / trang quản trị không đổi.
        original = ("trai-cay-nhap-khau", "trai-cay-noi-dia", "nuoc-ep")
        entries = [(data, original) for data in PRODUCTS] + [
            ({k: v for k, v in data.items() if k not in ("category", "source")}, (data["category"],))
            for data in KLEVER_PRODUCTS
        ]
        # Gán created_at cách nhau 1 giây để thứ tự hiển thị luôn đúng như site gốc
        # (Bom mỹ → Vải → Táo → Cà chua), không phụ thuộc tốc độ chèn.
        base_time = utcnow()
        products: list[Product] = []
        for offset, (data, slugs) in enumerate(entries):
            created = base_time + timedelta(seconds=offset)
            products.append(
                Product(
                    **data,
                    hover_image=HOVER_IMAGE,
                    categories=[categories[slug] for slug in slugs],
                    created_at=created,
                    updated_at=created,
                )
            )
        db.add_all(products)

        by_name = {c["name"]: categories[c["slug"]] for c in POST_CATEGORIES}
        posts = parse_feed()
        for item in posts:
            names = item.pop("categories")
            db.add(Post(**item, categories=[by_name[n] for n in names if n in by_name]))

        db.add_all(
            [
                User(
                    email="admin@halona.vn",
                    name="Quản trị viên",
                    password_hash=hash_password("admin123"),
                    role="ADMIN",
                ),
                User(
                    email="khachhang@halona.vn",
                    name="Nguyễn Văn A",
                    password_hash=hash_password("khach123"),
                    role="USER",
                    phone="0912345678",
                    address="12 Phạm Văn Bạch, P. 15, Q. Tân Bình, TP. HCM",
                ),
                # Nhân viên mẫu: mỗi người một cửa hàng và bộ quyền khác nhau để demo
                # phân quyền. Thu ngân đặt ở 120 Yên Lãng vì e2e đặt đơn tại đó.
                User(
                    email="quanly@halona.vn",
                    name="Trần Thị Quản Lý",
                    password_hash=hash_password("quanly123"),
                    role="STORE_MANAGER",
                    store=stores[0],
                    permissions=[
                        "products.view",
                        "products.edit",
                        "orders.view",
                        "orders.update",
                        "orders.payment",
                        "posts.view",
                        "contacts.manage",
                        "chats.view",
                    ],
                ),
                User(
                    email="thungan@halona.vn",
                    name="Lê Văn Thu Ngân",
                    password_hash=hash_password("thungan123"),
                    role="CASHIER",
                    store=stores[1],
                    permissions=["orders.view", "orders.update", "orders.payment"],
                ),
                User(
                    email="banhang@halona.vn",
                    name="Phạm Thị Bán Hàng",
                    password_hash=hash_password("banhang123"),
                    role="SALES",
                    store=stores[0],
                    permissions=[
                        "products.view",
                        "orders.view",
                        "orders.update",
                        "contacts.manage",
                        "chats.view",
                    ],
                ),
            ]
        )

        # bcrypt chậm nên băm một lần cho cả 8 khách mẫu.
        demo_password = hash_password("khach123")
        customers = [
            User(
                email=data["email"],
                name=data["name"],
                password_hash=demo_password,
                role="USER",
                phone=data["phone"],
                address=data["address"],
                created_at=base_time - timedelta(days=data["days_ago"], hours=3),
            )
            for data in DEMO_CUSTOMERS
        ]
        db.add_all(customers)
        # Flush để sản phẩm nhận tồn kho mặc định của model trước khi đơn mẫu trừ kho.
        db.flush()
        orders = build_demo_orders(random.Random(DEMO_SEED), products, stores, customers, base_time)
        db.add_all(orders)
        # Đặt sau khi sinh đơn: tồn hiện tại là con số duy nhất được lưu, nên tương đương
        # với việc các sản phẩm này nhập ít hàng hơn từ đầu.
        for product in products:
            product.stock = DEMO_LOW_STOCK.get(product.slug, product.stock)

        db.commit()

    print(
        f"Đã nạp: {len(PRODUCT_CATEGORIES) + len(POST_CATEGORIES)} danh mục, "
        f"{len(PRODUCTS) + len(KLEVER_PRODUCTS)} sản phẩm, {len(posts)} bài viết, "
        f"{len(STORES)} cửa hàng, 5 tài khoản, {len(customers)} khách mẫu, "
        f"{len(orders)} đơn mẫu trong {DEMO_DAYS} ngày."
    )
    engine.dispose()


if __name__ == "__main__":
    main()
