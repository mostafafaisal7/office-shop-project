"""add cart indexes for deduplication and performance

Revision ID: f1a2b3c4d5e6
Revises: d8e9f0a1b2c3
Create Date: 2025-10-29 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd8e9f0a1b2c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add indexes to cart_items table for better query performance."""

    # Add individual indexes
    op.create_index('ix_cart_items_user_id', 'cart_items', ['user_id'], unique=False)
    op.create_index('ix_cart_items_guest_id', 'cart_items', ['guest_id'], unique=False)
    op.create_index('ix_cart_items_customization_id', 'cart_items', ['customization_id'], unique=False)

    # Add composite indexes for deduplication queries (user cart)
    op.create_index(
        'idx_cart_user_product_size_custom',
        'cart_items',
        ['user_id', 'product_id', 'size', 'customization_id'],
        unique=False
    )

    # Add composite indexes for deduplication queries (guest cart)
    op.create_index(
        'idx_cart_guest_product_size_custom',
        'cart_items',
        ['guest_id', 'product_id', 'size', 'customization_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema - Remove indexes from cart_items."""

    # Remove composite indexes
    op.drop_index('idx_cart_guest_product_size_custom', table_name='cart_items')
    op.drop_index('idx_cart_user_product_size_custom', table_name='cart_items')

    # Remove individual indexes
    op.drop_index('ix_cart_items_customization_id', table_name='cart_items')
    op.drop_index('ix_cart_items_guest_id', table_name='cart_items')
    op.drop_index('ix_cart_items_user_id', table_name='cart_items')
