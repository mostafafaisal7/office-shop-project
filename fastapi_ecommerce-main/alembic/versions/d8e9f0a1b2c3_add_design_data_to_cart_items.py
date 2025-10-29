"""add design data to cart items

Revision ID: d8e9f0a1b2c3
Revises: a1b2c3d4e5f6
Create Date: 2025-10-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e9f0a1b2c3'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add design data fields to cart_items table."""
    # Add design data fields to cart_items
    op.add_column('cart_items', sa.Column('design_canvas_data', sa.JSON(), nullable=True))
    op.add_column('cart_items', sa.Column('design_svg_data', sa.Text(), nullable=True))
    op.add_column('cart_items', sa.Column('design_elements', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema - Remove design data fields from cart_items."""
    op.drop_column('cart_items', 'design_elements')
    op.drop_column('cart_items', 'design_svg_data')
    op.drop_column('cart_items', 'design_canvas_data')
