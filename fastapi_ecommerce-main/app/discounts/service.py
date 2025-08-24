from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.discounts import crud
from app.discounts.models import DiscountType
from app.discounts.schemas import DiscountCalculationRequest, DiscountCalculationResponse
from app.common.http import http_get
import os

# Service URLs for microservice communication
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8000/products")


async def calculate_product_discount(
    db: AsyncSession, 
    product_id: int, 
    quantity: int,
    unit_price: float
) -> DiscountCalculationResponse:
    """
    Calculate the best applicable discount for a product based on quantity
    """
    # Get all active discount rules for this product
    discount_rules = await crud.get_product_discount_rules(db, product_id, is_active=True)
    
    if not discount_rules:
        return DiscountCalculationResponse(applicable=False)
    
    # Find applicable discounts (quantity meets minimum requirement)
    applicable_discounts = [
        rule for rule in discount_rules 
        if quantity >= rule.min_quantity
    ]
    
    if not applicable_discounts:
        return DiscountCalculationResponse(applicable=False)
    
    # Apply the best discount (highest discount value for percentage, or highest fixed amount)
    best_discount = None
    best_discount_amount = 0
    
    for rule in applicable_discounts:
        if rule.discount_type == DiscountType.PERCENTAGE:
            discount_amount = unit_price * (rule.discount_value / 100)
        else:  # FIXED_AMOUNT
            discount_amount = rule.discount_value
        
        if discount_amount > best_discount_amount:
            best_discount_amount = discount_amount
            best_discount = rule
    
    if not best_discount:
        return DiscountCalculationResponse(applicable=False)
    
    return DiscountCalculationResponse(
        applicable=True,
        discount_type=best_discount.discount_type,
        discount_value=best_discount.discount_value,
        discount_amount=best_discount_amount,
        rule_name=best_discount.name,
        rule_id=best_discount.id,
        min_quantity_met=best_discount.min_quantity
    )


async def validate_product_exists(product_id: int) -> bool:
    """
    Validate that a product exists by calling the product service
    """
    try:
        product_url = f"{PRODUCT_SERVICE_URL}/{product_id}"
        product = await http_get(product_url)
        return product is not None
    except Exception:
        return False


async def get_product_info(product_id: int) -> Optional[dict]:
    """
    Get product information from product service
    """
    try:
        product_url = f"{PRODUCT_SERVICE_URL}/{product_id}"
        return await http_get(product_url)
    except Exception:
        return None


def calculate_discount_amount(
    unit_price: float, 
    discount_type: DiscountType, 
    discount_value: float
) -> float:
    """
    Calculate the actual discount amount based on type and value
    """
    if discount_type == DiscountType.PERCENTAGE:
        return unit_price * (discount_value / 100)
    else:  # FIXED_AMOUNT
        return min(discount_value, unit_price)  # Don't exceed unit price


def format_discount_description(
    discount_type: DiscountType, 
    discount_value: float, 
    min_quantity: int
) -> str:
    """
    Format a human-readable discount description
    """
    if discount_type == DiscountType.PERCENTAGE:
        return f"{discount_value}% off for {min_quantity}+ items"
    else:
        return f"${discount_value} off per item for {min_quantity}+ items"


async def get_product_discount_summary(db: AsyncSession, product_id: int) -> dict:
    """
    Get a summary of all discount rules for a product
    """
    discount_rules = await crud.get_product_discount_rules(db, product_id, is_active=True)
    
    summary = {
        "product_id": product_id,
        "has_discounts": len(discount_rules) > 0,
        "discount_count": len(discount_rules),
        "discount_rules": []
    }
    
    for rule in discount_rules:
        rule_info = {
            "id": rule.id,
            "name": rule.name,
            "description": format_discount_description(
                rule.discount_type, 
                rule.discount_value, 
                rule.min_quantity
            ),
            "min_quantity": rule.min_quantity,
            "discount_type": rule.discount_type.value,
            "discount_value": rule.discount_value
        }
        summary["discount_rules"].append(rule_info)
    
    # Sort by min_quantity for better display
    summary["discount_rules"].sort(key=lambda x: x["min_quantity"])
    
    return summary


async def preview_discount_calculation(
    db: AsyncSession, 
    product_id: int, 
    quantities: list[int],
    unit_price: float
) -> dict:
    """
    Preview how discounts would apply to different quantities
    """
    previews = []
    
    for quantity in quantities:
        discount_result = await calculate_product_discount(
            db, product_id, quantity, unit_price
        )
        
        original_total = unit_price * quantity
        discounted_total = original_total
        savings = 0
        
        if discount_result.applicable and discount_result.discount_amount:
            total_discount = discount_result.discount_amount * quantity
            discounted_total = original_total - total_discount
            savings = total_discount
        
        preview = {
            "quantity": quantity,
            "unit_price": unit_price,
            "original_total": original_total,
            "discount_applicable": discount_result.applicable,
            "discount_info": discount_result.dict() if discount_result.applicable else None,
            "discounted_total": discounted_total,
            "total_savings": savings,
            "savings_percentage": (savings / original_total * 100) if original_total > 0 else 0
        }
        previews.append(preview)
    
    return {
        "product_id": product_id,
        "unit_price": unit_price,
        "quantity_previews": previews
    }
