-- Manually add design data columns to cart_items table
-- This is a backup approach if the alembic migration system has issues

USE fastapi_ecommerce;

-- Check if columns already exist before adding them
SET @db_name = DATABASE();

-- Add design_canvas_data column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @db_name
AND TABLE_NAME = 'cart_items'
AND COLUMN_NAME = 'design_canvas_data';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE cart_items ADD COLUMN design_canvas_data JSON NULL',
    'SELECT "Column design_canvas_data already exists" as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add design_svg_data column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @db_name
AND TABLE_NAME = 'cart_items'
AND COLUMN_NAME = 'design_svg_data';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE cart_items ADD COLUMN design_svg_data TEXT NULL',
    'SELECT "Column design_svg_data already exists" as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add design_elements column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @db_name
AND TABLE_NAME = 'cart_items'
AND COLUMN_NAME = 'design_elements';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE cart_items ADD COLUMN design_elements JSON NULL',
    'SELECT "Column design_elements already exists" as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the columns were added
SELECT
    'Verification - cart_items columns:' as info,
    GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ', ') as columns
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @db_name
AND TABLE_NAME = 'cart_items'
AND COLUMN_NAME IN ('design_canvas_data', 'design_svg_data', 'design_elements');
