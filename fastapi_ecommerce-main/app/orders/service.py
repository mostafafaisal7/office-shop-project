# app/orders/service.py

from sqlalchemy.ext.asyncio import AsyncSession
from app.orders import schemas, crud, models
from app.orders.schemas import OrderRead, VariationDetail, VariationMediaDetail, ShippingMethodDetail, PaymentMethodDetail, ShippingAddressDetail
from app.common.enums import OrderStatus
from app.common.http import http_get
from typing import List, Optional, Dict
import os
import asyncio
from decimal import Decimal

from app.users.service import get_user_details
from app.users.schemas import UserResponse



async def list_all_orders(db: AsyncSession) -> List[models.Order]:
    return await crud.get_all_orders(db)


async def process_order(db: AsyncSession, order_data: schemas.OrderCreate) -> models.Order:
    return await crud.create_order(db, order_data)


async def fetch_variation_details(variation_id: int) -> Optional[VariationDetail]:
    """Fetch variation details from the products service"""
    try:
        # Get the base URL from environment or use localhost
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/products/variations/{variation_id}"
        
        response = await http_get(url)
        if response and response.get("id"):
            # Convert media data to VariationMediaDetail objects
            media_data = response.get("media", [])
            media_objects = []
            for media in media_data:
                media_objects.append(VariationMediaDetail(
                    id=media.get("id"),
                    file_path=media.get("file_path"),
                    file_name=media.get("file_name"),
                    media_type=media.get("media_type"),
                    mime_type=media.get("mime_type"),
                    alt_text=media.get("alt_text"),
                    design=media.get("design", False),
                    area=media.get("area", "front"),
                    sort_order=media.get("sort_order", 0),
                    uploaded_at=media.get("uploaded_at")
                ))
            
            return VariationDetail(
                id=response.get("id"),
                product_id=response.get("product_id"),
                name=response.get("name"),
                sku=response.get("sku"),
                price=Decimal(str(response.get("price"))) if response.get("price") else None,
                stock_quantity=response.get("stock_quantity", 0),
                low_stock_threshold=response.get("low_stock_threshold", 5),
                attributes=response.get("attributes", {}),
                is_active=response.get("is_active", True),
                sort_order=response.get("sort_order", 0),
                created_at=response.get("created_at"),
                media=media_objects
            )
    except Exception as e:
        print(f"Error fetching variation details for variation_id {variation_id}: {str(e)}")
        return None
    
    return None


async def fetch_shipping_method_details(method_id: int) -> Optional[ShippingMethodDetail]:
    """Fetch shipping method details from the shipping service"""
    try:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/shipping/methods/{method_id}"
        
        response = await http_get(url)
        if response and response.get("id"):
            return ShippingMethodDetail(
                id=response.get("id"),
                name=response.get("name"),
                description=response.get("description"),
                cost=response.get("cost"),
                is_active=response.get("is_active", True)
            )
    except Exception as e:
        print(f"Error fetching shipping method details for method_id {method_id}: {str(e)}")
        return None
    
    return None


async def fetch_payment_method_details(method_id: int) -> Optional[PaymentMethodDetail]:
    """Fetch payment method details from the payment service"""
    try:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/payment/methods/{method_id}"

        response = await http_get(url)
        if response and response.get("id"):
            return PaymentMethodDetail(
                id=response.get("id"),
                name=response.get("name"),
                description=response.get("description"),
                is_active=response.get("is_active", True),
                type=response.get("type")
            )
    except Exception as e:
        print(f"Error fetching payment method details for method_id {method_id}: {str(e)}")
        return None

    return None


async def fetch_customization_option_details(option_id: int) -> Optional[dict]:
    """Fetch customization option details from the products service"""
    try:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/products/options/{option_id}"

        response = await http_get(url)
        if response and response.get("id"):
            return response  # Return the full customization option data
    except Exception as e:
        print(f"Error fetching customization option details for option_id {option_id}: {str(e)}")
        return None

    return None


# async def fetch_shipping_address_details(address_id: str) -> Optional[ShippingAddressDetail]:
#     """Fetch shipping address details from the shipping service"""
#     try:
#         base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
#         url = f"{base_url}/shipping/addresses/{address_id}"
        
#         response = await http_get(url)
#         print(f"Shipping address API response for {address_id}: {response}")  # <-- debug log

#         if response and response.get("id"):
#             return ShippingAddressDetail(
#                 # id=response.get("id"),
#                 # full_name=response.get("full_name"),
#                 # phone=response.get("phone"),
#                 # email=response.get("email"),
#                 # address_line=response.get("address_line"),
#                 # city=response.get("city"),
#                 # state=response.get("state"),
#                 # postal_code=response.get("postal_code"),
#                 # country=response.get("country")
#                 id=str(response.get("id")),
#                 full_name=response.get("full_name", ""),
#                 phone=response.get("phone", ""),
#                 email=response.get("email", ""),
#                 address_line=response.get("delivery_address", ""),  # map from delivery_address
#                 city=response.get("district", ""),                  # map from district
#                 state=response.get("division", ""),                # map from division
#                 postal_code=response.get("postal_code", ""),
#                 country=response.get("country", "")
#             )
#     except Exception as e:
#         print(f"Error fetching shipping address details for address_id {address_id}: {str(e)}")
#         return None
    
#     return None


async def fetch_shipping_address_details(address_id: str) -> Optional[ShippingAddressDetail]:
    try:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/shipping/addresses/{address_id}"
        response = await http_get(url)
        print(f"Shipping address API response for {address_id}: {response}")

        if response and response.get("id"):
            return ShippingAddressDetail(**response)  # Directly pass API dict
    except Exception as e:
        print(f"Error fetching shipping address details for address_id {address_id}: {str(e)}")
        return None


# async def get_order(db: AsyncSession, order_id: str) -> Optional[schemas.OrderDetailRead]:
#     """Get order with enriched details including variation, shipping, and payment information"""
#     order_dict = {
#         "id": order.id,
#         "user_id": order.user_id,
#         "guest_id": order.guest_id,
#         ...
#         "items": []
#     }
#     order = await crud.get_order_by_id(db, order_id)
#     if not order:
#         return None
    
#     user_data = None
#     if order.user_id:
#         try:
#             user = await get_user_details(db, order.user_id)
#             user_data = UserResponse.model_validate(user).model_dump()
#         except Exception as e:
#             print(f"Error fetching user details for user_id {order.user_id}: {str(e)}")
#     # Convert order to dict for manipulation
#     order_dict = {
#         "id": order.id,
#         "user_id": order.user_id,
#         "guest_id": order.guest_id,
#         "subtotal": order.subtotal,
#         "shipping_cost": order.shipping_cost,
#         "total_price": order.total_price,
#         "shipping_method_id": order.shipping_method_id,
#         "estimated_delivery_days": order.estimated_delivery_days,
#         "shipping_cost_breakdown": order.shipping_cost_breakdown,
#         "payment_method_id": order.payment_method_id,
#         "shipping_address_id": order.shipping_address_id,
#         "status": order.status,
#         "tracking_info": order.tracking_info,
#         "created_at": order.created_at,
#         "payment_method": None,
#         "shipping_method": None,
#         "shipping_address": None,
#         "items": []
#     }
    
#     # Collect all unique IDs that need to be fetched
#     variation_ids = set()
#     item_shipping_method_ids = set()
    
#     # Prepare tasks for concurrent HTTP calls
#     fetch_tasks = []
    
#     # Add order-level fetch tasks
#     if order.payment_method_id is not None:
#         fetch_tasks.append(("payment_method", fetch_payment_method_details(order.payment_method_id)))
    
#     if order.shipping_method_id is not None:
#         fetch_tasks.append(("order_shipping_method", fetch_shipping_method_details(order.shipping_method_id)))
    
#     if order.shipping_address_id is not None:
#         fetch_tasks.append(("shipping_address", fetch_shipping_address_details(order.shipping_address_id)))
    
#     # Process each order item and collect IDs
#     for item in order.items:
#         item_dict = {
#             "id": item.id,
#             "product_id": item.product_id,
#             "product_name": item.product_name,
#             "variation_id": item.variation_id,
#             "customization_option_id": item.customization_option_id,
#             "customized_images": item.customized_images,
#             "quantity": item.quantity,
#             "unit_price": item.unit_price,
#             "shipping_method_id": item.shipping_method_id,
#             "discount_rule_id": item.discount_rule_id,
#             "original_unit_price": item.original_unit_price,
#             "discount_percentage": item.discount_percentage,
#             "discount_amount": item.discount_amount,
#             "discount_type": item.discount_type,
#             "shipping_method": None,
#             "variation_details": None
#         }
        
#         # Collect unique IDs for batch fetching
#         if item.variation_id:
#             variation_ids.add(item.variation_id)
        
#         if item.shipping_method_id:
#             item_shipping_method_ids.add(item.shipping_method_id)
        
#         order_dict["items"].append(item_dict)
    
#     # Add variation fetch tasks
#     for variation_id in variation_ids:
#         fetch_tasks.append((f"variation_{variation_id}", fetch_variation_details(variation_id)))
    
#     # Add item shipping method fetch tasks
#     for method_id in item_shipping_method_ids:
#         fetch_tasks.append((f"shipping_method_{method_id}", fetch_shipping_method_details(method_id)))
    
#     # Execute all HTTP calls concurrently
#     if fetch_tasks:
#         task_names, tasks = zip(*fetch_tasks)
#         results = await asyncio.gather(*tasks, return_exceptions=True)
        
#         # Create lookup dictionaries for fetched data
#         fetched_data = {}
#         for task_name, result in zip(task_names, results):
#             if not isinstance(result, Exception) and result is not None:
#                 fetched_data[task_name] = result
#     else:
#         fetched_data = {}
    
#     # Populate order-level details
#     order_dict["payment_method"] = fetched_data.get("payment_method")
#     order_dict["shipping_method"] = fetched_data.get("order_shipping_method")
#     order_dict["shipping_address"] = fetched_data.get("shipping_address")
    
#     # Populate item-level details
#     for item_dict in order_dict["items"]:
#         # Set variation details
#         if item_dict["variation_id"]:
#             variation_key = f"variation_{item_dict['variation_id']}"
#             item_dict["variation_details"] = fetched_data.get(variation_key)
        
#         # Set item shipping method details
#         if item_dict["shipping_method_id"]:
#             shipping_method_key = f"shipping_method_{item_dict['shipping_method_id']}"
#             item_dict["shipping_method"] = fetched_data.get(shipping_method_key)
    
#     return schemas.OrderDetailRead.model_validate(order_dict)



async def get_order(db: AsyncSession, order_id: str) -> Optional[schemas.OrderDetailRead]:
    """Get order with enriched details including variation, shipping, and payment information"""
    # 1️⃣ Fetch the order first
    order = await crud.get_order_by_id(db, order_id)
    if not order:
        return None

    # 2️⃣ Fetch user details if order has a user_id
    user_data = None
    if order.user_id:
        try:
            user = await get_user_details(db, order.user_id)
            user_data = UserResponse.model_validate(user)
            print("DEBUG: user_data =", user_data)   # <-- debug here

        except Exception as e:
            print(f"Error fetching user details for user_id {order.user_id}: {str(e)}")

    # 3️⃣ Build order_dict exactly like before, just add `user` field
    order_dict = {
        "id": order.id,
        "user_id": order.user_id,
        "guest_id": order.guest_id,
        "subtotal": order.subtotal,
        "shipping_cost": order.shipping_cost,
        "total_price": order.total_price,
        "shipping_method_id": order.shipping_method_id,
        "estimated_delivery_days": order.estimated_delivery_days,
        "shipping_cost_breakdown": order.shipping_cost_breakdown,
        "payment_method_id": order.payment_method_id,
        "shipping_address_id": order.shipping_address_id,
        "status": order.status,
        "tracking_info": order.tracking_info,
        "created_at": order.created_at,
        "payment_method": None,
        "shipping_method": None,
        "shipping_address": None,
        "items": [],
        "user": user_data  # 🔹 add user info here
    }
    
    print("DEBUG: order_dict['user'] =", order_dict.get("user"))  # <-- debug

    # 4️⃣ The rest is exactly the same
    variation_ids = set()
    item_shipping_method_ids = set()
    customization_option_ids = set()
    fetch_tasks = []

    if order.payment_method_id is not None:
        fetch_tasks.append(("payment_method", fetch_payment_method_details(order.payment_method_id)))
    if order.shipping_method_id is not None:
        fetch_tasks.append(("order_shipping_method", fetch_shipping_method_details(order.shipping_method_id)))
    if order.shipping_address_id is not None:
        fetch_tasks.append(("shipping_address", fetch_shipping_address_details(order.shipping_address_id)))

    for item in order.items:
        item_dict = {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product_name,
            "variation_id": item.variation_id,
            "customization_option_id": item.customization_option_id,
            "customized_images": item.customized_images,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "shipping_method_id": item.shipping_method_id,
            "discount_rule_id": item.discount_rule_id,
            "original_unit_price": item.original_unit_price,
            "discount_percentage": item.discount_percentage,
            "discount_amount": item.discount_amount,
            "discount_type": item.discount_type,
            "shipping_method": None,
            "variation_details": None,
            "customization_details": None
        }

        if item.variation_id:
            variation_ids.add(item.variation_id)
        if item.shipping_method_id:
            item_shipping_method_ids.add(item.shipping_method_id)
        if item.customization_option_id:
            customization_option_ids.add(item.customization_option_id)

        order_dict["items"].append(item_dict)

    for variation_id in variation_ids:
        fetch_tasks.append((f"variation_{variation_id}", fetch_variation_details(variation_id)))
    for method_id in item_shipping_method_ids:
        fetch_tasks.append((f"shipping_method_{method_id}", fetch_shipping_method_details(method_id)))
    for option_id in customization_option_ids:
        fetch_tasks.append((f"customization_{option_id}", fetch_customization_option_details(option_id)))

    if fetch_tasks:
        task_names, tasks = zip(*fetch_tasks)
        results = await asyncio.gather(*tasks, return_exceptions=True)

        fetched_data = {}
        for task_name, result in zip(task_names, results):
            if not isinstance(result, Exception) and result is not None:
                fetched_data[task_name] = result
    else:
        fetched_data = {}

    order_dict["payment_method"] = fetched_data.get("payment_method")
    order_dict["shipping_method"] = fetched_data.get("order_shipping_method")
    order_dict["shipping_address"] = fetched_data.get("shipping_address")

    for item_dict in order_dict["items"]:
        if item_dict["variation_id"]:
            variation_key = f"variation_{item_dict['variation_id']}"
            item_dict["variation_details"] = fetched_data.get(variation_key)
        if item_dict["shipping_method_id"]:
            shipping_method_key = f"shipping_method_{item_dict['shipping_method_id']}"
            item_dict["shipping_method"] = fetched_data.get(shipping_method_key)
        if item_dict["customization_option_id"]:
            customization_key = f"customization_{item_dict['customization_option_id']}"
            item_dict["customization_details"] = fetched_data.get(customization_key)

    return schemas.OrderDetailRead.model_validate(order_dict)



async def change_order_status(
    db: AsyncSession, order_id: str, new_status: OrderStatus
) -> OrderRead:
    updated_order = await crud.update_order_status(db, order_id, new_status)
    return OrderRead.model_validate(updated_order)


async def list_user_orders(db: AsyncSession, user_id: str) -> List[models.Order]:
    return await crud.get_orders_by_user_id(db, user_id)


async def list_guest_orders(db: AsyncSession, guest_id: str) -> List[models.Order]:
    return await crud.get_orders_by_guest_id(db, guest_id)


async def remove_order(db: AsyncSession, order_id: str) -> bool:
    return await crud.delete_order_by_id(db, order_id)


async def update_order_tracking(
    db: AsyncSession, order_id: str, tracking_info: str
) -> Optional[models.Order]:
    return await crud.update_tracking_info(db, order_id, tracking_info)

    
async def get_tracking_summary(db: AsyncSession, order_code: str) -> Optional[schemas.OrderTrackingSummary]:
    order = await crud.get_order_by_id(db, order_code)
    if not order:
        return None

    # Use the stored subtotal if available, otherwise calculate from items
    subtotal = order.subtotal if hasattr(order, 'subtotal') and order.subtotal is not None else sum(item.unit_price * item.quantity for item in order.items)
    shipping_cost = order.shipping_cost if hasattr(order, 'shipping_cost') and order.shipping_cost is not None else 0.0
    total_price = float(order.total_price)
    estimated_delivery_days = order.estimated_delivery_days if hasattr(order, 'estimated_delivery_days') else None

    return schemas.OrderTrackingSummary(
        order_id=str(order.id),
        status=order.status.value,
        tracking_info=order.tracking_info,
        created_at=order.created_at,
        subtotal=float(subtotal),
        shipping_cost=float(shipping_cost) if shipping_cost is not None else 0.0,
        total_price=total_price,
        estimated_delivery_days=estimated_delivery_days
    )


async def validate_shipping_method_exists(method_id: int) -> bool:
    """Validate that shipping method exists and is active"""
    try:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/shipping/methods/{method_id}"
        
        response = await http_get(url)
        return response is not None and response.get("is_active", False)
    except Exception as e:
        print(f"Error validating shipping method {method_id}: {str(e)}")
        return False


async def validate_payment_method_exists(method_id: int) -> bool:
    """Validate that payment method exists and is active"""
    try:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/payment/methods/{method_id}"
        
        response = await http_get(url)
        return response is not None and response.get("is_active", False)
    except Exception as e:
        print(f"Error validating payment method {method_id}: {str(e)}")
        return False


async def validate_shipping_address_belongs_to_user(address_id: str, user_id: int) -> bool:
    """Validate that shipping address belongs to the user"""
    try:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        url = f"{base_url}/shipping/addresses/{address_id}"
        
        response = await http_get(url)
        if response is None:
            return False
        
        # Check if the address belongs to the user
        # This assumes the shipping address API returns user_id field
        return response.get("user_id") == user_id
    except Exception as e:
        print(f"Error validating shipping address {address_id} for user {user_id}: {str(e)}")
        return False


async def update_user_order(
    db: AsyncSession,
    order_id: str,
    user_id: int,
    update_data: schemas.OrderUpdateRequest
) -> Optional[schemas.OrderRead]:
    """Update order fields for authenticated user"""
    # First, get the order and validate ownership
    order = await crud.get_order_by_id(db, order_id)
    if not order:
        return None
    
    # Check if user owns the order
    if order.user_id != user_id:
        raise ValueError("User does not own this order")
    
    # Check if order is in PENDING status
    if order.status != OrderStatus.PENDING:
        raise ValueError("Order can only be updated when status is PENDING")
    
    # Validate the fields if provided
    if update_data.shipping_method_id is not None:
        if not await validate_shipping_method_exists(update_data.shipping_method_id):
            raise ValueError("Invalid shipping method ID")
    
    if update_data.payment_method_id is not None:
        if not await validate_payment_method_exists(update_data.payment_method_id):
            raise ValueError("Invalid payment method ID")
    
    if update_data.shipping_address_id is not None:
        if not await validate_shipping_address_belongs_to_user(update_data.shipping_address_id, user_id):
            raise ValueError("Invalid shipping address ID or address does not belong to user")
    
    # Update the order
    updated_order = await crud.update_order_fields(
        db=db,
        order_id=order_id,
        shipping_method_id=update_data.shipping_method_id,
        shipping_address_id=update_data.shipping_address_id,
        payment_method_id=update_data.payment_method_id
    )
    
    if not updated_order:
        return None
    
    return schemas.OrderRead.model_validate(updated_order)


async def cancel_user_order(
    db: AsyncSession,
    order_id: str,
    user_id: int,
    cancel_data: schemas.OrderCancelRequest
) -> Optional[schemas.OrderCancelResponse]:
    """Cancel an order for authenticated user"""
    from datetime import datetime
    
    # First, get the order and validate ownership
    order = await crud.get_order_by_id(db, order_id)
    if not order:
        return None
    
    # Check if user owns the order
    if order.user_id != user_id:
        raise ValueError("User does not own this order")
    
    # Check if order is in PENDING status
    if order.status != OrderStatus.PENDING:
        raise ValueError("Order can only be cancelled when status is PENDING")
    
    # Cancel the order
    cancelled_order = await crud.cancel_order(db, order_id)
    
    if not cancelled_order:
        return None
    
    # Create response
    return schemas.OrderCancelResponse(
        id=cancelled_order.id,
        status=cancelled_order.status,
        cancelled_at=datetime.utcnow(),  # Using current time since we don't have a cancelled_at field
        message="Order has been successfully cancelled"
    )


async def list_orders_with_pagination(
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
) -> schemas.OrderListResponse:
    """
    Get orders with pagination, search, and filtering.
    Returns OrderListResponse with orders and pagination info.
    """
    import math
    
    # Get orders and total count from CRUD
    orders, total_count = await crud.get_orders_with_pagination(
        db=db,
        page=page,
        per_page=per_page,
        search=search,
        status=status,
        user_id=user_id,
        guest_id=guest_id,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Calculate total pages
    total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1
    
    # Convert to OrderListItem schemas
    order_items = [schemas.OrderListItem.model_validate(order) for order in orders]
    
    return schemas.OrderListResponse(
        orders=order_items,
        total=total_count,
        page=page,
        per_page=per_page,
        pages=total_pages
    )
