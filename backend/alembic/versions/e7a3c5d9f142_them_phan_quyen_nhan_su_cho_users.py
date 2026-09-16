"""them phan quyen nhan su cho users

Revision ID: e7a3c5d9f142
Revises: c9e4a71d2b58
Create Date: 2026-09-17 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7a3c5d9f142'
down_revision: Union[str, Sequence[str], None] = 'c9e4a71d2b58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Tài khoản cũ: chưa có quyền nào (ADMIN vẫn toàn quyền theo vai trò), không gắn
    # cửa hàng, đang hoạt động. MySQL không cho DEFAULT thường trên cột JSON nên
    # thêm nullable rồi điền mảng rỗng, sau đó mới siết NOT NULL.
    op.add_column('users', sa.Column('permissions', sa.JSON(), nullable=True))
    op.execute("UPDATE users SET permissions = JSON_ARRAY()")
    op.alter_column('users', 'permissions', existing_type=sa.JSON(), nullable=False)
    op.add_column('users', sa.Column('store_id', sa.String(length=36), nullable=True))
    op.add_column(
        'users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1')
    )
    op.create_index('ix_users_store_id', 'users', ['store_id'], unique=False)
    op.create_foreign_key(
        'fk_users_store_id_stores', 'users', 'stores', ['store_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_users_store_id_stores', 'users', type_='foreignkey')
    op.drop_index('ix_users_store_id', table_name='users')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'store_id')
    op.drop_column('users', 'permissions')
