# Migration Fix Instructions

## Problem
The alembic migration system is showing error: `Can't locate revision identified by 'f1g2h3i4j5k6'`

This happens because the database's `alembic_version` table has an invalid revision ID that doesn't exist in any migration file.

## Solution Options

### Option 1: Fix via MySQL Client (RECOMMENDED)

1. **Fix the alembic_version table:**
```bash
mysql -u niloy -pniloy940 -h localhost -P 3306 fastapi_ecommerce < fix_alembic_version.sql
```

2. **Manually add the design columns:**
```bash
mysql -u niloy -pniloy940 -h localhost -P 3306 fastapi_ecommerce < add_design_columns_to_cart.sql
```

3. **Update alembic_version to reflect the new migration:**
```bash
mysql -u niloy -pniloy940 -h localhost -P 3306 fastapi_ecommerce -e "UPDATE alembic_version SET version_num = 'd8e9f0a1b2c3';"
```

### Option 2: Fix via Python Script

1. **Run the fix script:**
```bash
python fix_alembic_version.py
```

2. **Run alembic upgrade:**
```bash
python -m alembic upgrade head
```

### Option 3: Manual Database Update (via any MySQL client)

Connect to your MySQL database and run these commands:

```sql
-- 1. Fix alembic_version
USE fastapi_ecommerce;
UPDATE alembic_version SET version_num = 'a1b2c3d4e5f6';

-- 2. Add the design columns to cart_items
ALTER TABLE cart_items ADD COLUMN design_canvas_data JSON NULL;
ALTER TABLE cart_items ADD COLUMN design_svg_data TEXT NULL;
ALTER TABLE cart_items ADD COLUMN design_elements JSON NULL;

-- 3. Update alembic_version to the new migration
UPDATE alembic_version SET version_num = 'd8e9f0a1b2c3';
```

## Verification

After applying the fix, verify the columns exist:

```sql
USE fastapi_ecommerce;
DESCRIBE cart_items;
```

You should see three new columns:
- `design_canvas_data` (JSON)
- `design_svg_data` (TEXT)
- `design_elements` (JSON)

## Testing the Fix

1. **Clear existing cart items** (they don't have design data):
```sql
DELETE FROM cart_items WHERE design_canvas_data IS NULL;
```

2. **Test the flow:**
   - Go to a product design page
   - Add some design elements (text, images, etc.)
   - Add to cart
   - Go to checkout
   - Complete the order
   - Check admin panel for ZIP download
   - ZIP should contain all design elements

## Files Created

- `fix_alembic_version.sql` - SQL script to fix alembic_version table
- `add_design_columns_to_cart.sql` - SQL script to add columns manually
- `fix_alembic_version.py` - Python script to fix alembic_version (requires dependencies)
- `alembic/versions/d8e9f0a1b2c3_add_design_data_to_cart_items.py` - New migration file

## What This Fixes

The root cause of the bug was that design data was not being saved to the cart when items were added. This meant:

1. When checking out, the system tried to fetch design data from `customization_options` using `client_reference_id`
2. Multiple orders with the same product/variation shared the same `client_reference_id`
3. The system would fetch ALL design areas with that ID, resulting in mixed data from different orders
4. ZIP downloads would get wrong elements (only front view, or mixed elements)

**The solution:** Save design data to cart (snapshot) when adding items, just like preview images. This ensures each cart item has its own immutable design data that flows through to the order and ZIP download.

## Next Steps After Migration

1. Test with a fresh cart item
2. Verify checkout logs show design_canvas_data: True
3. Verify order is created with design data
4. Verify ZIP download contains correct elements
5. Test with multiple orders of the same product
