from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.cart import schemas, service
from app.core.database import get_db
from app.common.dependencies import get_current_user_optional
from app.common.schemas import CurrentUser

router = APIRouter()


@router.post("/", response_model=schemas.CartItemResponse)
async def add_to_cart(
    item_data: schemas.CartItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    if not current_user and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")
    
    return await service.add_to_cart(db=db, item_data=item_data, user_id=current_user.id if current_user else None, guest_id=guest_id)


@router.get("/", response_model=List[schemas.CartItemResponse])
async def list_cart(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    if not current_user and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")

    return await service.list_cart(db=db, user_id=current_user.id if current_user else None, guest_id=guest_id)


@router.get("/with-customizations")
async def list_cart_with_customizations(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    """
    Get cart items with customization details (lazy loaded)
    This endpoint fetches customization details from the products service
    """
    if not current_user and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")

    return await service.list_cart_with_customizations(
        db=db, 
        user_id=current_user.id if current_user else None, 
        guest_id=guest_id
    )


@router.patch("/quantity", response_model=schemas.CartItemResponse)
async def update_cart_quantity(
    update_data: schemas.UpdateCartQuantity,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    if not current_user and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")

    return await service.update_cart_quantity(
        db=db,
        update_data=update_data,
        user_id=current_user.id if current_user else None,
        guest_id=guest_id
    )

@router.delete("/clear", status_code=status.HTTP_200_OK)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    user_id = current_user.id if current_user else None
    if not user_id and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")

    return await service.clear_cart(db=db, user_id=user_id, guest_id=guest_id)


@router.patch("/{cart_item_id}", response_model=schemas.CartItemResponse)
async def update_cart_item(
    cart_item_id: int,
    update_data: schemas.CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    if not current_user and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")

    return await service.update_cart_item(
        db=db,
        cart_item_id=cart_item_id,
        update_data=update_data,
        user_id=current_user.id if current_user else None,
        guest_id=guest_id
    )


@router.delete("/{item_id}")
async def delete_cart_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    if not current_user and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")

    return await service.delete_item(
        db=db,
        item_id=item_id,
        user_id=current_user.id if current_user else None,
        guest_id=guest_id
    )


@router.delete("/delete/bulk", status_code=status.HTTP_200_OK)
async def delete_multiple_cart_items(
    data: schemas.DeleteCartItemsRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user_optional),
    guest_id: Optional[str] = Header(None),
):
    user_id = current_user.id if current_user else None
    if not user_id and not guest_id:
        raise HTTPException(status_code=400, detail="Guest ID is required for unauthenticated access")

    return await service.delete_cart_items_bulk(
        db=db,
        item_ids=data.item_ids,
        user_id=user_id,
        guest_id=guest_id
    )



