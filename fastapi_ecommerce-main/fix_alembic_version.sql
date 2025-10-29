-- Fix alembic_version table to point to the correct latest migration
-- This will update the version to 'a1b2c3d4e5f6' which is the last known good migration

USE fastapi_ecommerce;

-- Check current version
SELECT 'Current version:' as info, version_num FROM alembic_version;

-- Update to the last known good migration (a1b2c3d4e5f6)
UPDATE alembic_version SET version_num = 'a1b2c3d4e5f6' WHERE 1=1;

-- Verify the update
SELECT 'Updated version:' as info, version_num FROM alembic_version;

-- If the table is empty, insert the version
INSERT INTO alembic_version (version_num)
SELECT 'a1b2c3d4e5f6'
WHERE NOT EXISTS (SELECT 1 FROM alembic_version);

SELECT 'Final version:' as info, version_num FROM alembic_version;
