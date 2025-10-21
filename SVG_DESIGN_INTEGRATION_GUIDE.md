# SVG Design Export Integration Guide

This guide explains how to complete the integration of SVG design export for print-ready customizations.

## Feature Overview

**What this enables:**
- Admins can download customer designs as SVG files for professional printing
- Design text and elements are preserved in print-ready vector format
- Order details page shows design information and download buttons

## What Has Been Implemented

### ✅ Backend (FastAPI)

**Database Models** (`app/products/models.py`, `app/orders/models.py`):
- Added `svg_data` field to `CustomizationOption` model
- Added `design_svg_data`, `design_canvas_data`, `design_elements` to `OrderItem` model

**Database Migration** (`alembic/versions/a1b2c3d4e5f6_add_svg_data_fields_for_designs.py`):
- Migration ready to run: `alembic upgrade head`

**API Schemas** (`app/products/schemas.py`, `app/orders/schemas.py`):
- All customization and order schemas updated with design fields

**Checkout Service** (`app/checkout/service.py`):
- Automatically captures SVG, canvas data, and design elements when creating orders

**Download Endpoint** (`app/orders/router.py`):
- `GET /orders/{order_id}/items/{item_id}/download-svg` (admin only)
- Downloads SVG file for printing

### ✅ Customer Frontend (Next.js)

**SVG Export Utility** (`src/utils/svgExport.ts`):
- `generateCanvasSVG()` - Generate SVG from Fabric.js canvas
- `generateCanvasSVGWithMetadata()` - SVG with design metadata
- `extractCanvasTextElements()` - Extract text for display

**Design Store** (`src/store/designStore.ts`):
- Updated to accept and pass `svgData` parameter
- All save functions support SVG data

**Design API** (`src/services/designApi.ts`):
- Updated to send `svg_data` to backend

### ✅ Admin Frontend (Next.js)

**Order Details Page** (`src/app/dashboard/orders/[id]/page.tsx`):
- New "Design" column shows:
  - "Custom Design" tag
  - Text element count
  - "Download SVG" button (when SVG data available)

## Integration Steps

### Step 1: Run Database Migration

```bash
cd fastapi_ecommerce-main
alembic upgrade head
```

### Step 2: Integrate with DesignCanvas Component

Add SVG generation when saving designs in your DesignCanvas component:

**File**: `frontend/customized_product_ecommerce-main/src/components/design/DesignCanvas.tsx`

```typescript
// Add this import at the top
import { generateCanvasSVGWithMetadata } from '@/utils/svgExport';

// In your save design function (find where designStore.saveDesign is called)
const handleSaveDesign = async () => {
  if (!canvas) return;

  // Existing code
  const canvasData = canvas.toJSON();
  const previewImageUrl = await generatePreviewImage();

  // ⭐ NEW: Generate SVG from canvas
  const svgData = generateCanvasSVGWithMetadata(canvas, {
    designArea: designStore.currentDesignArea,
    productId: designStore.productId || undefined,
    variationId: designStore.selectedVariation?.variationId,
    createdAt: new Date().toISOString()
  });

  // Save with SVG data
  await designStore.saveDesign(
    canvasData,
    productImageUrl,
    previewImageUrl,
    svgData  // ⭐ Pass SVG here
  );
};
```

### Step 3: Test End-to-End

**As Customer:**
1. Create a design with text/images
2. Save the design
3. Add to cart and checkout

**As Admin:**
1. Go to Orders → [Order ID]
2. See "Design" column with text count
3. Click "Download SVG"
4. Open SVG in vector editor (Inkscape, Illustrator) to verify

## API Endpoints

### Save Design with SVG
```
POST /products/users/me/options
PUT /products/users/me/options/{id}

Body:
{
  "user_id": 1,
  "product_id": 123,
  "variation_id": 456,
  "design_area": "front",
  "canvas_data": { ... },
  "svg_data": "<svg>...</svg>",  // ⭐ New field
  "design_metadata": { ... },
  "design_elements": [ ... ]
}
```

### Download SVG (Admin Only)
```
GET /orders/{order_id}/items/{item_id}/download-svg
Authorization: Bearer {admin_token}

Response: SVG file download
```

## Database Schema

### Tables Updated

**customization_options**:
```sql
ALTER TABLE customization_options ADD COLUMN svg_data TEXT NULL;
```

**order_items**:
```sql
ALTER TABLE order_items ADD COLUMN design_svg_data TEXT NULL;
ALTER TABLE order_items ADD COLUMN design_canvas_data JSON NULL;
ALTER TABLE order_items ADD COLUMN design_elements JSON NULL;
```

## Troubleshooting

### SVG Not Generating

**Problem**: SVG data is null

**Solutions**:
1. Verify canvas instance exists
2. Check SVG generation: `canvas.toSVG()`
3. Ensure `generateCanvasSVG()` is called before `saveDesign()`

### Download Button Not Showing

**Problem**: Button doesn't appear in admin

**Solutions**:
1. Check if `design_svg_data` is in order item
2. Verify checkout service is fetching customization data
3. Check browser console for errors

### SVG File Empty

**Problem**: Downloaded SVG is empty or broken

**Solutions**:
1. Verify SVG data in database
2. Check if canvas has objects before generating
3. Test locally: `canvas.toSVG()`

## Files Modified

### Backend
- ✅ `app/products/models.py`
- ✅ `app/orders/models.py`
- ✅ `app/products/schemas.py`
- ✅ `app/orders/schemas.py`
- ✅ `app/checkout/service.py`
- ✅ `app/orders/router.py`
- ✅ `alembic/versions/a1b2c3d4e5f6_*.py`

### Customer Frontend
- ✅ `src/utils/svgExport.ts` (NEW)
- ✅ `src/store/designStore.ts`
- ✅ `src/services/designApi.ts`
- ⚠️ `src/components/design/DesignCanvas.tsx` (NEEDS INTEGRATION)

### Admin Frontend
- ✅ `src/app/dashboard/orders/[id]/page.tsx`

## Next Steps

1. Run `alembic upgrade head` to apply database changes
2. Integrate SVG generation in DesignCanvas component
3. Test the complete flow
4. Deploy to production

---

**Branch**: canvus-5.1
**Last Updated**: 2025-10-21
