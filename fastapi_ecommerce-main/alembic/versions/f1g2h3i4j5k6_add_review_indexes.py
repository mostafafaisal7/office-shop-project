"""add_review_indexes

Revision ID: f1g2h3i4j5k6
Revises: a1b2c3d4e5f6
Create Date: 2025-10-25 19:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1g2h3i4j5k6'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Add indexes to reviews table for performance optimization
    # These indexes significantly improve query performance for sorting and filtering

    # Index for status filtering (used in WHERE clauses)
    op.create_index('idx_reviews_status', 'reviews', ['status'])

    # Index for is_active filtering (used in WHERE clauses)
    op.create_index('idx_reviews_is_active', 'reviews', ['is_active'])

    # Index for helpful_count sorting (used in ORDER BY for most helpful reviews)
    op.create_index('idx_reviews_helpful_count', 'reviews', ['helpful_count'])

    # Index for created_at sorting (used in ORDER BY for latest reviews)
    op.create_index('idx_reviews_created_at', 'reviews', ['created_at'])

    # Composite index for the most common query pattern:
    # WHERE product_id = X AND status = 'approved' AND is_active = 1
    # ORDER BY helpful_count DESC, created_at DESC
    op.create_index(
        'idx_reviews_product_status_active_helpful',
        'reviews',
        ['product_id', 'status', 'is_active', 'helpful_count', 'created_at']
    )


def downgrade():
    # Remove the indexes in reverse order
    op.drop_index('idx_reviews_product_status_active_helpful', 'reviews')
    op.drop_index('idx_reviews_created_at', 'reviews')
    op.drop_index('idx_reviews_helpful_count', 'reviews')
    op.drop_index('idx_reviews_is_active', 'reviews')
    op.drop_index('idx_reviews_status', 'reviews')
