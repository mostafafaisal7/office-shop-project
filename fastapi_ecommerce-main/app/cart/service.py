from sqlalchemy.ext.asyncio import AsyncSession
from app.cart import schemas, models, crud
from fastapi import HTTPException
from typing import Optional, List, Dict, Any
from app.common.http import http_get
from app.core.config import BASE_URL
import logging

logger = logging.getLogger(__name__)


async def add_to_cart(
    db: AsyncSession, item_data: schemas.CartItemCreate, user_id: Optional[int] = None, guest_id: Optional[str] = None
):
    # For authenticated users, only set user_id and leave guest_id as None
    # For guest users, only set guest_id and leave user_id as None
    if user_id is not None:
        item = models.CartItem(**item_data.model_dump(), user_id=user_id, guest_id=None)
    else:
        item = models.CartItem(**item_data.model_dump(), user_id=None, guest_id=guest_id)
    return await crud.add_cart_item(db, item)


async def list_cart(
    db: AsyncSession, user_id: Optional[int] = None, guest_id: Optional[str] = None
):
    if user_id:
        return await crud.get_cart_items_by_user(db, user_id)
    elif guest_id:
        return await crud.get_cart_items_by_guest(db, guest_id)
    else:
        raise HTTPException(status_code=400, detail="User or Guest ID must be provided")


async def update_cart_quantity(
    db: AsyncSession, update_data: schemas.UpdateCartQuantity, user_id: Optional[int] = None, guest_id: Optional[str] = None
):
    cart_item = await crud.get_cart_item_by_id(db, update_data.cart_item_id)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Ensure ownership
    if user_id is not None:
        if getattr(cart_item, 'user_id') != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to update this cart item")
    elif guest_id is not None:
        if getattr(cart_item, 'guest_id') != guest_id:
            raise HTTPException(status_code=403, detail="Unauthorized to update this cart item")

    return await crud.update_cart_item_quantity(db, update_data.cart_item_id, update_data.quantity)


async def update_cart_item(
    db: AsyncSession, cart_item_id: int, update_data: schemas.CartItemUpdate, 
    user_id: Optional[int] = None, guest_id: Optional[str] = None
):
    cart_item = await crud.get_cart_item_by_id(db, cart_item_id)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Ensure ownership
    if user_id is not None:
        if getattr(cart_item, 'user_id') != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to update this cart item")
    elif guest_id is not None:
        if getattr(cart_item, 'guest_id') != guest_id:
            raise HTTPException(status_code=403, detail="Unauthorized to update this cart item")

    # Update fields if provided
    if update_data.quantity is not None:
        setattr(cart_item, 'quantity', update_data.quantity)
    if update_data.size is not None:
        setattr(cart_item, 'size', update_data.size)
    if update_data.customization_id is not None:
        setattr(cart_item, 'customization_id', update_data.customization_id)

    await db.commit()
    await db.refresh(cart_item)
    return cart_item


async def delete_item(
    db: AsyncSession, item_id: int, user_id: Optional[int] = None, guest_id: Optional[str] = None
):
    cart_item = await crud.get_cart_item_by_id(db, item_id)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Ensure ownership
    if user_id is not None:
        if getattr(cart_item, 'user_id') != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this cart item")
    elif guest_id is not None:
        if getattr(cart_item, 'guest_id') != guest_id:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this cart item")

    await crud.remove_cart_item(db, item_id)
    return {"detail": "Cart item deleted"}


async def delete_cart_items_bulk(
    db: AsyncSession, item_ids: list[int], user_id: Optional[int] = None, guest_id: Optional[str] = None
):
    if user_id is None and guest_id is None:
        raise HTTPException(status_code=400, detail="User ID or Guest ID required")
    
    deleted = await crud.delete_cart_items_bulk(db, item_ids, user_id=user_id, guest_id=guest_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="No cart items deleted")
    return {"deleted": deleted}


async def clear_cart(db: AsyncSession, user_id: Optional[int] = None, guest_id: Optional[str] = None):
    if user_id is None and guest_id is None:
        raise HTTPException(status_code=400, detail="User ID or Guest ID required")

    deleted = await crud.clear_cart(db, user_id=user_id, guest_id=guest_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="No cart items to delete")

    return {"deleted": deleted}


async def _fetch_customization_details(customization_id: int) -> Optional[Dict[str, Any]]:
    """
    Fetch customization details from products service
    Returns None if fetch fails to ensure cart functionality isn't broken
    """
    try:
        customization_url = f"{BASE_URL}/products/options/{customization_id}"
        logger.info(f"Fetching customization details from: {customization_url}")
        customization_data = await http_get(customization_url)
        logger.info(f"Received customization data: {customization_data}")
        return customization_data
    except Exception as e:
        logger.error(f"Failed to fetch customization details for ID {customization_id}: {str(e)}")
        return None


async def list_cart_with_customizations(
    db: AsyncSession, user_id: Optional[int] = None, guest_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get cart items with customization details (lazy loaded)
    This function fetches customization details via HTTP calls to products service
    """
    # Get basic cart items first
    cart_items = await list_cart(db, user_id, guest_id)
    
    # Convert SQLAlchemy objects to dictionaries and enrich with customization details
    enriched_items = []
    for item in cart_items:
        # Convert SQLAlchemy object to dict
        item_dict = {
            'id': item.id,
            'user_id': item.user_id,
            'guest_id': item.guest_id,
            'product_id': item.product_id,
            'product_name': item.product_name,
            'product_price': item.product_price,
            'quantity': item.quantity,
            'size': item.size,
            'color': getattr(item, 'color', None),  # Handle if color field exists
            'customization_id': getattr(item, 'customization_id', None),
            'customization_details': None
        }
        
        # Fetch customization details if customization_id exists
        customization_id_value = getattr(item, 'customization_id', None)
        if customization_id_value:
            customization_data = await _fetch_customization_details(customization_id_value)
            if customization_data:
                item_dict['customization_details'] = customization_data
        
        enriched_items.append(item_dict)
    
    return enriched_items
