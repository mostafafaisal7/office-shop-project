from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.shipping import service, schemas
from typing import List, Optional
from app.common.dependencies import get_current_user

router = APIRouter()

# Shipping Address Routes
@router.post("/addresses", response_model=schemas.ShippingAddressOut)
async def create_shipping_address(data: schemas.ShippingAddressCreate, db: AsyncSession = Depends(get_db)):
    return await service.save_shipping_address(db, data)

@router.get("/addresses/{address_id}", response_model=schemas.ShippingAddressOut)
async def get_shipping_address(address_id: str, db: AsyncSession = Depends(get_db)):
    address = await service.get_shipping_address(db, address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Shipping address not found")
    return address

@router.get("/addresses/user/{user_id}", response_model=List[schemas.ShippingAddressOut], dependencies=[Depends(get_current_user)])
async def get_user_shipping_addresses(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get all shipping addresses for a specific user"""
    return await service.get_user_shipping_addresses(db, user_id)

@router.get("/addresses", response_model=List[schemas.ShippingAddressOut])
async def get_shipping_addresses(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    guest_id: Optional[str] = Query(None, description="Filter by guest ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    if user_id:
        return await service.get_user_shipping_addresses(db, user_id)
    elif guest_id:
        return await service.get_guest_shipping_addresses(db, guest_id)
    else:
        return await service.list_all_shipping_addresses(db, skip, limit)

# Shipping Method Routes
@router.get("/methods", response_model=List[schemas.ShippingMethodOut])
async def get_shipping_methods(db: AsyncSession = Depends(get_db)):
    return await service.list_shipping_methods(db)

@router.get("/methods/{method_id}", response_model=schemas.ShippingMethodOut)
async def get_shipping_method(method_id: int, db: AsyncSession = Depends(get_db)):
    method = await service.get_shipping_method(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    return method

@router.post("/methods", response_model=schemas.ShippingMethodOut)
async def create_shipping_method(data: schemas.ShippingMethodCreate, db: AsyncSession = Depends(get_db)):
    return await service.add_shipping_method(db, data)

# Update and Delete Routes for Shipping Addresses
@router.put("/addresses/{address_id}", response_model=schemas.ShippingAddressOut)
async def update_shipping_address(
    address_id: str, 
    data: schemas.ShippingAddressUpdate, 
    db: AsyncSession = Depends(get_db)
):
    updated_address = await service.update_shipping_address(db, address_id, data)
    if not updated_address:
        raise HTTPException(status_code=404, detail="Shipping address not found")
    return updated_address

@router.delete("/addresses/{address_id}")
async def delete_shipping_address(address_id: str, db: AsyncSession = Depends(get_db)):
    deleted_address = await service.delete_shipping_address(db, address_id)
    if not deleted_address:
        raise HTTPException(status_code=404, detail="Shipping address not found")
    return {"message": "Shipping address deleted successfully"}

# Update and Delete Routes for Shipping Methods
@router.put("/methods/{method_id}", response_model=schemas.ShippingMethodOut)
async def update_shipping_method(
    method_id: int, 
    data: schemas.ShippingMethodUpdate, 
    db: AsyncSession = Depends(get_db)
):
    updated_method = await service.update_shipping_method(db, method_id, data)
    if not updated_method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    return updated_method

@router.delete("/methods/{method_id}")
async def delete_shipping_method(method_id: int, db: AsyncSession = Depends(get_db)):
    deleted_method = await service.delete_shipping_method(db, method_id)
    if not deleted_method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    return {"message": "Shipping method deleted successfully"}


# Shipping Cost Rule Routes
@router.post("/methods/{method_id}/cost-rules", response_model=schemas.ShippingCostRuleOut)
async def create_shipping_cost_rule(
    method_id: int,
    data: schemas.ShippingCostRuleCreate,
    db: AsyncSession = Depends(get_db)
):
    # Override the method_id from URL
    data.shipping_method_id = method_id
    return await service.create_shipping_cost_rule(db, data)


@router.get("/methods/{method_id}/cost-rules", response_model=List[schemas.ShippingCostRuleOut])
async def get_shipping_cost_rules(method_id: int, db: AsyncSession = Depends(get_db)):
    return await service.get_shipping_cost_rules_by_method(db, method_id)


@router.get("/methods/{method_id}/with-rules", response_model=schemas.ShippingMethodWithRulesOut)
async def get_shipping_method_with_rules(method_id: int, db: AsyncSession = Depends(get_db)):
    method = await service.get_shipping_method_with_rules(db, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    return method


@router.put("/cost-rules/{rule_id}", response_model=schemas.ShippingCostRuleOut)
async def update_shipping_cost_rule(
    rule_id: int,
    data: schemas.ShippingCostRuleUpdate,
    db: AsyncSession = Depends(get_db)
):
    updated_rule = await service.update_shipping_cost_rule(db, rule_id, data)
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Shipping cost rule not found")
    return updated_rule


@router.delete("/cost-rules/{rule_id}")
async def delete_shipping_cost_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    deleted_rule = await service.delete_shipping_cost_rule(db, rule_id)
    if not deleted_rule:
        raise HTTPException(status_code=404, detail="Shipping cost rule not found")
    return {"message": "Shipping cost rule deleted successfully"}


# Cost Calculation Routes
@router.post("/calculate-cost", response_model=schemas.ShippingCostCalculationResponse)
async def calculate_shipping_cost(
    data: schemas.ShippingCostCalculationRequest,
    db: AsyncSession = Depends(get_db)
):
    return await service.calculate_shipping_cost(db, data.shipping_method_id, data.total_quantity)


@router.get("/methods/{method_id}/cost-preview", response_model=schemas.ShippingCostPreviewResponse)
async def get_shipping_cost_preview(method_id: int, db: AsyncSession = Depends(get_db)):
    return await service.get_shipping_cost_preview(db, method_id)


# Product Shipping Rule Routes
@router.post("/products/{product_id}/rules", response_model=schemas.ProductShippingRuleOut)
async def create_product_shipping_rule(
    product_id: int,
    data: schemas.ProductShippingRuleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a product-specific shipping rule"""
    # Override the product_id from URL
    data.product_id = product_id
    return await service.create_product_shipping_rule(db, data)


@router.get("/products/{product_id}/rules", response_model=List[schemas.ProductShippingRuleOut])
async def get_product_shipping_rules(
    product_id: int,
    shipping_method_id: Optional[int] = Query(None, description="Filter by shipping method"),
    db: AsyncSession = Depends(get_db)
):
    """Get all shipping rules for a specific product"""
    return await service.get_product_shipping_rules(db, product_id, shipping_method_id)


@router.get("/products/rules/{rule_id}", response_model=schemas.ProductShippingRuleOut)
async def get_product_shipping_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific product shipping rule by ID"""
    rule = await service.get_product_shipping_rule(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Product shipping rule not found")
    return rule


@router.put("/products/rules/{rule_id}", response_model=schemas.ProductShippingRuleOut)
async def update_product_shipping_rule(
    rule_id: int,
    data: schemas.ProductShippingRuleUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a product shipping rule"""
    updated_rule = await service.update_product_shipping_rule(db, rule_id, data)
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Product shipping rule not found")
    return updated_rule


@router.delete("/products/rules/{rule_id}")
async def delete_product_shipping_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a product shipping rule"""
    deleted_rule = await service.delete_product_shipping_rule(db, rule_id)
    if not deleted_rule:
        raise HTTPException(status_code=404, detail="Product shipping rule not found")
    return {"message": "Product shipping rule deleted successfully"}


@router.delete("/products/{product_id}/rules")
async def bulk_delete_product_shipping_rules(
    product_id: int,
    shipping_method_id: Optional[int] = Query(None, description="Filter by shipping method"),
    db: AsyncSession = Depends(get_db)
):
    """Delete all shipping rules for a product"""
    result = await service.bulk_delete_product_shipping_rules(db, product_id, shipping_method_id)
    return result


# Product-wise Cost Calculation Routes
@router.post("/calculate-product-cost", response_model=schemas.ProductShippingCalculationResponse)
async def calculate_product_shipping_cost(
    data: schemas.ProductShippingCalculationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Calculate shipping cost for multiple products with product-specific rules"""
    return await service.calculate_product_shipping_cost(db, data)


@router.get("/products/{product_id}/cost-preview", response_model=schemas.ProductShippingCostPreviewResponse)
async def get_product_shipping_cost_preview(
    product_id: int,
    method_id: int = Query(..., description="Shipping method ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get cost preview for a specific product with different quantity ranges"""
    return await service.get_product_shipping_cost_preview(db, product_id, method_id)
