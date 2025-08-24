from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.core.database import get_db
from app.common.dependencies import require_admin, get_current_user
from app.users.models import User
from app.discounts import crud, service
from app.discounts.schemas import (
    DiscountRuleCreate, DiscountRuleUpdate, DiscountRuleResponse, DiscountRuleListResponse,
    ProductDiscountAssignmentCreate, ProductDiscountAssignmentUpdate, 
    ProductDiscountAssignmentResponse, ProductDiscountAssignmentListResponse,
    ProductDiscountAssignmentWithRule, BulkProductAssignmentCreate,
    DiscountCalculationRequest, DiscountCalculationResponse,
    ToggleStatusResponse
)

router = APIRouter()

# ============================================================================
# DISCOUNT RULES MANAGEMENT (Admin Only)
# ============================================================================

@router.post("/rules/", response_model=DiscountRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_discount_rule(
    rule_data: DiscountRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new discount rule (Admin only)"""
    try:
        # Set the created_by field to current admin user
        rule_data.created_by = current_user.id
        
        db_rule = await crud.create_discount_rule(db, rule_data)
        return DiscountRuleResponse.model_validate(db_rule)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating discount rule: {str(e)}")


@router.get("/rules/", response_model=DiscountRuleListResponse)
async def list_discount_rules(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """List all discount rules with pagination (Admin only)"""
    try:
        skip = (page - 1) * per_page
        rules, total = await crud.get_discount_rules(db, skip=skip, limit=per_page, is_active=is_active)
        
        return DiscountRuleListResponse(
            rules=[DiscountRuleResponse.model_validate(rule) for rule in rules],
            total=total,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving discount rules: {str(e)}")


@router.get("/rules/{rule_id}", response_model=DiscountRuleResponse)
async def get_discount_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Get specific discount rule by ID (Admin only)"""
    db_rule = await crud.get_discount_rule(db, rule_id)
    if not db_rule:
        raise HTTPException(status_code=404, detail="Discount rule not found")
    
    return DiscountRuleResponse.model_validate(db_rule)


@router.put("/rules/{rule_id}", response_model=DiscountRuleResponse)
async def update_discount_rule(
    rule_id: int,
    rule_update: DiscountRuleUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Update discount rule (Admin only)"""
    db_rule = await crud.update_discount_rule(db, rule_id, rule_update)
    if not db_rule:
        raise HTTPException(status_code=404, detail="Discount rule not found")
    
    return DiscountRuleResponse.model_validate(db_rule)


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_discount_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Delete discount rule and all its assignments (Admin only)"""
    success = await crud.delete_discount_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Discount rule not found")


@router.patch("/rules/{rule_id}/toggle", response_model=ToggleStatusResponse)
async def toggle_discount_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Toggle discount rule active status (Admin only)"""
    db_rule = await crud.toggle_discount_rule(db, rule_id)
    if not db_rule:
        raise HTTPException(status_code=404, detail="Discount rule not found")
    
    return ToggleStatusResponse(
        id=db_rule.id,
        is_active=db_rule.is_active,
        message=f"Discount rule {'activated' if db_rule.is_active else 'deactivated'}"
    )


# ============================================================================
# PRODUCT ASSIGNMENT MANAGEMENT (Admin Only)
# ============================================================================

@router.post("/assignments/", response_model=ProductDiscountAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_product_assignment(
    assignment_data: ProductDiscountAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Assign discount rule to product (Admin only)"""
    try:
        # Validate that the discount rule exists
        rule = await crud.get_discount_rule(db, assignment_data.discount_rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Discount rule not found")
        
        # Validate that the product exists (via HTTP call)
        product_exists = await service.validate_product_exists(assignment_data.product_id)
        if not product_exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if assignment already exists
        exists = await crud.check_assignment_exists(db, assignment_data.product_id, assignment_data.discount_rule_id)
        if exists:
            raise HTTPException(status_code=400, detail="Product is already assigned to this discount rule")
        
        # Set the assigned_by field
        assignment_data.assigned_by = current_user.id
        
        db_assignment = await crud.create_product_assignment(db, assignment_data)
        return ProductDiscountAssignmentResponse.model_validate(db_assignment)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating assignment: {str(e)}")


@router.post("/assignments/bulk", response_model=List[ProductDiscountAssignmentResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_assignments(
    bulk_data: BulkProductAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Assign discount rule to multiple products (Admin only)"""
    try:
        # Validate that the discount rule exists
        rule = await crud.get_discount_rule(db, bulk_data.discount_rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Discount rule not found")
        
        # Set the assigned_by field
        bulk_data.assigned_by = current_user.id
        
        assignments = await crud.bulk_create_assignments(
            db, bulk_data.product_ids, bulk_data.discount_rule_id, bulk_data.assigned_by
        )
        
        return [ProductDiscountAssignmentResponse.model_validate(assignment) for assignment in assignments]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bulk assignments: {str(e)}")


@router.get("/assignments/", response_model=ProductDiscountAssignmentListResponse)
async def list_product_assignments(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    discount_rule_id: Optional[int] = Query(None, description="Filter by discount rule ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """List product assignments with pagination and filters (Admin only)"""
    try:
        skip = (page - 1) * per_page
        assignments, total = await crud.get_product_assignments(
            db, skip=skip, limit=per_page, 
            product_id=product_id, discount_rule_id=discount_rule_id, is_active=is_active
        )
        
        # Get rule details for each assignment
        assignments_with_rules = []
        for assignment in assignments:
            rule = await crud.get_discount_rule(db, assignment.discount_rule_id)
            if rule:
                assignment_with_rule = ProductDiscountAssignmentWithRule(
                    **ProductDiscountAssignmentResponse.model_validate(assignment).dict(),
                    rule=DiscountRuleResponse.model_validate(rule)
                )
                assignments_with_rules.append(assignment_with_rule)
        
        return ProductDiscountAssignmentListResponse(
            assignments=assignments_with_rules,
            total=total,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving assignments: {str(e)}")


@router.get("/assignments/product/{product_id}", response_model=List[ProductDiscountAssignmentWithRule])
async def get_product_assignments(
    product_id: int,
    is_active: bool = Query(True, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Get all discount assignments for a specific product (Admin only)"""
    try:
        assignments, _ = await crud.get_product_assignments(db, product_id=product_id, is_active=is_active)
        
        assignments_with_rules = []
        for assignment in assignments:
            rule = await crud.get_discount_rule(db, assignment.discount_rule_id)
            if rule:
                assignment_with_rule = ProductDiscountAssignmentWithRule(
                    **ProductDiscountAssignmentResponse.model_validate(assignment).dict(),
                    rule=DiscountRuleResponse.model_validate(rule)
                )
                assignments_with_rules.append(assignment_with_rule)
        
        return assignments_with_rules
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving product assignments: {str(e)}")


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Remove product discount assignment (Admin only)"""
    success = await crud.delete_product_assignment(db, assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment not found")


@router.patch("/assignments/{assignment_id}/toggle", response_model=ToggleStatusResponse)
async def toggle_product_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Toggle product assignment active status (Admin only)"""
    db_assignment = await crud.toggle_product_assignment(db, assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return ToggleStatusResponse(
        id=db_assignment.id,
        is_active=db_assignment.is_active,
        message=f"Assignment {'activated' if db_assignment.is_active else 'deactivated'}"
    )


# ============================================================================
# DISCOUNT CALCULATION (Public/Internal API)
# ============================================================================

@router.post("/calculate", response_model=DiscountCalculationResponse)
async def calculate_discount(
    request: DiscountCalculationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Calculate discount for product and quantity (Internal API for checkout service)"""
    try:
        # Get product info to get unit price
        product_info = await service.get_product_info(request.product_id)
        if not product_info:
            raise HTTPException(status_code=404, detail="Product not found")
        
        unit_price = float(product_info.get("base_price", 0))
        
        discount_result = await service.calculate_product_discount(
            db, request.product_id, request.quantity, unit_price
        )
        
        return discount_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating discount: {str(e)}")


@router.get("/product/{product_id}/active", response_model=List[DiscountRuleResponse])
async def get_active_product_discounts(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all active discount rules for a product (Public API)"""
    try:
        discount_rules = await crud.get_product_discount_rules(db, product_id, is_active=True)
        return [DiscountRuleResponse.model_validate(rule) for rule in discount_rules]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving product discounts: {str(e)}")


@router.get("/product/{product_id}/summary")
async def get_product_discount_summary(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get discount summary for a product (Public API)"""
    try:
        summary = await service.get_product_discount_summary(db, product_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving discount summary: {str(e)}")


@router.post("/product/{product_id}/preview")
async def preview_discount_calculation(
    product_id: int,
    quantities: List[int],
    unit_price: float,
    db: AsyncSession = Depends(get_db)
):
    """Preview discount calculations for different quantities (Public API)"""
    try:
        preview = await service.preview_discount_calculation(db, product_id, quantities, unit_price)
        return preview
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating discount preview: {str(e)}")
