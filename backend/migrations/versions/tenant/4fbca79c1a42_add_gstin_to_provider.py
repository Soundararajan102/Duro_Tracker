"""add gstin to provider

Revision ID: 4fbca79c1a42
Revises: 9f9b588b8687
Create Date: 2026-07-18 13:21:08.822284

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fbca79c1a42'
down_revision: Union[str, Sequence[str], None] = '9f9b588b8687'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('providers', sa.Column('gstin', sa.String(length=50), nullable=True), schema='tenant')

def downgrade() -> None:
    op.drop_column('providers', 'gstin', schema='tenant')
