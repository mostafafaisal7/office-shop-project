# app/orders/router.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.orders import schemas, service, models
from app.orders.schemas import OrderStatusUpdate, OrderRead
from app.orders.service import change_order_status
from app.common.dependencies import get_current_user, require_admin
from app.common.enums import OrderStatus
from typing import List, Optional
from fastapi.responses import StreamingResponse
from app.orders.invoice import generate_invoice_pdf
from app.orders.schemas import OrderTrackingUpdate
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import zipfile
import json
from io import BytesIO

router = APIRouter()


@router.get("/", response_model=List[schemas.OrderRead], dependencies=[Depends(require_admin)])
async def get_all_orders(
    db: AsyncSession = Depends(get_db)
):
    return await service.list_all_orders(db)


@router.get("/list", response_model=schemas.OrderListResponse, dependencies=[Depends(require_admin)])
async def list_orders_with_pagination(
    # Pagination parameters
    page: int = 1,
    per_page: int = 20,
    # Search parameter
    q: Optional[str] = None,
    # Filtering parameters
    status: Optional[OrderStatus] = None,
    user_id: Optional[int] = None,
    guest_id: Optional[str] = None,
    # Date filtering parameters (format: YYYY-MM-DD)
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    # Sorting parameters
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: AsyncSession = Depends(get_db)
):
    """
    List orders with pagination, search, and filtering support.
    
    This endpoint returns only essential order data (without order items) for better performance.
    Perfect for admin dashboards showing order lists.
    
    **Pagination:**
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    
    **Search:**
    - q: Search by order ID, tracking info, user ID, or guest ID (supports partial matches)
    
    **Filtering:**
    - status: Filter by order status (pending, paid, shipped, delivered, cancelled)
    - user_id: Filter by user ID
    - guest_id: Filter by guest ID
    - date_from: Filter orders from this date (YYYY-MM-DD)
    - date_to: Filter orders until this date (YYYY-MM-DD)
    
    **Sorting:**
    - sort_by: Sort field (created_at, total_price, status, subtotal)
    - sort_order: Sort direction (asc, desc)
    """
    # Validate pagination parameters
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 20
    if per_page > 100:
        per_page = 100
    
    # Convert status enum to string if provided
    status_str = status.value if status else None
    
    return await service.list_orders_with_pagination(
        db=db,
        page=page,
        per_page=per_page,
        search=q,
        status=status_str,
        user_id=user_id,
        guest_id=guest_id,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.post("/", response_model=schemas.OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: schemas.OrderCreate,
    db: AsyncSession = Depends(get_db)
):
    created_order = await service.process_order(db, order)
    return schemas.OrderRead.model_validate(created_order)


@router.get("/track-your-order", response_model=schemas.OrderTrackingSummary)
async def track_order(
    order_code: str = Query(..., description="Your order ID or code"),
    db: AsyncSession = Depends(get_db)
):
    print(order_code)
    order_summary = await service.get_tracking_summary(db, order_code)
    if not order_summary:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_summary


@router.get("/{order_id}", response_model=schemas.OrderDetailRead)
async def read_order(order_id: str, db: AsyncSession = Depends(get_db)):
    db_order = await service.get_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order


@router.patch("/{order_id}/status", response_model=OrderRead, dependencies=[Depends(require_admin)])
async def update_order_status_endpoint(
    order_id: str,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await change_order_status(db, order_id, payload.status)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    
    
@router.get("/user/me", response_model=List[schemas.OrderRead])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.list_user_orders(db, current_user.id)


@router.get("/guest/{guest_id}", response_model=List[schemas.OrderRead])
async def get_guest_orders(
    guest_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await service.list_guest_orders(db, guest_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_order(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    deleted = await service.remove_order(db, order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
    return


@router.get("/{order_id}/invoice")
async def download_invoice(
    order_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(models.Order).options(selectinload(models.Order.items)).where(models.Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    pdf_buffer = generate_invoice_pdf(order)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice-{order_id}.pdf"},
    )



@router.patch("/{order_id}/track", response_model=schemas.OrderRead, dependencies=[Depends(require_admin)])
async def update_tracking(
    order_id: str,
    data: OrderTrackingUpdate,
    db: AsyncSession = Depends(get_db),
):
    order = await service.update_order_tracking(db, order_id, data.tracking_info)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}", response_model=schemas.OrderRead)
async def update_order(
    order_id: str,
    update_data: schemas.OrderUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Update order fields for authenticated users.
    
    Users can only update their own orders and only when the order status is PENDING.
    Only the following fields can be updated:
    - shipping_method_id
    - shipping_address_id  
    - payment_method_id
    """
    try:
        updated_order = await service.update_user_order(
            db=db,
            order_id=order_id,
            user_id=current_user.id,
            update_data=update_data
        )
        
        if not updated_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return updated_order
        
    except ValueError as e:
        error_message = str(e)
        if "does not own this order" in error_message:
            raise HTTPException(status_code=403, detail="You are not authorized to update this order")
        elif "status is PENDING" in error_message:
            raise HTTPException(status_code=400, detail="Order can only be updated when status is PENDING")
        elif "Invalid" in error_message:
            raise HTTPException(status_code=400, detail=error_message)
        else:
            raise HTTPException(status_code=400, detail=error_message)


@router.post("/{order_id}/cancel", response_model=schemas.OrderCancelResponse)
async def cancel_order(
    order_id: str,
    cancel_data: schemas.OrderCancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Cancel an order for authenticated users.
    
    Users can only cancel their own orders and only when the order status is PENDING.
    Once cancelled, the order status will be set to CANCELLED and cannot be reverted.
    """
    try:
        cancelled_order = await service.cancel_user_order(
            db=db,
            order_id=order_id,
            user_id=current_user.id,
            cancel_data=cancel_data
        )
        
        if not cancelled_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return cancelled_order
        
    except ValueError as e:
        error_message = str(e)
        if "does not own this order" in error_message:
            raise HTTPException(status_code=403, detail="You are not authorized to cancel this order")
        elif "status is PENDING" in error_message:
            raise HTTPException(status_code=400, detail="Order can only be cancelled when status is PENDING")
        else:
            raise HTTPException(status_code=400, detail=error_message)



@router.get("/{order_id}/items/{item_id}/download-svg", dependencies=[Depends(require_admin)])
async def download_order_item_svg(
    order_id: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Download SVG design file for a specific order item (admin only).

    This endpoint returns the SVG data for print-ready designs.
    If the order item has no SVG data, it returns a 404 error.
    """
    # Fetch the order item
    result = await db.execute(
        select(models.OrderItem)
        .where(models.OrderItem.id == item_id, models.OrderItem.order_id == order_id)
    )
    order_item = result.scalar_one_or_none()

    if not order_item:
        raise HTTPException(
            status_code=404,
            detail=f"Order item {item_id} not found in order {order_id}"
        )

    if not order_item.design_svg_data:
        raise HTTPException(
            status_code=404,
            detail="No SVG design data available for this order item"
        )

    # Prepare filename
    filename = f"order_{order_id}_item_{item_id}_design.svg"

    # Return SVG as downloadable file
    from io import BytesIO
    svg_bytes = BytesIO(order_item.design_svg_data.encode("utf-8"))

    return StreamingResponse(
        svg_bytes,
        media_type="image/svg+xml",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/{order_id}/items/{item_id}/download-design-zip", dependencies=[Depends(require_admin)])
async def download_order_item_design_zip(
    order_id: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Download all design files as ZIP for a specific order item (admin only).

    The ZIP contains:
    - design.svg: SVG file for printing
    - canvas_data.json: Fabric.js canvas data
    - design_elements.json: Design elements details
    """
    # Fetch the order item
    result = await db.execute(
        select(models.OrderItem)
        .where(models.OrderItem.id == item_id, models.OrderItem.order_id == order_id)
    )
    order_item = result.scalar_one_or_none()

    if not order_item:
        raise HTTPException(
            status_code=404,
            detail=f"Order item {item_id} not found in order {order_id}"
        )

    # Check if there's any design data
    if not (order_item.design_svg_data or order_item.design_canvas_data or order_item.design_elements):
        raise HTTPException(
            status_code=404,
            detail="No design data available for this order item"
        )

    # Create ZIP file in memory
    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add SVG file if available
        if order_item.design_svg_data:
            zip_file.writestr('design.svg', order_item.design_svg_data)

        # Add canvas data JSON if available
        if order_item.design_canvas_data:
            canvas_json = json.dumps(order_item.design_canvas_data, indent=2)
            zip_file.writestr('canvas_data.json', canvas_json)

        # Add design elements JSON if available
        if order_item.design_elements:
            elements_json = json.dumps(order_item.design_elements, indent=2)
            zip_file.writestr('design_elements.json', elements_json)

        # Add a README file with order information
        readme_content = f"""Design Files for Order Item
============================

Order ID: {order_id}
Item ID: {item_id}
Product: {order_item.product_name}

Files included:
- design.svg: Vector graphic file for printing
- canvas_data.json: Complete Fabric.js canvas data
- design_elements.json: Individual design elements

Generated: {order_item.created_at}
"""
        zip_file.writestr('README.txt', readme_content)

    # Prepare ZIP for download
    zip_buffer.seek(0)
    filename = f"order_{order_id}_item_{item_id}_design.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
