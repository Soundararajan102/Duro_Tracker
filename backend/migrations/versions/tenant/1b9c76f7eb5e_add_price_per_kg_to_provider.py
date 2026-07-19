"""add price_per_kg to provider

Revision ID: 1b9c76f7eb5e
Revises: 4fbca79c1a42
Create Date: 2026-07-18 10:04:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b9c76f7eb5e'
down_revision: Union[str, None] = '4fbca79c1a42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # We do NOT specify schema="tenant" here because the schema_translate_map handles it
    op.add_column('providers', sa.Column('price_per_kg', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column('providers', 'price_per_kg')
