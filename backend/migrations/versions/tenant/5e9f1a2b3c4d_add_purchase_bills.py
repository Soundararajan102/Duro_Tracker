"""add purchase bills

Revision ID: 5e9f1a2b3c4d
Revises: 1b9c76f7eb5e
Create Date: 2026-07-18 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e9f1a2b3c4d'
down_revision: Union[str, None] = '1b9c76f7eb5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create purchase_bills table
    op.create_table(
        'purchase_bills',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('provider_id', sa.Uuid(), nullable=False),
        sa.Column('bill_number', sa.String(), nullable=True),
        sa.Column('total_cost', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.0'),
        sa.Column('amount_paid', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_purchase_bills_id'), 'purchase_bills', ['id'], unique=False)
    op.create_index(op.f('ix_purchase_bills_provider_id'), 'purchase_bills', ['provider_id'], unique=False)

    # 2. Add purchase_bill_id to purchase_entries (nullable initially)
    op.add_column('purchase_entries', sa.Column('purchase_bill_id', sa.Uuid(), nullable=True))
    op.create_index(op.f('ix_purchase_entries_purchase_bill_id'), 'purchase_entries', ['purchase_bill_id'], unique=False)
    op.create_foreign_key('fk_purchase_entries_bill_id', 'purchase_entries', 'purchase_bills', ['purchase_bill_id'], ['id'])

    # 3. Data migration
    connection = op.get_bind()
    entries = connection.execute(sa.text("SELECT id, provider_id, total_cost, amount_paid FROM purchase_entries")).fetchall()
    
    for entry in entries:
        from uuid import uuid4
        bill_id = uuid4()
        connection.execute(
            sa.text("""
                INSERT INTO purchase_bills (id, provider_id, total_cost, amount_paid, created_at, updated_at) 
                VALUES (:id, :provider_id, :total_cost, :amount_paid, now(), now())
            """),
            {"id": bill_id, "provider_id": entry[1], "total_cost": entry[2], "amount_paid": entry[3]}
        )
        connection.execute(
            sa.text("UPDATE purchase_entries SET purchase_bill_id = :bill_id WHERE id = :entry_id"),
            {"bill_id": bill_id, "entry_id": entry[0]}
        )

    # 4. Make purchase_bill_id non-nullable
    op.alter_column('purchase_entries', 'purchase_bill_id', existing_type=sa.Uuid(), nullable=False)

    # 5. Drop old columns
    # In SQLite dropping foreign keys requires batch_alter_table, but for PostgreSQL this works
    # However we need the exact constraint name. If this fails, we can find the constraint name.
    # We will query pg_constraint to get the foreign key name for provider_id on purchase_entries
    fk_name_result = connection.execute(sa.text("""
        SELECT conname
        FROM pg_constraint
        JOIN pg_class ON conrelid = pg_class.oid
        WHERE pg_class.relname = 'purchase_entries' AND contype = 'f'
        AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = pg_class.oid AND attname = 'provider_id')
    """)).fetchone()
    
    if fk_name_result:
        op.drop_constraint(fk_name_result[0], 'purchase_entries', type_='foreignkey')
        
    op.drop_column('purchase_entries', 'provider_id')
    op.drop_column('purchase_entries', 'amount_paid')


def downgrade() -> None:
    pass
