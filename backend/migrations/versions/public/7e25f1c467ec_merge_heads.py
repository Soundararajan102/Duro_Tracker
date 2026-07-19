"""merge heads

Revision ID: 7e25f1c467ec
Revises: b235c2b39a61, e123456789ab
Create Date: 2026-07-19 19:22:03.710407

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e25f1c467ec'
down_revision: Union[str, Sequence[str], None] = ('b235c2b39a61', 'e123456789ab')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
