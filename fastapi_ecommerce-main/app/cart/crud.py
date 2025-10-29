from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.cart import models, schemas
from typing import Optional, List


async def add_cart_item(db: AsyncSession, item: models.CartItem):
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def get_cart_items_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.CartItem).where(models.CartItem.user_id == user_id))
    return result.scalars().all()


async def get_cart_items_by_guest(db: AsyncSession, guest_id: str):
    result = await db.execute(select(models.CartItem).where(models.CartItem.guest_id == guest_id))
    return result.scalars().all()


async def get_cart_item_by_id(db: AsyncSession, cart_item_id: int) -> Optional[models.CartItem]:
    result = await db.execute(select(models.CartItem).where(models.CartItem.id == cart_item_id))
    return result.scalar_one_or_none()


async def find_existing_cart_item(
    db: AsyncSession,
    user_id: Optional[int] = None,
    guest_id: Optional[str] = None,
    product_id: int = None,
    size: Optional[str] = None,
    customization_id: Optional[int] = None
) -> Optional[models.CartItem]:
    """
    Find existing cart item by unique attributes to prevent duplicates.

    A cart item is considered duplicate if it has same:
    - user_id (or guest_id)
    - product_id
    - size
    - customization_id
    """
    stmt = select(models.CartItem).where(models.CartItem.product_id == product_id)

    # Filter by user or guest
    if user_id is not None:
        stmt = stmt.where(models.CartItem.user_id == user_id)
    elif guest_id is not None:
        stmt = stmt.where(models.CartItem.guest_id == guest_id)
    else:
        return None

    # Filter by size (handle None properly)
    if size is not None:
        stmt = stmt.where(models.CartItem.size == size)
    else:
        stmt = stmt.where(models.CartItem.size.is_(None))

    # Filter by customization_id (handle None properly)
    if customization_id is not None:
        stmt = stmt.where(models.CartItem.customization_id == customization_id)
    else:
        stmt = stmt.where(models.CartItem.customization_id.is_(None))

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_cart_item_quantity(db: AsyncSession, cart_item_id: int, quantity: int) -> Optional[models.CartItem]:
    cart_item = await get_cart_item_by_id(db, cart_item_id)
    if cart_item:
        setattr(cart_item, 'quantity', quantity)
        await db.commit()
        await db.refresh(cart_item)
    return cart_item


async def remove_cart_item(db: AsyncSession, item_id: int):
    cart_item = await get_cart_item_by_id(db, item_id)
    if cart_item:
        await db.delete(cart_item)
        await db.commit()


async def delete_cart_items_bulk(
    db: AsyncSession,
    item_ids: List[int],
    user_id: Optional[int] = None,
    guest_id: Optional[str] = None
):
    stmt = select(models.CartItem).where(models.CartItem.id.in_(item_ids))

    if user_id is not None:
        stmt = stmt.where(models.CartItem.user_id == user_id)
    elif guest_id is not None:
        stmt = stmt.where(models.CartItem.guest_id == guest_id)

    result = await db.execute(stmt)
    items = result.scalars().all()

    for item in items:
        await db.delete(item)

    await db.commit()
    return len(items)


async def clear_cart(db: AsyncSession, user_id: Optional[int] = None, guest_id: Optional[str] = None) -> int:
    stmt = select(models.CartItem)

    if user_id is not None:
        stmt = stmt.where(models.CartItem.user_id == user_id)
    elif guest_id is not None:
        stmt = stmt.where(models.CartItem.guest_id == guest_id)
    else:
        return 0

    result = await db.execute(stmt)
    items = result.scalars().all()

    for item in items:
        await db.delete(item)

    await db.commit()
    return len(items)
