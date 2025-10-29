# checkout/service.py

from fastapi import HTTPException
from app.checkout.schemas import CheckoutRequest, CheckoutResponse, OrderSummary
from app.common.http import http_get, http_post, http_delete
from uuid import UUID
from typing import List
import os

# Replace with your real service URLs or use environment config
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8000/products")
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://localhost:8000/orders")
CART_SERVICE_URL = os.getenv("CART_SERVICE_URL", "http://localhost:8000/cart")
SHIPPING_SERVICE_URL = os.getenv("SHIPPING_SERVICE_URL", "http://localhost:8000/shipping")
DISCOUNT_SERVICE_URL = os.getenv("DISCOUNT_SERVICE_URL", "http://localhost:8000/discounts")

async def process_checkout(data: CheckoutRequest) -> CheckoutResponse:
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = 0
    total_quantity = 0
    order_items = []
    total_discount_amount = 0.0
    items_with_discounts = 0
    discount_breakdown = []

    # Calculate product costs, discounts, and total quantity
    for index, item in enumerate(data.items):
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
        except Exception as e:
            print(f"Discount calculation failed for product {item.product_id}: {e}")
            # Continue without discount if service fails

        price = final_unit_price * float(item.quantity)
        subtotal += price
        total_quantity += item.quantity

        # Extract preview image URLs and design data from customization details
        customized_images = item.customized_images or []
        design_svg_data = None
        design_canvas_data = None
        design_elements = None

        print(f"\n=== DEBUG CHECKOUT Item {index} ===")
        print(f"customization_option_id: {item.customization_option_id}")

        if item.customization_option_id:
            try:
                # Fetch customization details to get preview image URL and design data
                customization_url = f"{PRODUCT_SERVICE_URL}/options/{item.customization_option_id}"
                print(f"Fetching customization from: {customization_url}")
                customization_data = await http_get(customization_url)

                print(f"Customization data received: {customization_data is not None}")
                if customization_data:
                    print(f"Customization keys: {list(customization_data.keys())}")

                    # Extract preview image URL
                    if customization_data.get("design_metadata"):
                        preview_url = customization_data["design_metadata"].get("preview_image_url")
                        if preview_url and preview_url not in customized_images:
                            customized_images.append(preview_url)
                            print(f"Added preview image URL to order item: {preview_url}")

                    # ✅ NEW: Fetch ALL design areas for this product/variation
                    # Just like customized_images captures all preview images,
                    # we need to capture all design areas' canvas data
                    client_reference_id = customization_data.get("client_reference_id")

                    if client_reference_id:
                        print(f"Found client_reference_id: {client_reference_id}")
                        print(f"Fetching ALL design areas with this client_reference_id...")

                        # Fetch all customization options with the same client_reference_id
                        all_areas_url = f"{PRODUCT_SERVICE_URL}/options?client_reference_id={client_reference_id}"
                        all_areas_data = await http_get(all_areas_url)

                        if all_areas_data and isinstance(all_areas_data, list):
                            print(f"Found {len(all_areas_data)} design areas")

                            # Combine canvas objects from all design areas
                            combined_objects = []
                            combined_elements = []
                            combined_svg_parts = []

                            for area_data in all_areas_data:
                                area_name = area_data.get("design_area", "unknown")
                                print(f"  - Processing area: {area_name}")

                                # Collect canvas objects from this area
                                if area_data.get("canvas_data") and area_data["canvas_data"].get("objects"):
                                    area_objects = area_data["canvas_data"]["objects"]
                                    combined_objects.extend(area_objects)
                                    print(f"    Added {len(area_objects)} canvas objects from {area_name}")

                                # Collect design elements from this area
                                if area_data.get("design_elements"):
                                    combined_elements.extend(area_data["design_elements"])
                                    print(f"    Added {len(area_data['design_elements'])} design elements from {area_name}")

                                # Collect SVG data from this area
                                if area_data.get("svg_data"):
                                    combined_svg_parts.append(f"<!-- {area_name.upper()} VIEW -->\n{area_data['svg_data']}")

                            # Create combined canvas data with all objects from all areas
                            design_canvas_data = {
                                "version": "5.3.0",
                                "objects": combined_objects,
                                "background": customization_data.get("canvas_data", {}).get("background", "#f3f4f6")
                            }

                            # Combine design elements
                            design_elements = combined_elements if combined_elements else None

                            # Combine SVG data (separated by area comments)
                            design_svg_data = "\n\n".join(combined_svg_parts) if combined_svg_parts else None

                            print(f"✅ COMBINED DATA:")
                            print(f"   Total canvas objects: {len(combined_objects)}")
                            print(f"   Total design elements: {len(combined_elements)}")
                            print(f"   SVG parts: {len(combined_svg_parts)}")
                        else:
                            print("⚠️ Could not fetch all areas, using single option data")
                            # Fallback to single option data
                            design_svg_data = customization_data.get("svg_data")
                            design_canvas_data = customization_data.get("canvas_data")
                            design_elements = customization_data.get("design_elements")
                    else:
                        print("⚠️ No client_reference_id found, using single option data")
                        # Fallback to single option data
                        design_svg_data = customization_data.get("svg_data")
                        design_canvas_data = customization_data.get("canvas_data")
                        design_elements = customization_data.get("design_elements")

                    print(f"design_svg_data exists: {design_svg_data is not None}")
                    print(f"design_canvas_data exists: {design_canvas_data is not None}")
                    print(f"design_elements exists: {design_elements is not None}")

                    if design_svg_data:
                        print(f"Captured SVG data for order item (length: {len(design_svg_data)} characters)")
                    if design_canvas_data:
                        print(f"Captured canvas data with {len(design_canvas_data.get('objects', []))} objects")
                    if design_elements:
                        print(f"Captured {len(design_elements)} design elements for order item")
                else:
                    print("WARNING: customization_data is None or empty!")

            except Exception as e:
                print(f"ERROR: Failed to fetch customization details for option {item.customization_option_id}: {e}")
                import traceback
                traceback.print_exc()
                # Continue with existing customized_images
        else:
            print("No customization_option_id - skipping design data fetch")

        print(f"Final values being set:")
        print(f"  - design_svg_data: {design_svg_data is not None}")
        print(f"  - design_canvas_data: {design_canvas_data is not None}")
        print(f"  - design_elements: {design_elements is not None}")
        print(f"=== END DEBUG CHECKOUT ===\n")

        # Prepare order item with discount information - matches OrderItemCreate schema
        order_item = {
            "product_id": item.product_id,
            "product_name": product["name"],
            "variation_id": item.variation_id,
            "quantity": item.quantity,
            "customization_option_id": item.customization_option_id,
            "customized_images": customized_images,
            "unit_price": final_unit_price,
            "shipping_method_id": data.shipping_method_id,
            # Include design data for print-ready files
            "design_svg_data": design_svg_data,
            "design_canvas_data": design_canvas_data,
            "design_elements": design_elements
        }
        
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

        except Exception as e:
            print(f"Product-specific shipping calculation failed: {e}")
            # Only fall back to base shipping cost if calculation service is completely unavailable
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
                print("Failed to get base shipping cost, using 0.0")

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
        
        # Debug logging to see what we're sending
        print("=== DEBUG: Order payload being sent to orders service ===")
        import json
        print(json.dumps(order_payload, indent=2, default=str))
        print("=== END DEBUG ===")
        
        order = await http_post(f"{ORDER_SERVICE_URL}/", order_payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

    # Remove only the ordered cart items (selective deletion)
    try:
        headers = {}
        if data.guest_id:
            headers["guest_id"] = data.guest_id
        
        cart_item_ids = [item.cart_item_id for item in data.items]
        await http_delete(f"{CART_SERVICE_URL}/delete/bulk", data={"item_ids": cart_item_ids}, headers=headers)
    except Exception as e:
        print("Cart item deletion failed:", e)  # Optional: Log it

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
