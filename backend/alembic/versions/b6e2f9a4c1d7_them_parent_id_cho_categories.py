"""them parent_id cho categories

Revision ID: b6e2f9a4c1d7
Revises: f4b2d81c9e57
Create Date: 2026-09-17 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6e2f9a4c1d7'
down_revision: Union[str, Sequence[str], None] = 'f4b2d81c9e57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Danh mục cũ: chưa có cha (NULL); `python seed.py` gán lại cây 2 cấp.
    op.add_column('categories', sa.Column('parent_id', sa.String(length=36), nullable=True))
    op.create_index('ix_categories_parent_id', 'categories', ['parent_id'], unique=False)
    op.create_foreign_key(
        'fk_categories_parent_id_categories',
        'categories',
        'categories',
        ['parent_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_categories_parent_id_categories', 'categories', type_='foreignkey')
    op.drop_index('ix_categories_parent_id', table_name='categories')
    op.drop_column('categories', 'parent_id')
