"""prevent_item_cascade

Revision ID: 9f9b588b8687
Revises: f84826d7025c
Create Date: 2026-07-18 11:28:59.985463

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f9b588b8687'
down_revision: Union[str, Sequence[str], None] = 'f84826d7025c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


import os

def upgrade() -> None:
    """Upgrade schema."""
    if os.environ.get("ALEMBIC_MODE") == "public":
        return
        
    op.drop_constraint('fk_delivery_entries_item_id_items', 'delivery_entries', type_='foreignkey')
    op.create_foreign_key('fk_delivery_entries_item_id_items', 'delivery_entries', 'items', ['item_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    if os.environ.get("ALEMBIC_MODE") == "public":
        return
        
    op.drop_constraint('fk_delivery_entries_item_id_items', 'delivery_entries', type_='foreignkey')
    op.create_foreign_key('fk_delivery_entries_item_id_items', 'delivery_entries', 'items', ['item_id'], ['id'], ondelete='CASCADE')
