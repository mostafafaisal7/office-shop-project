# app/orders/crud.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.orders import models, schemas
from app.common.enums import OrderStatus
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple

async def get_all_orders(db: AsyncSession) -> List[models.Order]:
    result = await db.execute(
        select(models.Order)
        .options(selectinload(models.Order.items))
        .order_by(models.Order.created_at.desc())
    )
    return list(result.scalars().all())


async def create_order(db: AsyncSession, order_data: schemas.OrderCreate) -> models.Order:
    # ✅ FIX: Fetch and save complete design data from customization_options
    # This prevents future orders from having the same data corruption issue

    from app.products import models as product_models

    # Process each item and fetch complete design data if customization exists
    order_items = []
    for item in order_data.items:
        # Start with the data from frontend
        design_svg_data = item.design_svg_data
        design_canvas_data = item.design_canvas_data
        design_elements = item.design_elements

        # ✅ If item has customization_option_id, fetch complete design data
        if item.customization_option_id:
            print(f"\n{'='*60}")
            print(f"ORDER CREATION: Fetching design data for customization_option_id: {item.customization_option_id}")
            print(f"{'='*60}")

            try:
                # Fetch the customization option
                result = await db.execute(
                    select(product_models.CustomizationOption)
                    .where(product_models.CustomizationOption.id == item.customization_option_id)
                )
                customization_option = result.scalar_one_or_none()

                if customization_option:
                    print(f"✅ Found customization_option:")
                    print(f"   ID: {customization_option.id}")
                    print(f"   design_area: {customization_option.design_area}")
                    print(f"   client_reference_id: {customization_option.client_reference_id}")

                    # ✅ CRITICAL: Fetch ALL design areas with same client_reference_id
                    # This ensures we get front, back, left, right designs - all areas
                    if customization_option.client_reference_id:
                        result = await db.execute(
                            select(product_models.CustomizationOption)
                            .where(product_models.CustomizationOption.client_reference_id == customization_option.client_reference_id)
                        )
                        all_design_areas = result.scalars().all()

                        print(f"✅ Found {len(all_design_areas)} design areas for this product:")

                        # Combine objects from ALL design areas
                        combined_objects = []
                        for area_option in all_design_areas:
                            area_objects = area_option.canvas_data.get('objects', []) if area_option.canvas_data else []
                            print(f"   - {area_option.design_area}: {len(area_objects)} objects")
                            combined_objects.extend(area_objects)

                        print(f"✅ Total objects combined: {len(combined_objects)}")

                        # ✅ Save complete snapshot to order_item
                        if combined_objects:
                            design_elements = combined_objects
                            design_canvas_data = {
                                'version': '5.3.0',
                                'objects': combined_objects
                            }
                            print(f"✅ Saved complete design snapshot with {len(combined_objects)} objects")
                            print(f"   Object types: {[obj.get('type') for obj in combined_objects[:5]]}")
                        else:
                            print(f"⚠️ WARNING: No objects found in customization_options!")
                    else:
                        # Single area design
                        area_objects = customization_option.canvas_data.get('objects', []) if customization_option.canvas_data else []
                        if area_objects:
                            design_elements = area_objects
                            design_canvas_data = customization_option.canvas_data
                            print(f"✅ Saved single-area design snapshot with {len(area_objects)} objects")
                else:
                    print(f"⚠️ WARNING: customization_option {item.customization_option_id} not found in database!")

            except Exception as e:
                print(f"❌ ERROR fetching design data: {str(e)}")
                import traceback
                traceback.print_exc()

        # Create order item with complete design data
        order_items.append(
            models.OrderItem(
                product_id=item.product_id,
                product_name=item.product_name,
                variation_id=item.variation_id,
                customization_option_id=item.customization_option_id,
                customized_images=item.customized_images,
                quantity=item.quantity,
                unit_price=item.unit_price,
                shipping_method_id=item.shipping_method_id,
                # ✅ Use fetched complete design data (or fallback to frontend data)
                design_svg_data=design_svg_data,
                design_canvas_data=design_canvas_data,
                design_elements=design_elements,
                # Add discount fields
                discount_rule_id=item.discount_rule_id,
                original_unit_price=item.original_unit_price,
                discount_percentage=item.discount_percentage,
                discount_amount=item.discount_amount,
                discount_type=item.discount_type
            )
        )

    # Create order with processed items
    order = models.Order(
        user_id=order_data.user_id,
        guest_id=order_data.guest_id,
        subtotal=order_data.subtotal,
        shipping_cost=order_data.shipping_cost,
        total_price=order_data.total_price,
        shipping_method_id=order_data.shipping_method_id,
        estimated_delivery_days=order_data.estimated_delivery_days,
        shipping_cost_breakdown=order_data.shipping_cost_breakdown,
        payment_method_id=order_data.payment_method_id,
        shipping_address_id=order_data.shipping_address_id,
        items=order_items
    )

    db.add(order)
    await db.commit()

    # Refetch with eager loading of `items`
    result = await db.execute(
        select(models.Order).options(selectinload(models.Order.items)).where(models.Order.id == order.id)
    )
    return result.scalar_one()


async def get_order_by_id(db: AsyncSession, order_id: str) -> models.Order:
    result = await db.execute(
        select(models.Order).where(models.Order.id == order_id).options(
            selectinload(models.Order.items)
        )
    )
    return result.scalar_one_or_none()


async def update_order_status(
    db: AsyncSession, order_id: str, new_status: OrderStatus
) -> models.Order:
    result = await db.execute(
        select(models.Order)
        .options(selectinload(models.Order.items))  # 👈 eager load items
        .where(models.Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise ValueError("Order not found")

    order.status = new_status
    await db.commit()

    # Optionally refresh, but avoid triggering lazy load
    return order


async def get_orders_by_user_id(db: AsyncSession, user_id: str) -> List[models.Order]:
    result = await db.execute(
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.user_id == user_id)
        .order_by(models.Order.created_at.desc())
    )
    return list(result.scalars().all())

async def get_orders_by_guest_id(db: AsyncSession, guest_id: str) -> List[models.Order]:
    result = await db.execute(
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.guest_id == guest_id)
        .order_by(models.Order.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_order_by_id(db: AsyncSession, order_id: str) -> bool:
    result = await db.execute(select(models.Order).where(models.Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        return False

    await db.delete(order)
    await db.commit()
    return True


async def update_tracking_info(db: AsyncSession, order_id: str, tracking_info: str) -> Optional[models.Order]:
    result = await db.execute(
        select(models.Order)
        .options(selectinload(models.Order.items))  # ✅ Eagerly load items
        .where(models.Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        return None

    order.tracking_info = tracking_info
    await db.commit()
    await db.refresh(order)  # This is safe now because items are already loaded
    return order


async def get_orders_with_pagination(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    guest_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> Tuple[List[models.Order], int]:
    """
    Get orders with pagination, search, and filtering.
    Returns tuple of (orders_list, total_count)
    """
    from sqlalchemy import func, and_, or_
    from datetime import datetime
    
    # Build base query - NO eager loading of items for performance
    query = select(models.Order)
    count_query = select(func.count(models.Order.id))
    
    # Build filter conditions
    conditions = []
    
    # Search functionality
    if search:
        search_conditions = [
            models.Order.id.ilike(f"%{search}%"),
            models.Order.tracking_info.ilike(f"%{search}%")
        ]
        # Add user_id search if search is numeric
        try:
            search_int = int(search)
            search_conditions.append(models.Order.user_id == search_int)
        except ValueError:
            pass
        
        # Add guest_id search
        search_conditions.append(models.Order.guest_id.ilike(f"%{search}%"))
        
        conditions.append(or_(*search_conditions))
    
    # Status filter
    if status:
        from app.common.enums import OrderStatus
        try:
            status_enum = OrderStatus(status)
            conditions.append(models.Order.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter
    
    # User ID filter
    if user_id:
        conditions.append(models.Order.user_id == user_id)
    
    # Guest ID filter
    if guest_id:
        conditions.append(models.Order.guest_id == guest_id)
    
    # Date range filters
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d")
            conditions.append(models.Order.created_at >= date_from_obj)
        except ValueError:
            pass  # Invalid date format, ignore filter
    
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d")
            # Add 1 day to include the entire day
            from datetime import timedelta
            date_to_obj = date_to_obj + timedelta(days=1)
            conditions.append(models.Order.created_at < date_to_obj)
        except ValueError:
            pass  # Invalid date format, ignore filter
    
    # Apply all conditions
    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))
    
    # Apply sorting
    valid_sort_fields = ["created_at", "total_price", "status", "subtotal"]
    if sort_by not in valid_sort_fields:
        sort_by = "created_at"
    
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "desc"
    
    sort_column = getattr(models.Order, sort_by)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count
    total_result = await db.execute(count_query)
    total_count = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    # Execute query
    result = await db.execute(query)
    orders = list(result.scalars().all())
    
    return orders, total_count


async def update_order_fields(
    db: AsyncSession,
    order_id: str,
    shipping_method_id: Optional[int] = None,
    shipping_address_id: Optional[str] = None,
    payment_method_id: Optional[int] = None
) -> Optional[models.Order]:
    """Update specific fields of an order"""
    result = await db.execute(
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        return None

    # Update only the provided fields
    if shipping_method_id is not None:
        order.shipping_method_id = shipping_method_id
    
    if shipping_address_id is not None:
        order.shipping_address_id = shipping_address_id
    
    if payment_method_id is not None:
        order.payment_method_id = payment_method_id

    await db.commit()
    await db.refresh(order)
    return order


async def cancel_order(db: AsyncSession, order_id: str) -> Optional[models.Order]:
    """Cancel an order by setting its status to CANCELLED"""
    result = await db.execute(
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        return None

    # Set status to cancelled
    order.status = OrderStatus.CANCELLED
    
    await db.commit()
    await db.refresh(order)
    return order
