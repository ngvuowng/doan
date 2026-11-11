"""dong bo anh san pham moi va danh muc rau cu

Revision ID: b8d2f6a4c193
Revises: e7a3c5d9f142
Create Date: 2026-11-12 09:00:00.000000

Migration dữ liệu cho CSDL đang chạy thật (máy chủ không chạy lại seed.py vì seed xoá sạch
dữ liệu). Nó đưa CSDL về đúng dữ liệu của commit "Thay toàn bộ ảnh sản phẩm bằng bộ ảnh mới":
- đổi tên danh mục rau củ,
- đổi đuôi ảnh .png -> .jpg của 3 sản phẩm gốc,
- xoá 8 sản phẩm không còn ảnh,
- thêm 6 rau củ hữu cơ,
- gán "Cà chua Đà Lạt" vào danh mục rau củ.
Chạy nhiều lần vẫn an toàn. CSDL mới tạo (chưa seed, chưa có danh mục) thì bỏ qua, vì seed.py
đã nạp sẵn dữ liệu mới.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.models import new_id, utcnow


# revision identifiers, used by Alembic.
revision: str = 'b8d2f6a4c193'
down_revision: Union[str, Sequence[str], None] = 'e7a3c5d9f142'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

VEG_SLUG = 'cac-loai-rau-cu-qua-oragnic'
VEG_NAME = 'Các loại rau củ quả'
RENAMED_IMAGES = {
    f'/images/product-{slug}.png': f'/images/product-{slug}.jpg'
    for slug in ('vai-nhap-khau', 'tao-nhap-khau', 'ca-chua-da-lat')
}
# slug -> ảnh cũ đã xoá khỏi public/images.
REMOVED = {
    'bom-my': '/images/product-bom-my.png',
    'qua-tang-mung-quoc-khanh-2026-04': '/images/product-qua-tang-mung-quoc-khanh-2026-04.jpg',
    'kiwi-vang-new-zealand': '/images/product-kiwi-vang-new-zealand.jpg',
    'luu-giong-peru': '/images/product-luu-giong-peru.jpg',
    'thach-dua-crown-musk-melon-nhat-ban': '/images/product-thach-dua-crown-musk-melon-nhat-ban.jpg',
    'combo-03-chai-nuoc-ep-le-fruit': '/images/product-combo-03-chai-nuoc-ep-le-fruit.jpg',
    'detox-co-the': '/images/product-detox-co-the.jpg',
    'nuoc-ep-tao-nguyen-chat-chii-chan-nhat-ban': '/images/product-nuoc-ep-tao-nguyen-chat-chii-chan-nhat-ban.jpg',
}
# Dòng đơn hàng cũ của sản phẩm bị xoá vẫn giữ tên và giá; ảnh thì trỏ về logo để không vỡ.
PLACEHOLDER_IMAGE = '/images/logo.png'


def upgrade() -> None:
    conn = op.get_bind()
    veg_id = conn.execute(
        sa.text("SELECT id FROM categories WHERE slug = :s AND kind = 'product'"), {'s': VEG_SLUG}
    ).scalar()
    if veg_id is None:
        return

    # Import ở đây: seed.py đọc file dữ liệu khi nạp module, CSDL mới không cần tới.
    from seed import VEGETABLE_PRODUCTS

    conn.execute(sa.text('UPDATE categories SET name = :n WHERE id = :id'), {'n': VEG_NAME, 'id': veg_id})

    for old, new in RENAMED_IMAGES.items():
        for table in ('products', 'order_items'):
            conn.execute(sa.text(f'UPDATE {table} SET image = :new WHERE image = :old'), {'new': new, 'old': old})

    for slug, image in REMOVED.items():
        conn.execute(
            sa.text('UPDATE order_items SET image = :p WHERE image = :old'), {'p': PLACEHOLDER_IMAGE, 'old': image}
        )
        # FK: product_categories xoá theo (CASCADE), order_items.product_id về NULL (SET NULL).
        conn.execute(sa.text('DELETE FROM products WHERE slug = :s'), {'s': slug})

    now = utcnow()
    for data in VEGETABLE_PRODUCTS:
        if conn.execute(sa.text('SELECT 1 FROM products WHERE slug = :s'), {'s': data['slug']}).first():
            continue
        product_id = new_id()
        conn.execute(
            sa.text(
                'INSERT INTO products (id, slug, name, price, sale_price, image, hover_image,'
                ' short_description, description, stock, created_at, updated_at)'
                ' VALUES (:id, :slug, :name, :price, :sale_price, :image, NULL,'
                ' :short_description, :description, 100, :now, :now)'
            ),
            {**data, 'id': product_id, 'now': now},
        )
        conn.execute(
            sa.text('INSERT INTO product_categories (product_id, category_id) VALUES (:p, :c)'),
            {'p': product_id, 'c': veg_id},
        )

    tomato = conn.execute(sa.text("SELECT id FROM products WHERE slug = 'ca-chua-da-lat'")).scalar()
    if tomato and not conn.execute(
        sa.text('SELECT 1 FROM product_categories WHERE product_id = :p AND category_id = :c'),
        {'p': tomato, 'c': veg_id},
    ).first():
        conn.execute(
            sa.text('INSERT INTO product_categories (product_id, category_id) VALUES (:p, :c)'),
            {'p': tomato, 'c': veg_id},
        )


def downgrade() -> None:
    """Migration dữ liệu: không khôi phục sản phẩm đã xoá (ảnh của chúng cũng đã bỏ)."""
