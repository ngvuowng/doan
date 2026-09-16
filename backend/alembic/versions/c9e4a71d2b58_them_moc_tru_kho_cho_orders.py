"""them moc tru kho cho orders

Revision ID: c9e4a71d2b58
Revises: b6e2f9a4c1d7
Create Date: 2026-09-17 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = 'c9e4a71d2b58'
down_revision: Union[str, Sequence[str], None] = 'b6e2f9a4c1d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Đơn cũ: NULL = chưa trừ kho. Không hồi tố vì trước đây hệ thống không trừ kho.
    op.add_column('orders', sa.Column('stock_deducted_at', mysql.DATETIME(fsp=6), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('orders', 'stock_deducted_at')
