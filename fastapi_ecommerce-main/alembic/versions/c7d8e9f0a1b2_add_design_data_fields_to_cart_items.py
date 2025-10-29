"""add design data fields to cart items

Revision ID: c7d8e9f0a1b2
Revises: a1b2c3d4e5f6
Create Date: 2025-10-29 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'c7d8e9f0a1b2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Add design data fields to cart_items
    op.add_column('cart_items', sa.Column('design_canvas_data', sa.JSON(), nullable=True))
    op.add_column('cart_items', sa.Column('design_svg_data', sa.Text(), nullable=True))
    op.add_column('cart_items', sa.Column('design_elements', sa.JSON(), nullable=True))


def downgrade():
    # Remove design data fields from cart_items
    op.drop_column('cart_items', 'design_elements')
    op.drop_column('cart_items', 'design_svg_data')
    op.drop_column('cart_items', 'design_canvas_data')
