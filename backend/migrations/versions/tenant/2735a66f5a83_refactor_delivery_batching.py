"""refactor_delivery_batching

Revision ID: 2735a66f5a83
Revises: 5e9f1a2b3c4d
Create Date: 2026-07-19 07:21:47.796830

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2735a66f5a83'
down_revision: Union[str, Sequence[str], None] = '5e9f1a2b3c4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old delivery_entries
    op.drop_table('delivery_entries')

    # Create delivery_bills
    op.create_table(
        'delivery_bills',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('driver_id', sa.Uuid(), nullable=True),
        sa.Column('buyer_id', sa.Uuid(), nullable=True),
        sa.Column('adhoc_buyer_name', sa.String(length=255), nullable=True),
        sa.Column('idempotency_key', sa.String(length=255), nullable=True),
        sa.Column('total_bill_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('cash_collected', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
        sa.Column('upi_collected', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['buyer_id'], ['buyers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['driver_id'], ['public.users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_delivery_bills_buyer_id'), 'delivery_bills', ['buyer_id'], unique=False)
    op.create_index(op.f('ix_delivery_bills_driver_id'), 'delivery_bills', ['driver_id'], unique=False)
    op.create_index(op.f('ix_delivery_bills_id'), 'delivery_bills', ['id'], unique=False)
    op.create_index(op.f('ix_delivery_bills_idempotency_key'), 'delivery_bills', ['idempotency_key'], unique=True)

    # Create delivery_items
    op.create_table(
        'delivery_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('delivery_bill_id', sa.Uuid(), nullable=False),
        sa.Column('item_id', sa.Uuid(), nullable=False),
        sa.Column('unit_price_at_delivery', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('line_total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('full_delivered', sa.Integer(), server_default='0', nullable=False),
        sa.Column('empty_received', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['delivery_bill_id'], ['delivery_bills.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_delivery_items_delivery_bill_id'), 'delivery_items', ['delivery_bill_id'], unique=False)
    op.create_index(op.f('ix_delivery_items_id'), 'delivery_items', ['id'], unique=False)
    op.create_index(op.f('ix_delivery_items_item_id'), 'delivery_items', ['item_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    pass
