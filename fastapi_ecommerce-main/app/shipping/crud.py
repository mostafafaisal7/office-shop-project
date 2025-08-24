from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_
from . import models, schemas
from typing import Optional, List

async def create_shipping_address(db: AsyncSession, data: schemas.ShippingAddressCreate):
    address = models.ShippingAddress(**data.model_dump())
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address

async def get_shipping_address_by_id(db: AsyncSession, address_id: str):
    result = await db.execute(select(models.ShippingAddress).where(models.ShippingAddress.id == address_id))
    return result.scalar_one_or_none()

async def get_shipping_addresses_by_user_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.ShippingAddress).where(models.ShippingAddress.user_id == user_id))
    return result.scalars().all()

async def get_shipping_addresses_by_guest_id(db: AsyncSession, guest_id: str):
    result = await db.execute(select(models.ShippingAddress).where(models.ShippingAddress.guest_id == guest_id))
    return result.scalars().all()

async def get_all_shipping_addresses(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.ShippingAddress).offset(skip).limit(limit))
    return result.scalars().all()

async def get_shipping_methods(db: AsyncSession):
    result = await db.execute(select(models.ShippingMethod))
    return result.scalars().all()

async def get_shipping_method_by_id(db: AsyncSession, method_id: int):
    result = await db.execute(select(models.ShippingMethod).where(models.ShippingMethod.id == method_id))
    return result.scalar_one_or_none()

async def get_shipping_method_with_rules(db: AsyncSession, method_id: int):
    result = await db.execute(
        select(models.ShippingMethod)
        .options(selectinload(models.ShippingMethod.cost_rules))
        .where(models.ShippingMethod.id == method_id)
    )
    return result.scalar_one_or_none()

async def create_shipping_method(db: AsyncSession, data: schemas.ShippingMethodCreate):
    shipping_method = models.ShippingMethod(**data.model_dump())
    db.add(shipping_method)
    await db.commit()
    await db.refresh(shipping_method)
    return shipping_method

async def update_shipping_address(db: AsyncSession, address_id: str, data: schemas.ShippingAddressUpdate):
    result = await db.execute(select(models.ShippingAddress).where(models.ShippingAddress.id == address_id))
    address = result.scalar_one_or_none()
    if not address:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)
    
    await db.commit()
    await db.refresh(address)
    return address

async def delete_shipping_address(db: AsyncSession, address_id: str):
    result = await db.execute(select(models.ShippingAddress).where(models.ShippingAddress.id == address_id))
    address = result.scalar_one_or_none()
    if not address:
        return None
    
    await db.delete(address)
    await db.commit()
    return address

async def update_shipping_method(db: AsyncSession, method_id: int, data: schemas.ShippingMethodUpdate):
    result = await db.execute(select(models.ShippingMethod).where(models.ShippingMethod.id == method_id))
    method = result.scalar_one_or_none()
    if not method:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(method, field, value)
    
    await db.commit()
    await db.refresh(method)
    return method

async def delete_shipping_method(db: AsyncSession, method_id: int):
    result = await db.execute(select(models.ShippingMethod).where(models.ShippingMethod.id == method_id))
    method = result.scalar_one_or_none()
    if not method:
        return None
    
    await db.delete(method)
    await db.commit()
    return method


# Shipping Cost Rule CRUD Operations
async def create_shipping_cost_rule(db: AsyncSession, data: schemas.ShippingCostRuleCreate):
    cost_rule = models.ShippingCostRule(**data.model_dump())
    db.add(cost_rule)
    await db.commit()
    await db.refresh(cost_rule)
    return cost_rule


async def get_shipping_cost_rules_by_method(db: AsyncSession, method_id: int):
    result = await db.execute(
        select(models.ShippingCostRule)
        .where(models.ShippingCostRule.shipping_method_id == method_id)
        .where(models.ShippingCostRule.is_active == True)
        .order_by(models.ShippingCostRule.min_quantity)
    )
    return result.scalars().all()


async def get_shipping_cost_rule_by_id(db: AsyncSession, rule_id: int):
    result = await db.execute(select(models.ShippingCostRule).where(models.ShippingCostRule.id == rule_id))
    return result.scalar_one_or_none()


async def update_shipping_cost_rule(db: AsyncSession, rule_id: int, data: schemas.ShippingCostRuleUpdate):
    result = await db.execute(select(models.ShippingCostRule).where(models.ShippingCostRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    await db.commit()
    await db.refresh(rule)
    return rule


async def delete_shipping_cost_rule(db: AsyncSession, rule_id: int):
    result = await db.execute(select(models.ShippingCostRule).where(models.ShippingCostRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        return None
    
    await db.delete(rule)
    await db.commit()
    return rule


async def get_applicable_cost_rules(db: AsyncSession, method_id: int, quantity: int):
    """Get cost rules that apply to the given quantity"""
    result = await db.execute(
        select(models.ShippingCostRule)
        .where(models.ShippingCostRule.shipping_method_id == method_id)
        .where(models.ShippingCostRule.is_active == True)
        .where(models.ShippingCostRule.min_quantity <= quantity)
        .where(
            (models.ShippingCostRule.max_quantity.is_(None)) |
            (models.ShippingCostRule.max_quantity >= quantity)
        )
        .order_by(models.ShippingCostRule.min_quantity.desc())
    )
    return result.scalars().all()


# Product Shipping Rule CRUD Operations
async def create_product_shipping_rule(db: AsyncSession, data: schemas.ProductShippingRuleCreate):
    """Create a product-specific shipping rule"""
    product_rule = models.ProductShippingRule(**data.model_dump())
    db.add(product_rule)
    await db.commit()
    await db.refresh(product_rule)
    return product_rule


async def get_product_shipping_rules(db: AsyncSession, product_id: int, shipping_method_id: Optional[int] = None):
    """Get all shipping rules for a specific product"""
    query = select(models.ProductShippingRule).where(
        models.ProductShippingRule.product_id == product_id,
        models.ProductShippingRule.is_active == True
    )
    
    if shipping_method_id:
        query = query.where(models.ProductShippingRule.shipping_method_id == shipping_method_id)
    
    query = query.order_by(models.ProductShippingRule.priority.desc(), models.ProductShippingRule.min_quantity)
    
    result = await db.execute(query)
    return result.scalars().all()


async def get_product_shipping_rule_by_id(db: AsyncSession, rule_id: int):
    """Get a specific product shipping rule by ID"""
    result = await db.execute(select(models.ProductShippingRule).where(models.ProductShippingRule.id == rule_id))
    return result.scalar_one_or_none()


async def update_product_shipping_rule(db: AsyncSession, rule_id: int, data: schemas.ProductShippingRuleUpdate):
    """Update a product shipping rule"""
    result = await db.execute(select(models.ProductShippingRule).where(models.ProductShippingRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    await db.commit()
    await db.refresh(rule)
    return rule


async def delete_product_shipping_rule(db: AsyncSession, rule_id: int):
    """Delete a product shipping rule"""
    result = await db.execute(select(models.ProductShippingRule).where(models.ProductShippingRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        return None
    
    await db.delete(rule)
    await db.commit()
    return rule


async def get_applicable_product_shipping_rules(db: AsyncSession, product_id: int, method_id: int, quantity: int):
    """Get product-specific shipping rules that apply to the given product and quantity"""
    result = await db.execute(
        select(models.ProductShippingRule)
        .where(models.ProductShippingRule.product_id == product_id)
        .where(models.ProductShippingRule.shipping_method_id == method_id)
        .where(models.ProductShippingRule.is_active == True)
        .where(models.ProductShippingRule.min_quantity <= quantity)
        .where(
            (models.ProductShippingRule.max_quantity.is_(None)) |
            (models.ProductShippingRule.max_quantity >= quantity)
        )
        .order_by(models.ProductShippingRule.priority.desc(), models.ProductShippingRule.min_quantity.desc())
    )
    return result.scalars().all()


async def get_products_with_shipping_rules(db: AsyncSession, shipping_method_id: int):
    """Get all product IDs that have custom shipping rules for a specific method"""
    result = await db.execute(
        select(models.ProductShippingRule.product_id)
        .where(models.ProductShippingRule.shipping_method_id == shipping_method_id)
        .where(models.ProductShippingRule.is_active == True)
        .distinct()
    )
    return [row[0] for row in result.fetchall()]


async def bulk_delete_product_shipping_rules(db: AsyncSession, product_id: int, shipping_method_id: Optional[int] = None):
    """Delete all shipping rules for a product, optionally filtered by shipping method"""
    query = select(models.ProductShippingRule).where(models.ProductShippingRule.product_id == product_id)
    
    if shipping_method_id:
        query = query.where(models.ProductShippingRule.shipping_method_id == shipping_method_id)
    
    result = await db.execute(query)
    rules = result.scalars().all()
    
    for rule in rules:
        await db.delete(rule)
    
    await db.commit()
    return len(rules)
