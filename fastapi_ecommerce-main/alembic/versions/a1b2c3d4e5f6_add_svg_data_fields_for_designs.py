"""add svg data fields for designs

Revision ID: a1b2c3d4e5f6
Revises: 6b6cc1cb2a00
Create Date: 2025-10-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '6b6cc1cb2a00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add svg_data to customization_options table
    op.add_column('customization_options', sa.Column('svg_data', sa.Text(), nullable=True))

    # Add design fields to order_items table
    op.add_column('order_items', sa.Column('design_svg_data', sa.Text(), nullable=True))
    op.add_column('order_items', sa.Column('design_canvas_data', sa.JSON(), nullable=True))
    op.add_column('order_items', sa.Column('design_elements', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove svg_data from customization_options table
    op.drop_column('customization_options', 'svg_data')

    # Remove design fields from order_items table
    op.drop_column('order_items', 'design_svg_data')
    op.drop_column('order_items', 'design_canvas_data')
    op.drop_column('order_items', 'design_elements')
