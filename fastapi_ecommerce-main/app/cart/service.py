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
    import time
    from datetime import datetime
    start_time = time.time()

    print(f"\n=== CART SERVICE: add_to_cart DEBUG ===")
    print(f"Timestamp: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
    print(f"Received item_data:")
    print(f"  - product_id: {item_data.product_id}")
    print(f"  - size: {item_data.size}")
    print(f"  - quantity: {item_data.quantity}")
    print(f"  - customization_id: {item_data.customization_id}")
    print(f"  - customized_images: {item_data.customized_images}")
    print(f"  - design_canvas_data: {item_data.design_canvas_data is not None}")
    if item_data.design_canvas_data:
        print(f"     objects count: {len(item_data.design_canvas_data.get('objects', []))}")
    print(f"  - design_svg_data: {item_data.design_svg_data is not None}")
    print(f"  - design_elements: {item_data.design_elements is not None}")

    # 🔍 CRITICAL: Check for existing cart item to prevent duplicates
    query_start = time.time()
    existing_item = await crud.find_existing_cart_item(
        db=db,
        user_id=user_id,
        guest_id=guest_id,
        product_id=item_data.product_id,
        size=item_data.size,
        customization_id=item_data.customization_id
    )
    query_time = (time.time() - query_start) * 1000
    print(f"  ⏱️  Query existing item: {query_time:.2f}ms")

    if existing_item:
        print(f"  ✅ FOUND EXISTING ITEM (id={existing_item.id})")
        print(f"     Current quantity: {existing_item.quantity}")
        print(f"     Adding quantity: {item_data.quantity}")

        # Update quantity instead of creating duplicate
        update_start = time.time()
        existing_item.quantity += item_data.quantity

        # Update design data if provided (user might have updated the design)
        if item_data.design_canvas_data is not None:
            existing_item.design_canvas_data = item_data.design_canvas_data
        if item_data.design_svg_data is not None:
            existing_item.design_svg_data = item_data.design_svg_data
        if item_data.design_elements is not None:
            existing_item.design_elements = item_data.design_elements
        if item_data.customized_images is not None:
            existing_item.customized_images = item_data.customized_images

        await db.commit()
        await db.refresh(existing_item)
        update_time = (time.time() - update_start) * 1000

        print(f"     New quantity: {existing_item.quantity}")
        print(f"  ⏱️  Update existing item: {update_time:.2f}ms")
        print(f"  ⏱️  Total time: {(time.time() - start_time) * 1000:.2f}ms")
        print(f"=== END CART SERVICE DEBUG ===\n")

        return existing_item

    print(f"  ℹ️  No existing item found, creating new cart item")

    # ✅ Fetch product details to ensure price is correct
    fetch_start = time.time()
    product_url = f"{BASE_URL}/products/{item_data.product_id}"
    product_data = await http_get(product_url)
    fetch_time = (time.time() - fetch_start) * 1000
    print(f"  ⏱️  Fetch product data: {fetch_time:.2f}ms")

    if not product_data:
        raise HTTPException(status_code=404, detail="Product not found")

    # ✅ Overwrite product name & price with trusted values
    item_data_dict = item_data.model_dump()
    item_data_dict["product_name"] = product_data["name"]
    item_data_dict["product_price"] = product_data["base_price"]  # Products have base_price, not price

    print(f"After model_dump, design_canvas_data in dict: {item_data_dict.get('design_canvas_data') is not None}")

    # ✅ Ensure image field always has a fallback value - get product/variation image
    if not item_data.customized_images:  # Only set fallback if no custom images
        fallback_image = None

        # Try to get variation image first if size/color specified
        if hasattr(item_data, 'size') and item_data.size and product_data.get('variations'):
            for variation in product_data.get('variations', []):
                variation_attrs = variation.get('attributes', {})
                if (variation_attrs.get('size') == item_data.size or
                    variation_attrs.get('Size') == item_data.size):
                    if variation.get('media') and len(variation['media']) > 0:
                        fallback_image = variation['media'][0].get('file_path')
                        break

        # Fallback to product default image
        if not fallback_image and product_data.get('media') and len(product_data['media']) > 0:
            fallback_image = product_data['media'][0].get('file_path')

        # Store as single image string (not array) for non-customized items
        if fallback_image:
            item_data_dict["customized_images"] = [fallback_image]

    insert_start = time.time()
    if user_id is not None:
        item = models.CartItem(**item_data_dict, user_id=user_id, guest_id=None)
    else:
        item = models.CartItem(**item_data_dict, user_id=None, guest_id=guest_id)

    print(f"Created CartItem model:")
    print(f"  - design_canvas_data: {item.design_canvas_data is not None}")
    print(f"  - design_svg_data: {item.design_svg_data is not None}")
    print(f"  - design_elements: {item.design_elements is not None}")

    result = await crud.add_cart_item(db, item)
    insert_time = (time.time() - insert_start) * 1000
    print(f"  ⏱️  Insert new item: {insert_time:.2f}ms")
    print(f"  ⏱️  Total time: {(time.time() - start_time) * 1000:.2f}ms")
    print(f"=== END CART SERVICE DEBUG ===\n")

    return result




async def list_cart(db: AsyncSession, user_id: Optional[int] = None, guest_id: Optional[str] = None):
    cart_items = []
    if user_id:
        cart_items = await crud.get_cart_items_by_user(db, user_id)
    elif guest_id:
        cart_items = await crud.get_cart_items_by_guest(db, guest_id)
    else:
        raise HTTPException(status_code=400, detail="User or Guest ID must be provided")

    # Enrich each cart item with the latest product price and image data
    enriched_items = []
    for item in cart_items:
        product_data = await http_get(f"{BASE_URL}/products/{item.product_id}")
        
        # Get product image - prioritize variation image if available
        product_image = None
        if product_data:
            # Try to get variation image first if size/color specified
            if hasattr(item, 'size') and item.size and product_data.get('variations'):
                for variation in product_data.get('variations', []):
                    # Match variation by attributes (size, color, etc.)
                    variation_attrs = variation.get('attributes', {})
                    if (variation_attrs.get('size') == item.size or 
                        variation_attrs.get('Size') == item.size):
                        if variation.get('media') and len(variation['media']) > 0:
                            product_image = variation['media'][0].get('file_path')
                            break
            
            # Fallback to product default image
            if not product_image and product_data.get('media') and len(product_data['media']) > 0:
                product_image = product_data['media'][0].get('file_path')
        
        enriched_items.append({
            'id': item.id,
            'user_id': item.user_id,
            'guest_id': item.guest_id,
            'product_id': item.product_id,
            'product_name': product_data.get('name', item.product_name) if product_data else item.product_name,
            'product_price': float(product_data.get('base_price', 0)) if product_data else 0,
            'quantity': item.quantity,
            'size': item.size,
            'color': getattr(item, 'color', None),
            'customization_id': getattr(item, 'customization_id', None),

            'customized_images': getattr(item, 'customized_images', None),

            # ✅ Include design data (snapshot from cart)
            'design_canvas_data': getattr(item, 'design_canvas_data', None),
            'design_svg_data': getattr(item, 'design_svg_data', None),
            'design_elements': getattr(item, 'design_elements', None),

            'image': product_image,  # Add image data
        })

    # 🔍 DEBUG: Log what we're returning
    print(f"\n=== CART SERVICE: list_cart RESPONSE DEBUG ===")
    print(f"Returning {len(enriched_items)} cart items for user_id={user_id}, guest_id={guest_id}")
    for idx, cart_item in enumerate(enriched_items):
        print(f"\nItem {idx}:")
        print(f"  - DB id: {cart_item.get('id')}")
        print(f"  - product_name: {cart_item.get('product_name')}")
        print(f"  - customization_id: {cart_item.get('customization_id')}")
        print(f"  - design_canvas_data: {cart_item.get('design_canvas_data') is not None}")
        if cart_item.get('design_canvas_data'):
            print(f"     objects count: {len(cart_item.get('design_canvas_data', {}).get('objects', []))}")
        print(f"  - design_svg_data: {cart_item.get('design_svg_data') is not None}")
        print(f"  - design_elements: {cart_item.get('design_elements') is not None}")
    print(f"=== END CART SERVICE list_cart DEBUG ===\n")

    return enriched_items



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
    Ensures product_price is correct and customization details are included
    """
    # Get enriched cart items (already includes product_price)
    cart_items = await list_cart(db, user_id, guest_id)

    enriched_items = []

    for item in cart_items:
        # item is already a dict from list_cart
        item_dict = item.copy()
        customization_id = item_dict.get("customization_id")

        if customization_id:
            customization_data = await _fetch_customization_details(customization_id)
            item_dict["customization_details"] = customization_data

        enriched_items.append(item_dict)

    return enriched_items
