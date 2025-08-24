from sqlalchemy.ext.asyncio import AsyncSession
from . import crud, schemas, models
from typing import Optional, List
from fastapi import HTTPException
from app.common.http import http_get
import os

async def save_shipping_address(db: AsyncSession, data: schemas.ShippingAddressCreate):
    return await crud.create_shipping_address(db, data)

async def get_shipping_address(db: AsyncSession, address_id: str):
    return await crud.get_shipping_address_by_id(db, address_id)

async def get_user_shipping_addresses(db: AsyncSession, user_id: int):
    return await crud.get_shipping_addresses_by_user_id(db, user_id)

async def get_guest_shipping_addresses(db: AsyncSession, guest_id: str):
    return await crud.get_shipping_addresses_by_guest_id(db, guest_id)

async def list_all_shipping_addresses(db: AsyncSession, skip: int = 0, limit: int = 100):
    return await crud.get_all_shipping_addresses(db, skip, limit)

async def list_shipping_methods(db: AsyncSession):
    return await crud.get_shipping_methods(db)

async def get_shipping_method(db: AsyncSession, method_id: int):
    return await crud.get_shipping_method_by_id(db, method_id)

async def add_shipping_method(db: AsyncSession, data: schemas.ShippingMethodCreate):
    return await crud.create_shipping_method(db, data)

async def update_shipping_address(db: AsyncSession, address_id: str, data: schemas.ShippingAddressUpdate):
    return await crud.update_shipping_address(db, address_id, data)

async def delete_shipping_address(db: AsyncSession, address_id: str):
    return await crud.delete_shipping_address(db, address_id)

async def update_shipping_method(db: AsyncSession, method_id: int, data: schemas.ShippingMethodUpdate):
    return await crud.update_shipping_method(db, method_id, data)

async def delete_shipping_method(db: AsyncSession, method_id: int):
    return await crud.delete_shipping_method(db, method_id)


# Shipping Cost Rule Services
async def create_shipping_cost_rule(db: AsyncSession, data: schemas.ShippingCostRuleCreate):
    # Validate that the shipping method exists
    method = await crud.get_shipping_method_by_id(db, data.shipping_method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    # Validate quantity range
    if data.max_quantity is not None and data.min_quantity > data.max_quantity:
        raise HTTPException(status_code=400, detail="min_quantity cannot be greater than max_quantity")
    
    return await crud.create_shipping_cost_rule(db, data)


async def get_shipping_cost_rules_by_method(db: AsyncSession, method_id: int):
    return await crud.get_shipping_cost_rules_by_method(db, method_id)


async def get_shipping_cost_rule(db: AsyncSession, rule_id: int):
    return await crud.get_shipping_cost_rule_by_id(db, rule_id)


async def update_shipping_cost_rule(db: AsyncSession, rule_id: int, data: schemas.ShippingCostRuleUpdate):
    # If updating quantities, validate the range
    if data.min_quantity is not None and data.max_quantity is not None:
        if data.min_quantity > data.max_quantity:
            raise HTTPException(status_code=400, detail="min_quantity cannot be greater than max_quantity")
    
    return await crud.update_shipping_cost_rule(db, rule_id, data)


async def delete_shipping_cost_rule(db: AsyncSession, rule_id: int):
    return await crud.delete_shipping_cost_rule(db, rule_id)


async def get_shipping_method_with_rules(db: AsyncSession, method_id: int):
    return await crud.get_shipping_method_with_rules(db, method_id)


async def calculate_shipping_cost(db: AsyncSession, method_id: int, total_quantity: int) -> schemas.ShippingCostCalculationResponse:
    """Calculate shipping cost based on method and quantity with applicable rules"""
    
    # Get shipping method
    method = await crud.get_shipping_method_by_id(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    if not method.is_active:
        raise HTTPException(status_code=400, detail="Shipping method is not active")
    
    base_cost = float(method.cost)
    final_cost = base_cost
    applied_rules = []
    
    # Get applicable cost rules for the quantity
    cost_rules = await crud.get_applicable_cost_rules(db, method_id, total_quantity)
    
    for rule in cost_rules:
        rule_info = {
            "rule_id": rule.id,
            "min_quantity": rule.min_quantity,
            "max_quantity": rule.max_quantity,
            "cost_adjustment": rule.cost_adjustment,
            "adjustment_type": rule.adjustment_type.value
        }
        
        if rule.adjustment_type == models.AdjustmentType.PER_ITEM:
            # Calculate how many items this rule applies to
            applicable_quantity = total_quantity
            if rule.max_quantity is not None:
                applicable_quantity = min(total_quantity, rule.max_quantity) - rule.min_quantity + 1
            else:
                applicable_quantity = total_quantity - rule.min_quantity + 1
            
            adjustment = rule.cost_adjustment * applicable_quantity
            rule_info["applicable_quantity"] = applicable_quantity
            rule_info["total_adjustment"] = adjustment
        else:  # FLAT_RATE
            adjustment = rule.cost_adjustment
            rule_info["total_adjustment"] = adjustment
        
        final_cost += adjustment
        applied_rules.append(rule_info)
    
    # Ensure final cost is not negative
    final_cost = max(0.0, final_cost)
    
    return schemas.ShippingCostCalculationResponse(
        shipping_method_id=method_id,
        base_cost=base_cost,
        total_quantity=total_quantity,
        applied_rules=applied_rules,
        final_cost=final_cost,
        delivery_days=method.delivery_days
    )


async def get_shipping_cost_preview(db: AsyncSession, method_id: int) -> schemas.ShippingCostPreviewResponse:
    """Get cost preview for different quantity ranges"""
    
    method = await crud.get_shipping_method_by_id(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    # Get all cost rules for this method
    cost_rules = await crud.get_shipping_cost_rules_by_method(db, method_id)
    
    # Create cost breakdown for different quantity ranges
    cost_breakdown = []
    
    # Base cost (quantity 1)
    cost_breakdown.append({
        "quantity_range": "1",
        "cost": float(method.cost),
        "description": "Base cost"
    })
    
    # Add breakdown for each rule
    for rule in cost_rules:
        range_desc = f"{rule.min_quantity}+"
        if rule.max_quantity is not None:
            range_desc = f"{rule.min_quantity}-{rule.max_quantity}"
        
        # Calculate sample cost for the minimum quantity of this rule
        sample_cost_response = await calculate_shipping_cost(db, method_id, rule.min_quantity)
        
        cost_breakdown.append({
            "quantity_range": range_desc,
            "cost": sample_cost_response.final_cost,
            "adjustment": rule.cost_adjustment,
            "adjustment_type": rule.adjustment_type.value,
            "description": f"Cost with {rule.adjustment_type.value} adjustment"
        })
    
    return schemas.ShippingCostPreviewResponse(
        shipping_method_id=method_id,
        base_cost=float(method.cost),
        delivery_days=method.delivery_days,
        cost_breakdown=cost_breakdown
    )


# Product Service URL for validation
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8000/products")


async def validate_product_exists(product_id: int) -> bool:
    """Validate product exists using HTTP call to product service"""
    try:
        product_url = f"{PRODUCT_SERVICE_URL}/{product_id}"
        product = await http_get(product_url)
        return product is not None and product.get("status") == "active"
    except Exception:
        return False


# Product Shipping Rule Services
async def create_product_shipping_rule(db: AsyncSession, data: schemas.ProductShippingRuleCreate):
    """Create a product-specific shipping rule with validation"""
    
    # Validate that the product exists via HTTP call
    if not await validate_product_exists(data.product_id):
        raise HTTPException(status_code=404, detail="Product not found or not active")
    
    # Validate that the shipping method exists
    method = await crud.get_shipping_method_by_id(db, data.shipping_method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    if not method.is_active:
        raise HTTPException(status_code=400, detail="Shipping method is not active")
    
    # Validate quantity range
    if data.max_quantity is not None and data.min_quantity > data.max_quantity:
        raise HTTPException(status_code=400, detail="min_quantity cannot be greater than max_quantity")
    
    return await crud.create_product_shipping_rule(db, data)


async def get_product_shipping_rules(db: AsyncSession, product_id: int, shipping_method_id: Optional[int] = None):
    """Get all shipping rules for a specific product"""
    
    # Validate that the product exists via HTTP call
    if not await validate_product_exists(product_id):
        raise HTTPException(status_code=404, detail="Product not found or not active")
    
    return await crud.get_product_shipping_rules(db, product_id, shipping_method_id)


async def get_product_shipping_rule(db: AsyncSession, rule_id: int):
    """Get a specific product shipping rule by ID"""
    return await crud.get_product_shipping_rule_by_id(db, rule_id)


async def update_product_shipping_rule(db: AsyncSession, rule_id: int, data: schemas.ProductShippingRuleUpdate):
    """Update a product shipping rule"""
    
    # If updating quantities, validate the range
    if data.min_quantity is not None and data.max_quantity is not None:
        if data.min_quantity > data.max_quantity:
            raise HTTPException(status_code=400, detail="min_quantity cannot be greater than max_quantity")
    
    return await crud.update_product_shipping_rule(db, rule_id, data)


async def delete_product_shipping_rule(db: AsyncSession, rule_id: int):
    """Delete a product shipping rule"""
    return await crud.delete_product_shipping_rule(db, rule_id)


async def calculate_product_shipping_cost(db: AsyncSession, data: schemas.ProductShippingCalculationRequest) -> schemas.ProductShippingCalculationResponse:
    """Calculate shipping cost for multiple products with product-specific rules"""
    
    # Get shipping method
    method = await crud.get_shipping_method_by_id(db, data.shipping_method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    if not method.is_active:
        raise HTTPException(status_code=400, detail="Shipping method is not active")
    
    base_cost = float(method.cost)
    total_cost = 0.0
    product_breakdown = []
    
    # Step 1: Group items by product_id and sum their quantities
    product_quantities = {}
    for item in data.items:
        if item.product_id in product_quantities:
            product_quantities[item.product_id] += item.quantity
        else:
            product_quantities[item.product_id] = item.quantity
    
    # Step 2: Process each unique product with aggregated quantity
    for product_id, total_quantity in product_quantities.items():
        # Validate product exists
        if not await validate_product_exists(product_id):
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found or not active")
        
        # Check for product-specific rules first using aggregated quantity
        product_rules = await crud.get_applicable_product_shipping_rules(
            db, product_id, data.shipping_method_id, total_quantity
        )
        
        item_cost = 0.0
        applied_rules = []
        rule_source = "universal"
        
        if product_rules:
            # Use product-specific rules
            rule_source = "product_specific"
            item_cost = base_cost
            
            for rule in product_rules:
                rule_info = {
                    "rule_id": rule.id,
                    "min_quantity": rule.min_quantity,
                    "max_quantity": rule.max_quantity,
                    "cost_adjustment": rule.cost_adjustment,
                    "adjustment_type": rule.adjustment_type.value,
                    "priority": rule.priority
                }
                
                if rule.adjustment_type == models.AdjustmentType.PER_ITEM:
                    applicable_quantity = total_quantity
                    if rule.max_quantity is not None:
                        applicable_quantity = min(total_quantity, rule.max_quantity) - rule.min_quantity + 1
                    else:
                        applicable_quantity = total_quantity - rule.min_quantity + 1
                    
                    adjustment = rule.cost_adjustment * applicable_quantity
                    rule_info["applicable_quantity"] = applicable_quantity
                    rule_info["total_adjustment"] = adjustment
                else:  # FLAT_RATE
                    adjustment = rule.cost_adjustment
                    rule_info["total_adjustment"] = adjustment
                
                item_cost += adjustment
                applied_rules.append(rule_info)
        else:
            # Fall back to universal rules using aggregated quantity
            universal_rules = await crud.get_applicable_cost_rules(db, data.shipping_method_id, total_quantity)
            item_cost = base_cost
            
            for rule in universal_rules:
                rule_info = {
                    "rule_id": rule.id,
                    "min_quantity": rule.min_quantity,
                    "max_quantity": rule.max_quantity,
                    "cost_adjustment": rule.cost_adjustment,
                    "adjustment_type": rule.adjustment_type.value
                }
                
                if rule.adjustment_type == models.AdjustmentType.PER_ITEM:
                    applicable_quantity = total_quantity
                    if rule.max_quantity is not None:
                        applicable_quantity = min(total_quantity, rule.max_quantity) - rule.min_quantity + 1
                    else:
                        applicable_quantity = total_quantity - rule.min_quantity + 1
                    
                    adjustment = rule.cost_adjustment * applicable_quantity
                    rule_info["applicable_quantity"] = applicable_quantity
                    rule_info["total_adjustment"] = adjustment
                else:  # FLAT_RATE
                    adjustment = rule.cost_adjustment
                    rule_info["total_adjustment"] = adjustment
                
                item_cost += adjustment
                applied_rules.append(rule_info)
        
        # Ensure item cost is not negative
        item_cost = max(0.0, item_cost)
        total_cost += item_cost
        
        product_breakdown.append(schemas.ProductShippingBreakdown(
            product_id=product_id,
            quantity=total_quantity,  # Now shows aggregated quantity
            base_cost=base_cost,
            applied_rules=applied_rules,
            final_cost=item_cost,
            rule_source=rule_source
        ))
    
    return schemas.ProductShippingCalculationResponse(
        shipping_method_id=data.shipping_method_id,
        total_cost=total_cost,
        product_breakdown=product_breakdown,
        delivery_days=method.delivery_days
    )


async def get_product_shipping_cost_preview(db: AsyncSession, product_id: int, method_id: int) -> schemas.ProductShippingCostPreviewResponse:
    """Get cost preview for a specific product with different quantity ranges"""
    
    # Validate product exists
    if not await validate_product_exists(product_id):
        raise HTTPException(status_code=404, detail="Product not found or not active")
    
    method = await crud.get_shipping_method_by_id(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    # Get product-specific rules
    product_rules = await crud.get_product_shipping_rules(db, product_id, method_id)
    has_product_rules = len(product_rules) > 0
    
    cost_breakdown = []
    base_cost = float(method.cost)
    
    if has_product_rules:
        # Create breakdown based on product-specific rules
        cost_breakdown.append({
            "quantity_range": "1",
            "cost": base_cost,
            "description": "Base cost (product-specific rules available)"
        })
        
        for rule in product_rules:
            range_desc = f"{rule.min_quantity}+"
            if rule.max_quantity is not None:
                range_desc = f"{rule.min_quantity}-{rule.max_quantity}"
            
            # Calculate sample cost for the minimum quantity of this rule
            sample_request = schemas.ProductShippingCalculationRequest(
                shipping_method_id=method_id,
                items=[schemas.ProductShippingItem(product_id=product_id, quantity=rule.min_quantity)]
            )
            sample_response = await calculate_product_shipping_cost(db, sample_request)
            sample_cost = sample_response.product_breakdown[0].final_cost if sample_response.product_breakdown else base_cost
            
            cost_breakdown.append({
                "quantity_range": range_desc,
                "cost": sample_cost,
                "adjustment": rule.cost_adjustment,
                "adjustment_type": rule.adjustment_type.value,
                "priority": rule.priority,
                "description": f"Product-specific {rule.adjustment_type.value} adjustment (priority: {rule.priority})"
            })
    else:
        # Fall back to universal rules preview
        universal_rules = await crud.get_shipping_cost_rules_by_method(db, method_id)
        
        cost_breakdown.append({
            "quantity_range": "1",
            "cost": base_cost,
            "description": "Base cost (using universal rules)"
        })
        
        for rule in universal_rules:
            range_desc = f"{rule.min_quantity}+"
            if rule.max_quantity is not None:
                range_desc = f"{rule.min_quantity}-{rule.max_quantity}"
            
            # Calculate sample cost using universal calculation
            sample_cost_response = await calculate_shipping_cost(db, method_id, rule.min_quantity)
            
            cost_breakdown.append({
                "quantity_range": range_desc,
                "cost": sample_cost_response.final_cost,
                "adjustment": rule.cost_adjustment,
                "adjustment_type": rule.adjustment_type.value,
                "description": f"Universal {rule.adjustment_type.value} adjustment"
            })
    
    return schemas.ProductShippingCostPreviewResponse(
        product_id=product_id,
        shipping_method_id=method_id,
        base_cost=base_cost,
        delivery_days=method.delivery_days,
        cost_breakdown=cost_breakdown,
        has_product_rules=has_product_rules
    )


async def bulk_delete_product_shipping_rules(db: AsyncSession, product_id: int, shipping_method_id: Optional[int] = None):
    """Delete all shipping rules for a product"""
    
    # Validate product exists
    if not await validate_product_exists(product_id):
        raise HTTPException(status_code=404, detail="Product not found or not active")
    
    deleted_count = await crud.bulk_delete_product_shipping_rules(db, product_id, shipping_method_id)
    return {"deleted_count": deleted_count, "message": f"Deleted {deleted_count} shipping rules"}
