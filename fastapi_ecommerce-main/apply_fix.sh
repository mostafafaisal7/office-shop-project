#!/bin/bash

# Migration Fix Script
# This script applies the database migration fix for design data columns

echo "============================================================"
echo "Migration Fix Script for Design Data Columns"
echo "============================================================"

DB_HOST="localhost"
DB_PORT="3306"
DB_USER="niloy"
DB_PASS="niloy940"
DB_NAME="fastapi_ecommerce"

# Check if mysql command is available
if ! command -v mysql &> /dev/null; then
    echo ""
    echo "❌ MySQL client not found!"
    echo ""
    echo "Please apply the fix manually using one of these methods:"
    echo ""
    echo "1. Using MySQL Workbench or phpMyAdmin:"
    echo "   - Open the database: $DB_NAME"
    echo "   - Execute the SQL from: add_design_columns_to_cart.sql"
    echo ""
    echo "2. If you have mysql command available elsewhere:"
    echo "   mysql -u $DB_USER -p$DB_PASS -h $DB_HOST -P $DB_PORT $DB_NAME < add_design_columns_to_cart.sql"
    echo ""
    echo "3. Connect to MySQL and run these commands:"
    echo "   USE $DB_NAME;"
    echo "   UPDATE alembic_version SET version_num = 'a1b2c3d4e5f6';"
    echo "   ALTER TABLE cart_items ADD COLUMN design_canvas_data JSON NULL;"
    echo "   ALTER TABLE cart_items ADD COLUMN design_svg_data TEXT NULL;"
    echo "   ALTER TABLE cart_items ADD COLUMN design_elements JSON NULL;"
    echo "   UPDATE alembic_version SET version_num = 'd8e9f0a1b2c3';"
    echo ""
    exit 1
fi

echo ""
echo "Step 1: Fixing alembic_version table..."
mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < fix_alembic_version.sql
if [ $? -eq 0 ]; then
    echo "✅ alembic_version fixed"
else
    echo "⚠️  Error fixing alembic_version, but continuing..."
fi

echo ""
echo "Step 2: Adding design columns to cart_items..."
mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" < add_design_columns_to_cart.sql
if [ $? -eq 0 ]; then
    echo "✅ Design columns added"
else
    echo "❌ Error adding columns"
    exit 1
fi

echo ""
echo "Step 3: Updating alembic_version to new migration..."
mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" -e "UPDATE alembic_version SET version_num = 'd8e9f0a1b2c3';"
if [ $? -eq 0 ]; then
    echo "✅ alembic_version updated to d8e9f0a1b2c3"
else
    echo "⚠️  Error updating alembic_version"
fi

echo ""
echo "Step 4: Verifying columns..."
mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" -e "
SELECT
    COLUMN_NAME,
    COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = '$DB_NAME'
  AND TABLE_NAME = 'cart_items'
  AND COLUMN_NAME IN ('design_canvas_data', 'design_svg_data', 'design_elements')
ORDER BY COLUMN_NAME;
"

echo ""
echo "============================================================"
echo "✅ Migration fix completed!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Clear old cart items (they don't have design data):"
echo "   mysql -u $DB_USER -p$DB_PASS $DB_NAME -e \"DELETE FROM cart_items WHERE design_canvas_data IS NULL;\""
echo ""
echo "2. Test the flow:"
echo "   - Add a designed product to cart"
echo "   - Complete checkout"
echo "   - Verify ZIP download has all design elements"
echo ""
echo "3. Test with multiple orders of the same product"
echo "============================================================"
