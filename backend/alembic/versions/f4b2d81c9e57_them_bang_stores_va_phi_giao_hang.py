"""them bang stores va phi giao hang

Revision ID: f4b2d81c9e57
Revises: a7c31f9e2b40
Create Date: 2026-09-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4b2d81c9e57'
down_revision: Union[str, Sequence[str], None] = 'a7c31f9e2b40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'stores',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=False),
        # DOUBLE để giữ đủ chữ số thập phân của toạ độ (FLOAT của MySQL làm lệch vị trí).
        sa.Column('lat', sa.Double(), nullable=False),
        sa.Column('lng', sa.Double(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    # Đơn cũ: không gắn cửa hàng, phí 0 (trước đây miễn phí), không có khoảng cách.
    op.add_column('orders', sa.Column('store_id', sa.String(length=36), nullable=True))
    op.add_column(
        'orders',
        sa.Column('shipping_fee', sa.Integer(), nullable=False, server_default='0'),
    )
    op.add_column('orders', sa.Column('distance_km', sa.Double(), nullable=True))
    op.create_index('ix_orders_store_id', 'orders', ['store_id'], unique=False)
    op.create_foreign_key(
        'fk_orders_store_id_stores', 'orders', 'stores', ['store_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_orders_store_id_stores', 'orders', type_='foreignkey')
    op.drop_index('ix_orders_store_id', table_name='orders')
    op.drop_column('orders', 'distance_km')
    op.drop_column('orders', 'shipping_fee')
    op.drop_column('orders', 'store_id')
    op.drop_table('stores')
