from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.discounts.models import QuantityDiscountRule, ProductDiscountAssignment
from app.discounts.schemas import (
    DiscountRuleCreate, DiscountRuleUpdate,
    ProductDiscountAssignmentCreate, ProductDiscountAssignmentUpdate
)


# Discount Rule CRUD
async def create_discount_rule(db: AsyncSession, rule_data: DiscountRuleCreate) -> QuantityDiscountRule:
    """Create a new discount rule"""
    db_rule = QuantityDiscountRule(**rule_data.dict())
    db.add(db_rule)
    await db.commit()
    await db.refresh(db_rule)
    return db_rule


async def get_discount_rule(db: AsyncSession, rule_id: int) -> Optional[QuantityDiscountRule]:
    """Get discount rule by ID"""
    result = await db.execute(select(QuantityDiscountRule).where(QuantityDiscountRule.id == rule_id))
    return result.scalar_one_or_none()


async def get_discount_rules(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    is_active: Optional[bool] = None
) -> tuple[List[QuantityDiscountRule], int]:
    """Get discount rules with pagination"""
    query = select(QuantityDiscountRule)
    
    if is_active is not None:
        query = query.where(QuantityDiscountRule.is_active == is_active)
    
    # Get total count
    count_query = select(func.count(QuantityDiscountRule.id))
    if is_active is not None:
        count_query = count_query.where(QuantityDiscountRule.is_active == is_active)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get paginated results
    query = query.order_by(desc(QuantityDiscountRule.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    rules = result.scalars().all()
    
    return list(rules), total


async def update_discount_rule(
    db: AsyncSession, 
    rule_id: int, 
    rule_update: DiscountRuleUpdate
) -> Optional[QuantityDiscountRule]:
    """Update discount rule"""
    result = await db.execute(select(QuantityDiscountRule).where(QuantityDiscountRule.id == rule_id))
    db_rule = result.scalar_one_or_none()
    
    if not db_rule:
        return None
    
    update_data = rule_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)
    
    await db.commit()
    await db.refresh(db_rule)
    return db_rule


async def delete_discount_rule(db: AsyncSession, rule_id: int) -> bool:
    """Delete discount rule and all its assignments"""
    # First delete all assignments
    await db.execute(
        select(ProductDiscountAssignment).where(ProductDiscountAssignment.discount_rule_id == rule_id)
    )
    assignments_result = await db.execute(
        select(ProductDiscountAssignment).where(ProductDiscountAssignment.discount_rule_id == rule_id)
    )
    assignments = assignments_result.scalars().all()
    
    for assignment in assignments:
        await db.delete(assignment)
    
    # Then delete the rule
    result = await db.execute(select(QuantityDiscountRule).where(QuantityDiscountRule.id == rule_id))
    db_rule = result.scalar_one_or_none()
    
    if not db_rule:
        return False
    
    await db.delete(db_rule)
    await db.commit()
    return True


async def toggle_discount_rule(db: AsyncSession, rule_id: int) -> Optional[QuantityDiscountRule]:
    """Toggle discount rule active status"""
    result = await db.execute(select(QuantityDiscountRule).where(QuantityDiscountRule.id == rule_id))
    db_rule = result.scalar_one_or_none()
    
    if not db_rule:
        return None
    
    current_status = db_rule.is_active
    db_rule.is_active = not current_status
    await db.commit()
    await db.refresh(db_rule)
    return db_rule


# Product Assignment CRUD
async def create_product_assignment(
    db: AsyncSession, 
    assignment_data: ProductDiscountAssignmentCreate
) -> ProductDiscountAssignment:
    """Create product discount assignment"""
    db_assignment = ProductDiscountAssignment(**assignment_data.dict())
    db.add(db_assignment)
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment


async def get_product_assignment(db: AsyncSession, assignment_id: int) -> Optional[ProductDiscountAssignment]:
    """Get product assignment by ID"""
    result = await db.execute(
        select(ProductDiscountAssignment).where(ProductDiscountAssignment.id == assignment_id)
    )
    return result.scalar_one_or_none()


async def get_product_assignments(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = None,
    discount_rule_id: Optional[int] = None,
    is_active: Optional[bool] = None
) -> tuple[List[ProductDiscountAssignment], int]:
    """Get product assignments with pagination and filters"""
    query = select(ProductDiscountAssignment)
    
    conditions = []
    if product_id is not None:
        conditions.append(ProductDiscountAssignment.product_id == product_id)
    if discount_rule_id is not None:
        conditions.append(ProductDiscountAssignment.discount_rule_id == discount_rule_id)
    if is_active is not None:
        conditions.append(ProductDiscountAssignment.is_active == is_active)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Get total count
    count_query = select(func.count(ProductDiscountAssignment.id))
    if conditions:
        count_query = count_query.where(and_(*conditions))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get paginated results
    query = query.order_by(desc(ProductDiscountAssignment.assigned_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    assignments = result.scalars().all()
    
    return list(assignments), total


async def get_product_discount_rules(
    db: AsyncSession, 
    product_id: int,
    is_active: bool = True
) -> List[QuantityDiscountRule]:
    """Get all active discount rules for a specific product"""
    query = select(QuantityDiscountRule).join(
        ProductDiscountAssignment,
        QuantityDiscountRule.id == ProductDiscountAssignment.discount_rule_id
    ).where(
        and_(
            ProductDiscountAssignment.product_id == product_id,
            ProductDiscountAssignment.is_active == is_active,
            QuantityDiscountRule.is_active == is_active
        )
    ).order_by(QuantityDiscountRule.min_quantity)
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_product_assignment(
    db: AsyncSession,
    assignment_id: int,
    assignment_update: ProductDiscountAssignmentUpdate
) -> Optional[ProductDiscountAssignment]:
    """Update product assignment"""
    result = await db.execute(
        select(ProductDiscountAssignment).where(ProductDiscountAssignment.id == assignment_id)
    )
    db_assignment = result.scalar_one_or_none()
    
    if not db_assignment:
        return None
    
    update_data = assignment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assignment, field, value)
    
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment


async def delete_product_assignment(db: AsyncSession, assignment_id: int) -> bool:
    """Delete product assignment"""
    result = await db.execute(
        select(ProductDiscountAssignment).where(ProductDiscountAssignment.id == assignment_id)
    )
    db_assignment = result.scalar_one_or_none()
    
    if not db_assignment:
        return False
    
    await db.delete(db_assignment)
    await db.commit()
    return True


async def toggle_product_assignment(db: AsyncSession, assignment_id: int) -> Optional[ProductDiscountAssignment]:
    """Toggle product assignment active status"""
    result = await db.execute(
        select(ProductDiscountAssignment).where(ProductDiscountAssignment.id == assignment_id)
    )
    db_assignment = result.scalar_one_or_none()
    
    if not db_assignment:
        return None
    
    current_status = db_assignment.is_active
    db_assignment.is_active = not current_status
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment


async def check_assignment_exists(
    db: AsyncSession, 
    product_id: int, 
    discount_rule_id: int
) -> bool:
    """Check if assignment already exists"""
    result = await db.execute(
        select(ProductDiscountAssignment).where(
            and_(
                ProductDiscountAssignment.product_id == product_id,
                ProductDiscountAssignment.discount_rule_id == discount_rule_id
            )
        )
    )
    return result.scalar_one_or_none() is not None


async def bulk_create_assignments(
    db: AsyncSession,
    product_ids: List[int],
    discount_rule_id: int,
    assigned_by: int
) -> List[ProductDiscountAssignment]:
    """Create multiple product assignments at once"""
    assignments = []
    
    for product_id in product_ids:
        # Check if assignment already exists
        exists = await check_assignment_exists(db, product_id, discount_rule_id)
        if not exists:
            assignment_data = ProductDiscountAssignmentCreate(
                product_id=product_id,
                discount_rule_id=discount_rule_id,
                assigned_by=assigned_by
            )
            db_assignment = ProductDiscountAssignment(**assignment_data.dict())
            db.add(db_assignment)
            assignments.append(db_assignment)
    
    if assignments:
        await db.commit()
        for assignment in assignments:
            await db.refresh(assignment)
    
    return assignments
