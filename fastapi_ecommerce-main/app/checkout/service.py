# checkout/service.py

from fastapi import HTTPException
from app.checkout.schemas import CheckoutRequest, CheckoutResponse, OrderSummary
from app.common.http import http_get, http_post, http_delete
from uuid import UUID
from typing import List
import os
import time
from datetime import datetime
import copy
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.products import models as product_models

# Replace with your real service URLs or use environment config
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8000/products")
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://localhost:8000/orders")
CART_SERVICE_URL = os.getenv("CART_SERVICE_URL", "http://localhost:8000/cart")
SHIPPING_SERVICE_URL = os.getenv("SHIPPING_SERVICE_URL", "http://localhost:8000/shipping")
DISCOUNT_SERVICE_URL = os.getenv("DISCOUNT_SERVICE_URL", "http://localhost:8000/discounts")

async def process_checkout(data: CheckoutRequest, db: AsyncSession) -> CheckoutResponse:
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = 0
    total_quantity = 0
    order_items = []
    total_discount_amount = 0.0
    items_with_discounts = 0
    discount_breakdown = []

    # Calculate product costs, discounts, and total quantity
    print(f"\n{'='*80}")
    print(f"🛒 CHECKOUT: Processing {len(data.items)} cart items")
    print(f"{'='*80}")

    for index, item in enumerate(data.items):
        print(f"\n📦 [ITEM {index + 1}/{len(data.items)}] Starting processing...")
        print(f"  - product_id: {item.product_id}")
        print(f"  - cart_item_id: {item.cart_item_id}")
        print(f"  - customization_option_id: {item.customization_option_id}")

        # Get product details
        product_url = f"{PRODUCT_SERVICE_URL}/{item.product_id}"
        try:
            product = await http_get(product_url)
        except Exception:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        if product["status"] != "active":
            raise HTTPException(status_code=400, detail=f"Product {product['name']} is not available")

        # Default to base product price
        unit_price = float(product["base_price"])

        # If variation_id is present, fetch and override price
        if item.variation_id:
            variation_url = f"{PRODUCT_SERVICE_URL}/variations/{item.variation_id}"
            try:
                variation = await http_get(variation_url)
                unit_price = float(variation["price"])  # override with variation price
            except Exception:
                raise HTTPException(status_code=404, detail=f"Variation {item.variation_id} not found for product {product['name']}")

        # Calculate discount for this product
        original_unit_price = unit_price
        discount_info = None
        final_unit_price = unit_price
        
        try:
            # Call discount service to calculate discount
            discount_calc_url = f"{DISCOUNT_SERVICE_URL}/calculate"
            discount_payload = {
                "product_id": item.product_id,
                "quantity": item.quantity
            }
            discount_response = await http_post(discount_calc_url, discount_payload)
            
            if discount_response.get("applicable", False):
                discount_info = discount_response
                discount_amount_per_unit = discount_response.get("discount_amount", 0)
                final_unit_price = original_unit_price - discount_amount_per_unit
                
                # Track discount statistics
                total_discount_amount += discount_amount_per_unit * item.quantity
                items_with_discounts += 1
                
                # Add to discount breakdown
                discount_breakdown.append({
                    "product_id": item.product_id,
                    "product_name": product["name"],
                    "quantity": item.quantity,
                    "original_unit_price": original_unit_price,
                    "discount_type": discount_response.get("discount_type"),
                    "discount_value": discount_response.get("discount_value"),
                    "discount_amount_per_unit": discount_amount_per_unit,
                    "total_discount": discount_amount_per_unit * item.quantity,
                    "rule_name": discount_response.get("rule_name"),
                    "rule_id": discount_response.get("rule_id")
                })
        except Exception:
            # Continue without discount if service fails
            pass

        price = final_unit_price * float(item.quantity)
        subtotal += price
        total_quantity += item.quantity

        # Extract preview image URLs and design data from customization details
        # ⚡ CRITICAL: Cart's customized_images is the source of truth (contains ALL views)
        # Only use preview_url from customization data as fallback if cart has no images
        customized_images = item.customized_images or []
        design_svg_data = None
        design_canvas_data = None
        design_elements = None
        order_specific_customization_id = item.customization_option_id  # Will be replaced with snapshot ID

        if item.customization_option_id:
            print(f"\n  🎨 [ITEM {index + 1}] Fetching customization data...")
            print(f"      customization_option_id: {item.customization_option_id}")
            try:
                # Fetch customization details to get preview image URL and design data
                customization_url = f"{PRODUCT_SERVICE_URL}/options/{item.customization_option_id}"
                print(f"      Fetching from URL: {customization_url}")
                customization_data = await http_get(customization_url)

                if customization_data:
                    print(f"  ✅ [ITEM {index + 1}] Customization data retrieved successfully")
                    print(f"      - user_id: {customization_data.get('user_id')}")
                    print(f"      - product_id: {customization_data.get('product_id')}")
                    print(f"      - design_area: {customization_data.get('design_area')}")
                    print(f"      - canvas_data exists: {customization_data.get('canvas_data') is not None}")
                    print(f"      - svg_data exists: {customization_data.get('svg_data') is not None}")
                    print(f"      - design_elements exists: {customization_data.get('design_elements') is not None}")

                    if customization_data.get('canvas_data'):
                        objects_count = len(customization_data.get('canvas_data', {}).get('objects', []))
                        print(f"      - canvas_data objects count: {objects_count}")
                    if customization_data.get('design_elements'):
                        elements_count = len(customization_data.get('design_elements', []))
                        print(f"      - design_elements count: {elements_count}")

                    # ⚡ FIX: Only use preview_url as fallback if cart has NO images
                    # Cart's customized_images array contains all views and is the source of truth
                    if customization_data.get("design_metadata") and not customized_images:
                        preview_url = customization_data["design_metadata"].get("preview_image_url")
                        if preview_url:
                            customized_images = [preview_url]

                    # Extract design data for print-ready files
                    # ⚡ CRITICAL FIX: Make deep copies to ensure independent snapshots
                    # This prevents any reference issues where multiple orders might point to the same object
                    print(f"\n  📋 [ITEM {index + 1}] Making deep copies of design data...")
                    design_svg_data = copy.deepcopy(customization_data.get("svg_data"))
                    design_canvas_data = copy.deepcopy(customization_data.get("canvas_data"))
                    design_elements = copy.deepcopy(customization_data.get("design_elements"))
                    print(f"  ✅ [ITEM {index + 1}] Deep copies created:")

                    # ⚡ CRITICAL FIX: Create a NEW customization_option record in database as snapshot
                    # This ensures each order has its own immutable customization_option_id
                    # Even if user edits the original design later, this snapshot remains unchanged

                    try:
                        # Add snapshot metadata
                        if design_canvas_data and isinstance(design_canvas_data, dict):
                            if 'metadata' not in design_canvas_data:
                                design_canvas_data['metadata'] = {}
                            design_canvas_data['metadata']['snapshotted_at'] = datetime.utcnow().isoformat()
                            design_canvas_data['metadata']['snapshot_for_order'] = f"checkout_{int(time.time())}"
                            design_canvas_data['metadata']['original_customization_id'] = item.customization_option_id
                            design_canvas_data['metadata']['is_order_snapshot'] = True

                        # Create permanent snapshot in database
                        snapshot_option = product_models.CustomizationOption(
                            user_id=customization_data.get("user_id"),
                            product_id=customization_data.get("product_id"),
                            variation_id=customization_data.get("variation_id"),
                            design_area=customization_data.get("design_area"),
                            client_reference_id=f"order_snapshot_{item.customization_option_id}_{int(time.time())}",
                            canvas_data=design_canvas_data,
                            svg_data=design_svg_data,
                            design_metadata=customization_data.get("design_metadata", {}),
                            design_elements=design_elements,
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow()
                        )

                        db.add(snapshot_option)
                        await db.flush()  # Flush to get the ID without committing

                        # Use the new snapshot ID for this order
                        order_specific_customization_id = snapshot_option.id
                        print(f"  ✅ [ITEM {index + 1}] Snapshot created: {item.customization_option_id} → {order_specific_customization_id}")
                        print(f"      Snapshot contains {len(design_canvas_data.get('objects', []))} objects" if design_canvas_data else "      No canvas data in snapshot")

                    except Exception as snapshot_error:
                        print(f"⚠️ Snapshot creation failed: {snapshot_error}")
                        # Continue with original ID if snapshot creation fails

                else:
                    print("⚠️ No customization data received")

            except Exception as e:
                print(f"⚠️ Failed to fetch customization: {e}")
                # Continue with existing customized_images

        # Prepare order item with discount information - matches OrderItemCreate schema
        order_item = {
            "product_id": item.product_id,
            "product_name": product["name"],
            "variation_id": item.variation_id,
            "quantity": item.quantity,
            "customization_option_id": order_specific_customization_id,  # ⚡ Use snapshot ID
            "customized_images": customized_images,
            "unit_price": final_unit_price,
            "shipping_method_id": data.shipping_method_id,
            # Include design data for print-ready files (snapshot at order time)
            "design_svg_data": design_svg_data,
            "design_canvas_data": design_canvas_data,
            "design_elements": design_elements
        }

        print(f"\n  📝 [ITEM {index + 1}] Order item created:")
        print(f"      - product_name: {product['name']}")
        print(f"      - customization_option_id: {order_specific_customization_id}")
        print(f"      - customized_images count: {len(customized_images) if customized_images else 0}")
        print(f"      - design_svg_data: {'YES' if design_svg_data else 'NO'}")
        print(f"      - design_canvas_data: {'YES' if design_canvas_data else 'NO'}")
        print(f"      - design_canvas_data objects: {len(design_canvas_data.get('objects', [])) if design_canvas_data else 0}")
        print(f"      - design_elements: {'YES' if design_elements else 'NO'}")
        
        # Add discount fields if discount was applied
        if discount_info:
            order_item.update({
                "discount_rule_id": discount_info.get("rule_id"),
                "original_unit_price": original_unit_price,
                "discount_percentage": discount_info.get("discount_value") if discount_info.get("discount_type") == "percentage" else None,
                "discount_amount": discount_info.get("discount_amount"),
                "discount_type": discount_info.get("discount_type")
            })
        
        order_items.append(order_item)

    # Calculate shipping cost if shipping method is provided
    shipping_cost = 0.0
    shipping_method_name = None
    estimated_delivery_days = None
    shipping_cost_breakdown = None

    if data.shipping_method_id:
        try:
            # Get shipping method details
            shipping_method_url = f"{SHIPPING_SERVICE_URL}/methods/{data.shipping_method_id}"
            shipping_method = await http_get(shipping_method_url)
            shipping_method_name = shipping_method.get("name")
            estimated_delivery_days = shipping_method.get("delivery_days")

            # Use product-specific shipping calculation (handles both product-specific and universal rules)
            shipping_calc_url = f"{SHIPPING_SERVICE_URL}/calculate-product-cost"
            shipping_calc_payload = {
                "shipping_method_id": data.shipping_method_id,
                "items": [
                    {"product_id": item.product_id, "quantity": item.quantity}
                    for item in data.items
                ]
            }
            shipping_calc_response = await http_post(shipping_calc_url, shipping_calc_payload)
            
            shipping_cost = shipping_calc_response.get("total_cost", 0.0)
            shipping_cost_breakdown = {
                "total_cost": shipping_cost,
                "product_breakdown": shipping_calc_response.get("product_breakdown", []),
                "delivery_days": shipping_calc_response.get("delivery_days")
            }

        except Exception:
            # Fall back to base shipping cost if calculation service is unavailable
            try:
                shipping_method_url = f"{SHIPPING_SERVICE_URL}/methods/{data.shipping_method_id}"
                shipping_method = await http_get(shipping_method_url)
                shipping_cost = shipping_method.get("cost", 0.0)
                shipping_method_name = shipping_method.get("name")
                estimated_delivery_days = shipping_method.get("delivery_days")
                shipping_cost_breakdown = {
                    "base_cost": shipping_cost,
                    "fallback_used": True,
                    "error": "Product-specific calculation service unavailable"
                }
            except Exception:
                pass  # Use default 0.0 shipping cost

    # Calculate final total
    total_price = subtotal + shipping_cost

    # Create order via HTTP
    try:
        order_payload = {
            "user_id": int(data.user_id) if data.user_id else None,
            "guest_id": data.guest_id,
            "items": order_items,
            "subtotal": subtotal,
            "shipping_cost": shipping_cost,
            "total_price": total_price,
            "shipping_method_id": data.shipping_method_id,
            "estimated_delivery_days": estimated_delivery_days,
            "shipping_cost_breakdown": shipping_cost_breakdown,
            "payment_method_id": data.payment_method_id,
            "shipping_address_id": data.shipping_address_id
        }

        order = await http_post(f"{ORDER_SERVICE_URL}/", order_payload)

        # Commit the database session to save all snapshot customization_options
        await db.commit()

    except Exception as e:
        # Rollback database changes if order creation fails
        await db.rollback()
        print(f"⚠️ Rolled back database changes due to order creation failure")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

    # Remove only the ordered cart items (selective deletion)
    try:
        headers = {}
        if data.guest_id:
            headers["guest_id"] = data.guest_id

        cart_item_ids = [item.cart_item_id for item in data.items]
        await http_delete(f"{CART_SERVICE_URL}/delete/bulk", data={"item_ids": cart_item_ids}, headers=headers)
    except Exception:
        pass  # Silent fail - cart cleanup is not critical

    # Create order summary
    order_summary = OrderSummary(
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=total_price,
        estimated_delivery_days=estimated_delivery_days,
        shipping_method_name=shipping_method_name,
        shipping_cost_breakdown=shipping_cost_breakdown,
        total_discount_amount=total_discount_amount,
        items_with_discounts=items_with_discounts,
        discount_breakdown=discount_breakdown if discount_breakdown else None
    )

    return CheckoutResponse(
        order_id=str(order["id"]),
        message="Order placed successfully",
        order_summary=order_summary
    )
