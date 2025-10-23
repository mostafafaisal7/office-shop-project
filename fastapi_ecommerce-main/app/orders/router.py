# app/orders/router.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.orders import schemas, service, models
from app.orders.schemas import OrderStatusUpdate, OrderRead
from app.orders.service import change_order_status
from app.common.dependencies import get_current_user, require_admin
from app.common.enums import OrderStatus
from datetime import datetime
from typing import List, Optional
from fastapi.responses import StreamingResponse
from app.orders.invoice import generate_invoice_pdf
from app.orders.schemas import OrderTrackingUpdate
from sqlalchemy import select
from sqlalchemy.orm import selectinload

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


@router.get("/{order_id}/items/{item_id}/download-canvas", dependencies=[Depends(require_admin)])
async def download_order_item_canvas(
    order_id: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Download canvas JSON data for a specific order item (admin only).

    This endpoint returns the complete Fabric.js canvas data including all objects,
    transformations, and design elements. Useful for recreating or editing the design.
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

    if not order_item.design_canvas_data:
        raise HTTPException(
            status_code=404,
            detail="No canvas data available for this order item"
        )

    # Prepare filename
    filename = f"order_{order_id}_item_{item_id}_canvas.json"

    # Return canvas data as downloadable JSON file
    import json
    from io import BytesIO
    canvas_json = json.dumps(order_item.design_canvas_data, indent=2)
    canvas_bytes = BytesIO(canvas_json.encode("utf-8"))

    return StreamingResponse(
        canvas_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/{order_id}/items/{item_id}/download-elements", dependencies=[Depends(require_admin)])
async def download_order_item_elements(
    order_id: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Download design elements JSON for a specific order item (admin only).

    This endpoint returns a simplified list of design elements (text, images, shapes)
    with their properties. Useful for understanding the design composition.
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

    if not order_item.design_elements:
        raise HTTPException(
            status_code=404,
            detail="No design elements available for this order item"
        )

    # Prepare filename
    filename = f"order_{order_id}_item_{item_id}_elements.json"

    # Return design elements as downloadable JSON file
    import json
    from io import BytesIO
    elements_json = json.dumps(order_item.design_elements, indent=2)
    elements_bytes = BytesIO(elements_json.encode("utf-8"))

    return StreamingResponse(
        elements_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/{order_id}/items/{item_id}/download-design-package", dependencies=[Depends(require_admin)])
async def download_order_item_design_package(
    order_id: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Download complete design package as ZIP file (admin only).

    This endpoint returns a ZIP file containing:
    - Text elements as individual SVG files
    - Images as their original uploaded files
    - A manifest.json with design metadata

    Perfect for production/printing workflows.
    """
    import zipfile
    import io
    import os
    import re
    from urllib.parse import urlparse
    import json

    print(f"\n=== Creating design package for order {order_id}, item {item_id} ===")

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

    # ✅ FIX: Fetch ALL customization options for this product/variation
    # User might have designed on multiple areas (front, back, left, right)
    # Each area has separate canvas_data - we need to combine them all
    all_objects = []
    customization_options = []  # ✅ Store for preview image extraction

    if order_item.customization_option_id:
        print(f"Fetching all design areas for customization option: {order_item.customization_option_id}")

        # Import products models to access CustomizationOption
        from app.products import models as product_models

        # Get the customization option to find client_reference_id
        result = await db.execute(
            select(product_models.CustomizationOption)
            .where(product_models.CustomizationOption.id == order_item.customization_option_id)
        )
        main_option = result.scalar_one_or_none()

        if main_option and main_option.client_reference_id:
            # Fetch ALL customization options with the same client_reference_id
            # These represent all design areas (front, back, left, right) for this product/variation
            result = await db.execute(
                select(product_models.CustomizationOption)
                .where(product_models.CustomizationOption.client_reference_id == main_option.client_reference_id)
            )
            all_options = result.scalars().all()

            print(f"Found {len(all_options)} design areas for client_reference_id: {main_option.client_reference_id}")

            # ✅ Store all_options for later preview image extraction
            customization_options = all_options

            # Combine objects from all design areas
            for option in all_options:
                area_objects = option.canvas_data.get('objects', [])
                print(f"  - {option.design_area}: {len(area_objects)} objects")
                all_objects.extend(area_objects)
        else:
            # Fallback: use just the main option's canvas_data
            if order_item.design_canvas_data:
                all_objects = order_item.design_canvas_data.get('objects', [])
    elif order_item.design_canvas_data:
        # Fallback: use order_item's saved canvas_data
        all_objects = order_item.design_canvas_data.get('objects', [])

    if not all_objects:
        raise HTTPException(
            status_code=404,
            detail="No design data available for this order item"
        )

    try:
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            objects = all_objects

            print(f"\n{'='*60}")
            print(f"DEBUG: ZIP Creation for Order {order_id}, Item {item_id}")
            print(f"{'='*60}")
            print(f"Total objects from ALL design areas: {len(objects)}")
            print(f"Object types: {[obj.get('type') for obj in objects]}")
            print(f"{'='*60}\n")

            text_count = 0
            image_count = 0
            files_added = []

            # Add README file
            readme_content = f"""Design Package for Order {order_id} - Item {item_id}
===============================================

Product: {order_item.product_name}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Contents:
- texts/ : Text elements as SVG files with exact canvas properties
- images/ : Original uploaded images (without transformations)
- images_transformed/ : Images as SVG with transformations (position, rotation, scale)
  * Use these to see exactly how user designed each image
  * Contains transformation metadata for production
- previews/ : Preview images showing complete design composited on product
- manifest.json : Design metadata
- canvas_data.json : Complete Fabric.js canvas data

IMPORTANT FOR PRODUCTION:
- Use images_transformed/ to see images as user designed them (with rotation/scale)
- Use previews/ to see the complete final design on the product
- Use texts/ for text elements with exact styling and positioning

Use these files for production, printing, or design editing.
"""
            zip_file.writestr("README.txt", readme_content)
            files_added.append("README.txt")
            print("Added README.txt")

            # Process each object in the canvas
            for idx, obj in enumerate(objects):
                obj_type = obj.get('type', '').lower()

                # Handle text elements - convert to SVG with EXACT canvas properties
                if obj_type in ['text', 'i-text', 'textbox']:
                    text_count += 1

                    # Extract all text properties from canvas
                    text_content = obj.get('text', '')
                    left = obj.get('left', 0)
                    top = obj.get('top', 0)
                    font_family = obj.get('fontFamily', 'Arial')
                    font_size = obj.get('fontSize', 40)
                    fill_color = obj.get('fill', '#000000')
                    font_weight = obj.get('fontWeight', 'normal')
                    font_style = obj.get('fontStyle', 'normal')

                    # Scaling
                    scale_x = obj.get('scaleX', 1)
                    scale_y = obj.get('scaleY', 1)

                    # Rotation
                    angle = obj.get('angle', 0)

                    # Opacity
                    opacity = obj.get('opacity', 1)

                    # Text decoration
                    text_decoration = []
                    if obj.get('underline'):
                        text_decoration.append('underline')
                    if obj.get('linethrough'):
                        text_decoration.append('line-through')
                    text_decoration_str = ' '.join(text_decoration) if text_decoration else 'none'

                    # Text alignment
                    text_align = obj.get('textAlign', 'left')
                    text_anchor = {'left': 'start', 'center': 'middle', 'right': 'end'}.get(text_align, 'start')

                    # Stroke (outline)
                    stroke = obj.get('stroke', '')
                    stroke_width = obj.get('strokeWidth', 0)

                    # Line height and character spacing
                    line_height = obj.get('lineHeight', 1.16)
                    char_spacing = obj.get('charSpacing', 0)

                    # Build transform string
                    transforms = []
                    if left != 0 or top != 0:
                        transforms.append(f"translate({left}, {top})")
                    if angle != 0:
                        transforms.append(f"rotate({angle})")
                    if scale_x != 1 or scale_y != 1:
                        transforms.append(f"scale({scale_x}, {scale_y})")
                    transform_str = ' '.join(transforms)

                    # Escape text content for XML
                    import html
                    text_escaped = html.escape(text_content)

                    # ✅ FIX: Calculate proper SVG bounds to prevent text cut-off
                    # Estimate text width (approximate: fontSize * charCount * 0.6 for average chars)
                    estimated_text_width = font_size * len(text_content) * 0.6 * scale_x
                    estimated_text_height = font_size * line_height * scale_y

                    # Calculate bounds with padding for rotation and positioning
                    padding = 100  # Extra padding to ensure nothing is cut off
                    max_x = max(left + estimated_text_width + padding, 1200)
                    max_y = max(top + estimated_text_height + padding, 1200)

                    # Ensure minimum size and round up to nearest 100
                    svg_width = max(1200, int((max_x + 99) / 100) * 100)
                    svg_height = max(1200, int((max_y + 99) / 100) * 100)

                    # Create production-ready SVG with dynamic size to prevent cut-off
                    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family={font_family.replace(' ', '+')}');
    </style>
  </defs>
  <text
    x="0"
    y="0"
    font-family="{font_family}"
    font-size="{font_size}"
    font-weight="{font_weight}"
    font-style="{font_style}"
    fill="{fill_color}"
    opacity="{opacity}"
    text-anchor="{text_anchor}"
    text-decoration="{text_decoration_str}"
    stroke="{stroke}"
    stroke-width="{stroke_width}"
    letter-spacing="{char_spacing}"
    transform="{transform_str}">
    {text_escaped}
  </text>
</svg>'''

                    # Add to ZIP with metadata comment
                    filename_safe = re.sub(r'[^a-zA-Z0-9]', '_', text_content[:20]) if text_content else f"text_{text_count}"
                    svg_filename = f"texts/text_{text_count}_{filename_safe}.svg"
                    zip_file.writestr(svg_filename, svg_content)
                    files_added.append(svg_filename)

                    print(f"✅ Added {svg_filename}")
                    print(f"   Properties: position({left},{top}), angle({angle}°), scale({scale_x}x{scale_y}), opacity({opacity})")

                # Handle image elements
                elif obj_type == 'image':
                    image_count += 1

                    # ✅ Extract transformation properties from canvas
                    left = obj.get('left', 0)
                    top = obj.get('top', 0)
                    scale_x = obj.get('scaleX', 1)
                    scale_y = obj.get('scaleY', 1)
                    angle = obj.get('angle', 0)
                    opacity = obj.get('opacity', 1)
                    width = obj.get('width', 100)
                    height = obj.get('height', 100)

                    # ✅ FIX: Include BOTH original uploaded images AND preview images
                    # Get both savedImageUrl (original) and src (might be preview)
                    saved_image_url = obj.get('savedImageUrl', '')
                    src_url = obj.get('src', '')

                    print(f"\nProcessing image {image_count}:")
                    print(f"  savedImageUrl: {saved_image_url[:80] if saved_image_url else 'None'}...")
                    print(f"  src: {src_url[:80] if src_url else 'None'}...")
                    print(f"  Transformations: position({left},{top}), angle({angle}°), scale({scale_x}x{scale_y}), opacity({opacity})")

                    # Collect all valid image URLs
                    image_urls = []
                    if saved_image_url and not saved_image_url.startswith('blob:'):
                        image_urls.append(('original', saved_image_url))
                        print(f"  ✓ Will include original image")
                    if src_url and not src_url.startswith('blob:') and src_url != saved_image_url:
                        image_urls.append(('preview', src_url))
                        print(f"  ✓ Will include preview image (different from original)")
                    elif src_url == saved_image_url:
                        print(f"  ℹ️ src and savedImageUrl are the same - including only once")

                    if not image_urls:
                        print(f"⚠️ Skipping image {image_count}: no valid source URLs")
                        continue

                    print(f"  Total versions to add: {len(image_urls)}")

                    # ✅ NEW: Store image URL for transformed SVG generation
                    primary_image_url = saved_image_url or src_url

                    # Process each image URL (original and/or preview)
                    for img_type, image_url in image_urls:
                        try:
                            # Parse the URL to get the filename
                            parsed_url = urlparse(image_url)
                            path_parts = parsed_url.path.split('/')
                            original_filename = path_parts[-1] if path_parts else f'image_{image_count}.png'

                            # If it's a local file path
                            if 'images/' in image_url:
                                # Extract path after /images/
                                image_path = image_url.split('/images/', 1)[1]

                                # ✅ FIX: Try multiple possible locations for the image
                                # 1. app/static/ (where /images/ URLs are served from)
                                # 2. uploads/images/ (legacy location)
                                # 3. images/ (relative path)
                                possible_paths = [
                                    os.path.join('app', 'static', image_path),
                                    os.path.join('uploads', 'images', image_path),
                                    os.path.join('images', image_path)
                                ]

                                image_found = False
                                for full_path in possible_paths:
                                    print(f"  Looking for {img_type} image at: {full_path}")
                                    if os.path.exists(full_path):
                                        with open(full_path, 'rb') as img_file:
                                            # ✅ FIX: Add image_count to make each filename unique
                                            # This prevents overwriting when multiple images have same filename
                                            img_filename = f"images/{img_type}_{image_count}_{original_filename}"
                                            zip_file.writestr(img_filename, img_file.read())
                                            files_added.append(img_filename)
                                            print(f"  ✅ Added {img_filename}")
                                            image_found = True
                                            break

                                if not image_found:
                                    print(f"  ⚠️ WARNING: {img_type} image not found at any checked path")
                                    print(f"      URL was: {image_url}")

                        except Exception as e:
                            print(f"  ❌ ERROR processing {img_type} image {image_count}: {e}")

                    # ✅ NEW: Generate SVG with transformations to show image as user designed it
                    # This is critical for production - manufacturers need to see exactly how the image should be positioned/rotated/scaled
                    if primary_image_url:
                        try:
                            # Build transform string
                            transforms = []
                            if left != 0 or top != 0:
                                transforms.append(f"translate({left}, {top})")
                            if angle != 0:
                                transforms.append(f"rotate({angle})")
                            if scale_x != 1 or scale_y != 1:
                                transforms.append(f"scale({scale_x}, {scale_y})")
                            transform_str = ' '.join(transforms)

                            # Calculate SVG bounds to fit transformed image
                            transformed_width = width * scale_x
                            transformed_height = height * scale_y
                            padding = 100
                            svg_width = max(1200, int((left + transformed_width + padding + 99) / 100) * 100)
                            svg_height = max(1200, int((top + transformed_height + padding + 99) / 100) * 100)

                            # Create SVG with embedded/referenced image and transformations
                            # Note: Using href to reference the original image file in the ZIP
                            parsed_url = urlparse(primary_image_url)
                            path_parts = parsed_url.path.split('/')
                            original_filename = path_parts[-1] if path_parts else f'image_{image_count}.png'

                            # Reference the original image file that's already in the ZIP
                            image_ref = f"../images/original_{image_count}_{original_filename}"

                            svg_with_transforms = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{svg_width}" height="{svg_height}" viewBox="0 0 {svg_width} {svg_height}">
  <image
    href="{image_ref}"
    width="{width}"
    height="{height}"
    x="0"
    y="0"
    opacity="{opacity}"
    transform="{transform_str}"
    preserveAspectRatio="none"/>
  <text x="10" y="20" font-size="12" fill="#666" font-family="Arial">
    Transformations: Position({left:.1f}, {top:.1f}), Rotation({angle:.1f}°), Scale({scale_x:.2f}, {scale_y:.2f})
  </text>
</svg>'''

                            # Add transformed image SVG to ZIP
                            filename_safe = re.sub(r'[^a-zA-Z0-9]', '_', original_filename[:20])
                            transformed_svg_filename = f"images_transformed/image_{image_count}_{filename_safe}_TRANSFORMED.svg"
                            zip_file.writestr(transformed_svg_filename, svg_with_transforms)
                            files_added.append(transformed_svg_filename)

                            print(f"  ✅ Added transformed image SVG: {transformed_svg_filename}")
                            print(f"     Shows image with all transformations as user designed it")

                        except Exception as e:
                            print(f"  ❌ ERROR generating transformed image SVG: {e}")

            # ✅ FIX: Include preview images for each design area
            preview_count = 0
            if customization_options:
                print(f"\n{'='*60}")
                print("Adding preview images from customization options")
                print(f"{'='*60}")

                for option in customization_options:
                    # ✅ FIX: preview_image_url is stored in design_metadata JSON field
                    preview_url = None
                    if option.design_metadata and isinstance(option.design_metadata, dict):
                        preview_url = option.design_metadata.get('preview_image_url')

                    if preview_url and not preview_url.startswith('data:'):
                        preview_count += 1
                        # ✅ FIX: design_area is an Enum, extract value
                        design_area = option.design_area.value if hasattr(option.design_area, 'value') else str(option.design_area)
                        if not design_area:
                            design_area = 'unknown'

                        print(f"\nProcessing preview for {design_area}:")
                        print(f"  URL: {preview_url[:80]}...")

                        try:
                            # Parse the URL to get the filename
                            parsed_url = urlparse(preview_url)
                            path_parts = parsed_url.path.split('/')
                            original_filename = path_parts[-1] if path_parts else f'preview_{design_area}.png'

                            # If it's a local file path
                            if 'previews/' in preview_url or 'images/' in preview_url:
                                # Extract path - could be /previews/ or /images/
                                if 'previews/' in preview_url:
                                    image_path = preview_url.split('/previews/', 1)[1]
                                    possible_paths = [
                                        os.path.join('app', 'static', 'previews', image_path),
                                        os.path.join('uploads', 'previews', image_path),
                                        os.path.join('previews', image_path)
                                    ]
                                else:
                                    image_path = preview_url.split('/images/', 1)[1]
                                    possible_paths = [
                                        os.path.join('app', 'static', 'images', image_path),
                                        os.path.join('uploads', 'images', image_path),
                                        os.path.join('images', image_path)
                                    ]

                                image_found = False
                                for full_path in possible_paths:
                                    print(f"  Looking for preview at: {full_path}")
                                    if os.path.exists(full_path):
                                        with open(full_path, 'rb') as img_file:
                                            preview_filename = f"previews/{design_area}_preview_{original_filename}"
                                            zip_file.writestr(preview_filename, img_file.read())
                                            files_added.append(preview_filename)
                                            print(f"  ✅ Added {preview_filename}")
                                            image_found = True
                                            break

                                if not image_found:
                                    print(f"  ⚠️ WARNING: Preview image not found at any checked path")
                                    print(f"      URL was: {preview_url}")

                        except Exception as e:
                            print(f"  ❌ ERROR processing preview for {design_area}: {e}")

                print(f"\nTotal preview images added: {preview_count}")

            # Add manifest with design info
            manifest = {
                "order_id": order_id,
                "order_item_id": item_id,
                "product_id": order_item.product_id,
                "product_name": order_item.product_name,
                "text_elements": text_count,
                "image_elements": image_count,
                "preview_images": preview_count,
                "files_included": files_added
            }

            zip_file.writestr("manifest.json", json.dumps(manifest, indent=2))
            files_added.append("manifest.json")
            print("Added manifest.json")

            # Also add the full canvas JSON for reference (combined from all design areas)
            combined_canvas_data = {
                "version": "5.3.0",
                "objects": objects,
                "background": "#f3f4f6"
            }
            zip_file.writestr("canvas_data.json", json.dumps(combined_canvas_data, indent=2))
            files_added.append("canvas_data.json")
            print("Added canvas_data.json")

            print(f"Total files added to ZIP: {len(files_added)}")

        # Get the ZIP file bytes
        zip_bytes = zip_buffer.getvalue()
        zip_size = len(zip_bytes)
        print(f"ZIP file created successfully. Size: {zip_size} bytes")

        if zip_size == 0:
            raise HTTPException(
                status_code=500,
                detail="Generated ZIP file is empty"
            )

        filename = f"order_{order_id}_item_{item_id}_design_package.zip"

        # Use Response instead of StreamingResponse for simpler byte delivery
        from fastapi.responses import Response
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(zip_size)
            }
        )

    except Exception as e:
        print(f"ERROR creating ZIP package: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create design package: {str(e)}"
        )
