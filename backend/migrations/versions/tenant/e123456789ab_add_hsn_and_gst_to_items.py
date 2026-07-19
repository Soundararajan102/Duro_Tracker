"""add hsn and gst to items

Revision ID: e123456789ab
Revises: d8e30b3fc8b1
Create Date: 2026-07-19 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e123456789ab'
down_revision: Union[str, Sequence[str], None] = 'd8e30b3fc8b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('items', sa.Column('hsn_code', sa.String(length=50), nullable=True))
    op.add_column('items', sa.Column('gst_percent', sa.Numeric(precision=5, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column('items', 'gst_percent')
    op.drop_column('items', 'hsn_code')
