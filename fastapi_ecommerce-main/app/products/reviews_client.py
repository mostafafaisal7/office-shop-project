# products/reviews_client.py

from typing import Optional, List, Dict, Any
from app.common.http import http_get
import os
import logging

logger = logging.getLogger(__name__)

# Reviews service URL - in microservice architecture, this would be a separate service
REVIEWS_SERVICE_URL = os.getenv("REVIEWS_SERVICE_URL", "http://localhost:8000/reviews")


class ReviewSummary:
    def __init__(self, data: Dict[str, Any]):
        self.product_id = data.get("product_id")
        self.total_reviews = data.get("total_reviews", 0)
        self.average_rating = float(data.get("average_rating", 0))
        self.rating_1_count = data.get("rating_1_count", 0)
        self.rating_2_count = data.get("rating_2_count", 0)
        self.rating_3_count = data.get("rating_3_count", 0)
        self.rating_4_count = data.get("rating_4_count", 0)
        self.rating_5_count = data.get("rating_5_count", 0)


class HelpfulReview:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.user_id = data.get("user_id")
        self.user_name = data.get("user_name", "Anonymous")
        self.rating = data.get("rating")
        self.title = data.get("title")
        self.comment = data.get("comment")
        self.helpful_count = data.get("helpful_count", 0)
        self.created_at = data.get("created_at")
        self.is_verified_purchase = data.get("is_verified_purchase", False)
        self.media = data.get("media", [])


async def get_product_review_summary(product_id: int) -> Optional[ReviewSummary]:
    """Get review summary for a product from reviews service"""
    try:
        url = f"{REVIEWS_SERVICE_URL}/products/{product_id}/summary"
        response = await http_get(url)
        return ReviewSummary(response)
    except Exception as e:
        logger.warning(f"Failed to fetch review summary for product {product_id}: {str(e)}")
        # Return empty summary instead of failing
        return ReviewSummary({
            "product_id": product_id,
            "total_reviews": 0,
            "average_rating": 0,
            "rating_1_count": 0,
            "rating_2_count": 0,
            "rating_3_count": 0,
            "rating_4_count": 0,
            "rating_5_count": 0,
        })


async def get_most_helpful_reviews(product_id: int, limit: int = 5) -> List[HelpfulReview]:
    """Get most helpful reviews for a product from reviews service"""
    try:
        url = f"{REVIEWS_SERVICE_URL}/product/{product_id}/helpful?limit={limit}"
        response = await http_get(url)
        return [HelpfulReview(review) for review in response.get("reviews", [])]
    except Exception as e:
        logger.warning(f"Failed to fetch helpful reviews for product {product_id}: {str(e)}")
        # Return empty list instead of failing
        return []
