"""preserve_delivery_history

Revision ID: f84826d7025c
Revises: fcf867a39753
Create Date: 2026-07-18 11:00:21.964129

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f84826d7025c'
down_revision: Union[str, Sequence[str], None] = 'fcf867a39753'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


import os

def upgrade() -> None:
    """Upgrade schema."""
    if os.environ.get("ALEMBIC_MODE") == "public":
        return
        
    op.alter_column('delivery_entries', 'driver_id', existing_type=sa.UUID(), nullable=True)
    op.drop_constraint('fk_delivery_entries_driver_id_users', 'delivery_entries', type_='foreignkey')
    op.create_foreign_key('fk_delivery_entries_driver_id_users', 'delivery_entries', 'users', ['driver_id'], ['id'], referent_schema='public', ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    if os.environ.get("ALEMBIC_MODE") == "public":
        return
        
    op.drop_constraint('fk_delivery_entries_driver_id_users', 'delivery_entries', type_='foreignkey')
    op.create_foreign_key('fk_delivery_entries_driver_id_users', 'delivery_entries', 'users', ['driver_id'], ['id'], referent_schema='public', ondelete='CASCADE')
    op.alter_column('delivery_entries', 'driver_id', existing_type=sa.UUID(), nullable=False)
