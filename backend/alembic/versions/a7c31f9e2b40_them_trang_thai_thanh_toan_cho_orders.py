"""them trang thai thanh toan cho orders

Revision ID: a7c31f9e2b40
Revises: 65d57f58f042
Create Date: 2026-09-16 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = 'a7c31f9e2b40'
down_revision: Union[str, Sequence[str], None] = '65d57f58f042'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Đơn cũ mặc định UNPAID và không có hạn thanh toán nên không bao giờ bị tự huỷ.
    op.add_column(
        'orders',
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='UNPAID'),
    )
    op.add_column('orders', sa.Column('paid_at', mysql.DATETIME(fsp=6), nullable=True))
    op.add_column('orders', sa.Column('payment_expires_at', mysql.DATETIME(fsp=6), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('orders', 'payment_expires_at')
    op.drop_column('orders', 'paid_at')
    op.drop_column('orders', 'payment_status')
