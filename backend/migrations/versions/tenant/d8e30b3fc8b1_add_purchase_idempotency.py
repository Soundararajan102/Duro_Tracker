"""add purchase idempotency

Revision ID: d8e30b3fc8b1
Revises: 2735a66f5a83
Create Date: 2026-07-19 09:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e30b3fc8b1'
down_revision: Union[str, Sequence[str], None] = '2735a66f5a83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add idempotency_key to purchase_bills
    op.add_column('purchase_bills', sa.Column('idempotency_key', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_purchase_bills_idempotency_key'), 'purchase_bills', ['idempotency_key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_purchase_bills_idempotency_key'), table_name='purchase_bills')
    op.drop_column('purchase_bills', 'idempotency_key')
