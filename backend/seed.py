"""Nạp dữ liệu gốc của nongsan.maugiaodien.com vào MySQL.

Chuyển từ prisma/seed.ts của bản Next.js + SQLite, giữ nguyên cách làm:
sản phẩm/danh mục chép từ trang chủ lưu trữ, còn nội dung bài viết đọc trực tiếp
từ RSS lưu trữ (`_reference/original-feed.xml`) để giữ đúng văn bản gốc.

Chạy: python seed.py
"""

import re
from datetime import timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

from sqlalchemy import delete

from app.database import SessionLocal, engine
from app.models import Category, ContactMessage, Order, OrderItem, Post, Product, User, utcnow
from app.security import hash_password

BASE_DIR = Path(__file__).resolve().parent
FEED_PATH = BASE_DIR.parent / "_reference" / "original-feed.xml"

PRODUCT_CATEGORIES = [
    {
        "slug": "trai-cay-nhap-khau",
        "name": "Trái cây nhập khẩu",
        "subtitle": "Là nhà cung cấp thực phẩm tươi sạch hàng đầu khu vực phía nam",
        "position": 1,
    },
    {
        "slug": "trai-cay-noi-dia",
        "name": "Trái cây nội địa",
        "subtitle": "Có hàng ngàn mẫu hoa quả tươi đủ loại cho bạn chọn!",
        "position": 2,
    },
    {
        "slug": "nuoc-ep",
        "name": "Nước ép",
        "subtitle": "Mang lại sự sảng khoái khi thưởng thức nước ép tại Halona Fruits",
        "position": 3,
    },
    {
        "slug": "cac-loai-hat-dinh-duong",
        "name": "Các loại hạt dinh dưỡng",
        "subtitle": "Nguồn dinh dưỡng tự nhiên cho cả gia đình",
        "position": 4,
    },
    # "Oragnic" là lỗi chính tả có sẵn trên site gốc — giữ nguyên để trung thành với bản clone.
    {
        "slug": "cac-loai-rau-cu-qua-oragnic",
        "name": "Các loại rau củ quả Oragnic",
        "subtitle": "Rau củ quả canh tác hữu cơ, không hoá chất",
        "position": 5,
    },
]

POST_CATEGORIES = [
    {"slug": "tin-tuc", "name": "Tin tức", "position": 1},
    {"slug": "lam-dep", "name": "Làm đẹp", "position": 2},
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

# Bản gốc dùng CHUNG một ảnh cắt vuông (Screenshot_4-300x300) làm ảnh hover cho cả 4
# sản phẩm, nên rê chuột lên "Cà chua Đà Lạt" lại hiện quả táo. Đó là lỗi cấu hình của
# site demo; ở đây bỏ ảnh hover và dùng hiệu ứng phóng to nhẹ thay thế.
HOVER_IMAGE = None

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
        for model in (OrderItem, Order, ContactMessage, Post, Product, Category, User):
            db.execute(delete(model))
        db.commit()

        categories: dict[str, Category] = {}
        for data in PRODUCT_CATEGORIES:
            categories[data["slug"]] = Category(**data, kind="product")
        for data in POST_CATEGORIES:
            categories[data["slug"]] = Category(**data, kind="post")
        db.add_all(categories.values())

        # Bản gốc hiển thị cả 4 sản phẩm ở 3 danh mục đầu tiên.
        in_categories = [categories[s] for s in ("trai-cay-nhap-khau", "trai-cay-noi-dia", "nuoc-ep")]
        # Gán created_at cách nhau 1 giây để thứ tự hiển thị luôn đúng như site gốc
        # (Bom mỹ → Vải → Táo → Cà chua), không phụ thuộc tốc độ chèn.
        base_time = utcnow()
        for offset, data in enumerate(PRODUCTS):
            created = base_time + timedelta(seconds=offset)
            db.add(
                Product(
                    **data,
                    hover_image=HOVER_IMAGE,
                    categories=list(in_categories),
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
            ]
        )

        db.commit()

    print(
        f"Đã nạp: {len(PRODUCT_CATEGORIES) + len(POST_CATEGORIES)} danh mục, "
        f"{len(PRODUCTS)} sản phẩm, {len(posts)} bài viết, 2 tài khoản."
    )
    engine.dispose()


if __name__ == "__main__":
    main()
