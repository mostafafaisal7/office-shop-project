-- Diagnostic SQL queries to check design snapshot system
-- Run these queries in your MySQL client

-- ============================================================================
-- Query 1: Check recent customization options and identify snapshots
-- ============================================================================
SELECT
    id,
    user_id,
    product_id,
    design_area,
    JSON_EXTRACT(design_metadata, '$.is_snapshot') as is_snapshot,
    JSON_EXTRACT(design_metadata, '$.source_customization_id') as source_id,
    JSON_EXTRACT(canvas_data, '$.objects[0].text') as first_text,
    created_at,
    updated_at
FROM customization_options
WHERE user_id = 66
ORDER BY id DESC
LIMIT 20;

-- ============================================================================
-- Query 2: Count snapshots vs live customizations
-- ============================================================================
SELECT
    CASE
        WHEN JSON_EXTRACT(design_metadata, '$.is_snapshot') = true THEN 'Snapshot'
        ELSE 'Live'
    END as type,
    COUNT(*) as count
FROM customization_options
WHERE user_id = 66
GROUP BY JSON_EXTRACT(design_metadata, '$.is_snapshot');

-- ============================================================================
-- Query 3: Check recent orders and their customization types
-- ============================================================================
SELECT
    oi.id as item_id,
    SUBSTRING(oi.order_id, 1, 20) as order_id,
    oi.customization_option_id,
    CASE
        WHEN JSON_EXTRACT(co.design_metadata, '$.is_snapshot') = true THEN 'YES'
        ELSE 'NO'
    END as is_snapshot,
    JSON_UNQUOTE(JSON_EXTRACT(co.canvas_data, '$.objects[0].text')) as text_content,
    o.created_at
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN customization_options co ON oi.customization_option_id = co.id
WHERE o.user_id = 66
  AND oi.customization_option_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- ============================================================================
-- Query 4: Find if there are duplicate designs (same text, different IDs)
-- ============================================================================
SELECT
    JSON_UNQUOTE(JSON_EXTRACT(canvas_data, '$.objects[0].text')) as design_text,
    GROUP_CONCAT(id ORDER BY id) as customization_ids,
    COUNT(*) as count
FROM customization_options
WHERE user_id = 66
  AND JSON_EXTRACT(canvas_data, '$.objects[0].text') IS NOT NULL
GROUP BY JSON_UNQUOTE(JSON_EXTRACT(canvas_data, '$.objects[0].text'))
HAVING count > 1
ORDER BY count DESC;

-- ============================================================================
-- Query 5: Check if customization 376 is a snapshot
-- ============================================================================
SELECT
    id,
    JSON_EXTRACT(design_metadata, '$.is_snapshot') as is_snapshot,
    JSON_EXTRACT(design_metadata, '$.source_customization_id') as source_id,
    JSON_EXTRACT(design_metadata, '$.snapshot_created_at') as snapshot_created_at,
    JSON_UNQUOTE(JSON_EXTRACT(canvas_data, '$.objects[0].text')) as first_text,
    JSON_UNQUOTE(JSON_EXTRACT(canvas_data, '$.objects[1].text')) as second_text,
    created_at
FROM customization_options
WHERE id = 376;
