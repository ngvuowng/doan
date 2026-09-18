"""Nạp dữ liệu gốc của nongsan.maugiaodien.com vào MySQL.

Chuyển từ prisma/seed.ts của bản Next.js + SQLite, giữ nguyên cách làm:
sản phẩm/danh mục chép từ trang chủ lưu trữ, còn nội dung bài viết đọc trực tiếp
từ RSS lưu trữ (`_reference/original-feed.xml`) để giữ đúng văn bản gốc.

Chạy: python seed.py
"""

import json
import re
from datetime import timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

from sqlalchemy import delete

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

BASE_DIR = Path(__file__).resolve().parent
FEED_PATH = BASE_DIR.parent / "_reference" / "original-feed.xml"
KLEVER_PATH = BASE_DIR.parent / "_reference" / "kleverfruits-products.json"

# Danh mục sản phẩm là cây 2 cấp theo menu chính của kleverfruits.com.vn: 3 danh mục gốc
# (không `parent`) là 3 mục menu, mỗi mục xổ các danh mục con. 5 danh mục của site gốc
# Halona nằm trọn dưới "Sản phẩm". Cha phải khai báo trước con (seed gán qua `parent`).
# `position` toàn cục theo hàng chục (cha 10/20/30, con 11, 12…) để ORDER BY position đã
# ra thứ tự cha-rồi-con, và 4 sản phẩm gốc vẫn lấy `trai-cay-nhap-khau` làm danh mục chính.
PRODUCT_CATEGORIES = [
    {
        "slug": "qua-tang-trai-cay",
        "name": "Quà tặng trái cây",
        "subtitle": "Giỏ quà trái cây tươi gói sẵn, trao gửi yêu thương trong mọi dịp",
        "position": 10,
    },
    {
        "slug": "gio-qua-tang-trai-cay-cao-cap",
        "name": "Giỏ quà tặng trái cây cao cấp",
        "subtitle": "Trái cây nhập khẩu tuyển chọn, gói trong giỏ mây sang trọng",
        "position": 11,
        "parent": "qua-tang-trai-cay",
    },
    {
        "slug": "chuc-mung-cac-dip-le",
        "name": "Chúc mừng các dịp lễ",
        "subtitle": "Quà tặng cho sinh nhật, khai trương, lễ Tết và ngày kỷ niệm",
        "position": 12,
        "parent": "qua-tang-trai-cay",
    },
    {
        "slug": "san-pham",
        "name": "Sản phẩm",
        "subtitle": "Toàn bộ trái cây, nước ép, hạt và rau củ tại Halona Fruits",
        "position": 20,
    },
    {
        "slug": "trai-cay-nhap-khau",
        "name": "Trái cây nhập khẩu",
        "subtitle": "Là nhà cung cấp thực phẩm tươi sạch hàng đầu khu vực phía nam",
        "position": 21,
        "parent": "san-pham",
    },
    {
        "slug": "trai-cay-noi-dia",
        "name": "Trái cây nội địa",
        "subtitle": "Có hàng ngàn mẫu hoa quả tươi đủ loại cho bạn chọn!",
        "position": 22,
        "parent": "san-pham",
    },
    # Tên theo menu kleverfruits nhưng giữ slug `nuoc-ep` của bản gốc vì trang chủ
    # (HOME_SECTIONS), PromoBanners và e2e đều tham chiếu.
    {
        "slug": "nuoc-ep",
        "name": "Nước ép trái cây",
        "subtitle": "Mang lại sự sảng khoái khi thưởng thức nước ép tại Halona Fruits",
        "position": 23,
        "parent": "san-pham",
    },
    {
        "slug": "cac-loai-hat-dinh-duong",
        "name": "Các loại hạt dinh dưỡng",
        "subtitle": "Nguồn dinh dưỡng tự nhiên cho cả gia đình",
        "position": 24,
        "parent": "san-pham",
    },
    # "Oragnic" là lỗi chính tả có sẵn trên site gốc — giữ nguyên để trung thành với bản clone.
    {
        "slug": "cac-loai-rau-cu-qua-oragnic",
        "name": "Các loại rau củ quả Oragnic",
        "subtitle": "Rau củ quả canh tác hữu cơ, không hoá chất",
        "position": 25,
        "parent": "san-pham",
    },
    {
        "slug": "trai-cay-tuoi-hang-ngay",
        "name": "Trái cây tươi hàng ngày",
        "subtitle": "Hoa quả tươi sơ chế sẵn, tiện dùng mỗi ngày",
        "position": 30,
    },
    {
        "slug": "khay-set-hoa-qua",
        "name": "Khay/set hoa quả",
        "subtitle": "Khay và set hoa quả cắt sẵn cho văn phòng, tiệc nhỏ và gia đình",
        "position": 31,
        "parent": "trai-cay-tuoi-hang-ngay",
    },
    {
        "slug": "bo-doi-dinh-duong",
        "name": "Bộ đôi dinh dưỡng",
        "subtitle": "Hai loại quả bổ trợ nhau trong một combo tiết kiệm",
        "position": 32,
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


def main() -> None:
    with SessionLocal() as db:
        # Xoá sạch để chạy lại seed nhiều lần mà không nhân đôi dữ liệu.
        # Bảng nối được dọn qua quan hệ nên chỉ cần xoá các bảng chính.
        # Danh mục con xoá trước cha để không phụ thuộc cách InnoDB xử lý FK tự tham chiếu
        # khi xoá hàng loạt.
        db.execute(delete(Category).where(Category.parent_id.is_not(None)))
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
        for offset, (data, slugs) in enumerate(entries):
            created = base_time + timedelta(seconds=offset)
            db.add(
                Product(
                    **data,
                    hover_image=HOVER_IMAGE,
                    categories=[categories[slug] for slug in slugs],
                    created_at=created,
                    updated_at=created,
                )
            )

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

        db.commit()

    print(
        f"Đã nạp: {len(PRODUCT_CATEGORIES) + len(POST_CATEGORIES)} danh mục, "
        f"{len(PRODUCTS) + len(KLEVER_PRODUCTS)} sản phẩm, {len(posts)} bài viết, "
        f"{len(STORES)} cửa hàng, 5 tài khoản."
    )
    engine.dispose()


if __name__ == "__main__":
    main()
