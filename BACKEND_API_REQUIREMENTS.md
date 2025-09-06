# Backend API Requirements for Design Preview Images

## Overview

The frontend now saves design preview images when users click "Next" in the design system. The backend needs a new API endpoint to handle preview image uploads and modify existing customization options to include preview image URLs.

## Required Backend Changes

### 1. New API Endpoint: Preview Image Upload

**Endpoint:** `POST /products/users/me/preview-upload`

**Purpose:** Accept uploaded preview images and store them with a publicly accessible URL

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Authentication:** Required (Bearer token)
- **Body Parameters:**
  - `file`: File (PNG image blob)
  - `product_id`: String
  - `variation_id`: String  
  - `design_area`: String (e.g., "front", "back", "left", "right")

**Response:**
```json
{
  "success": true,
  "file_url": "https://yourdomain.com/uploads/previews/preview_123_456_front_1634567890.png",
  "message": "Preview image uploaded successfully"
}
```

**Implementation Notes:**
- Store files in `/uploads/previews/` directory
- Use filename format: `preview_{product_id}_{variation_id}_{design_area}_{timestamp}.png`
- Ensure uploaded directory is publicly accessible via web server
- Validate file type (PNG only)
- Limit file size (e.g., 5MB max)

### 2. Update Customization Options Model

**Modify the existing customization options to include preview image URL in metadata:**

**Database Schema Update:**
```python
# In the design_metadata JSON field, add:
design_metadata = {
    "canvas_width": 800,
    "canvas_height": 600, 
    "product_image_url": "...",
    "design_name": "...",
    "is_completed": False,
    "preview_image_url": "https://yourdomain.com/uploads/previews/preview_123_456_front_1634567890.png"  # NEW FIELD
}
```

### 3. Update Cart API Response

**Modify `GET /cart/with-customizations` to include preview images:**

The response should already include `customization_details` with `design_metadata`. Ensure the `preview_image_url` field is included:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 123,
        "product_name": "T-Shirt",
        "customization_id": 456,
        "customization_details": {
          "design_metadata": {
            "preview_image_url": "https://yourdomain.com/uploads/previews/preview_123_456_front_1634567890.png"
          }
        }
      }
    ]
  }
}
```

### 4. Update Order API Response

**Ensure order items include customized_images with preview URLs:**

```json
{
  "order_items": [
    {
      "product_name": "T-Shirt",
      "customized_images": [
        "https://yourdomain.com/uploads/previews/preview_123_456_front_1634567890.png"
      ]
    }
  ]
}
```

## Frontend Changes Already Implemented

✅ **Design System:** Now generates and saves preview images when user clicks "Next"  
✅ **Cart Store:** Updated to use `getCartWithCustomizations()` API and extract preview images  
✅ **Cart Page:** Dynamic image logic prioritizes custom design previews  
✅ **Order Pages:** Enhanced image display with fallback logic  
✅ **Image Utilities:** Helper functions for consistent image handling  

## Testing Checklist

After implementing the backend changes:

1. **Design Flow:**
   - [ ] Create a design in `/products/[id]/design`
   - [ ] Click "Next" → Preview images should be generated and uploaded
   - [ ] Continue to cart → Design preview should display in cart

2. **Cart Flow:**
   - [ ] Cart items with customizations should show preview images
   - [ ] Fallback to variation/product images for non-customized items

3. **Order Flow:**
   - [ ] Completed orders should display custom design previews
   - [ ] Admin order details should show preview images
   - [ ] Customer order history should show preview images

## Current API Integration

The frontend expects these exact API patterns:

**For Design Saving:**
- Uses existing `/products/users/me/options` endpoints
- Now includes `preview_image_url` in `design_metadata`

**For Cart Loading:**
- Uses `/cart/with-customizations` endpoint
- Expects `customization_details.design_metadata.preview_image_url`

**For Image Upload:**
- Calls new `/products/users/me/preview-upload` endpoint
- Expects `{ file_url: "..." }` or `{ url: "..." }` in response

## File Structure

After implementation, your file structure should include:

```
fastapi_ecommerce-main/
├── app/
│   ├── products/
│   │   └── router.py (add preview upload endpoint)
│   ├── uploads/
│   │   └── previews/ (new directory for preview images)
└── static/ (ensure this serves the uploads directory)
```

## Security Considerations

- Validate file types and sizes
- Sanitize filenames 
- Implement rate limiting for uploads
- Ensure uploaded images are scanned for malware
- Use authenticated endpoints only
- Consider image optimization/compression