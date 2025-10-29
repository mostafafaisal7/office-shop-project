#!/usr/bin/env python3
"""
Apply migration fix to add design data columns to cart_items table.
This script fixes the alembic_version issue and adds the necessary columns.
"""
import pymysql
import sys

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'user': 'niloy',
    'password': 'niloy940',
    'database': 'fastapi_ecommerce',
    'port': 3306
}

def main():
    print("=" * 60)
    print("Migration Fix Script")
    print("=" * 60)

    try:
        # Connect to database
        print("\n1. Connecting to database...")
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("   ✅ Connected successfully")

        # Check current alembic version
        print("\n2. Checking current alembic version...")
        cursor.execute("SELECT version_num FROM alembic_version")
        result = cursor.fetchone()
        if result:
            print(f"   Current version: {result[0]}")
        else:
            print("   ⚠️  No version found in alembic_version table")

        # Fix alembic_version to point to last known good migration
        print("\n3. Fixing alembic_version...")
        cursor.execute("UPDATE alembic_version SET version_num = 'a1b2c3d4e5f6'")
        conn.commit()
        print("   ✅ Updated alembic_version to 'a1b2c3d4e5f6'")

        # Check if columns already exist
        print("\n4. Checking if design columns exist...")
        cursor.execute("""
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = 'fastapi_ecommerce'
            AND TABLE_NAME = 'cart_items'
            AND COLUMN_NAME IN ('design_canvas_data', 'design_svg_data', 'design_elements')
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]

        if len(existing_columns) == 3:
            print("   ℹ️  All design columns already exist, skipping...")
        else:
            print(f"   Found {len(existing_columns)} of 3 columns, adding missing ones...")

            # Add design_canvas_data column
            if 'design_canvas_data' not in existing_columns:
                print("   Adding design_canvas_data...")
                cursor.execute("ALTER TABLE cart_items ADD COLUMN design_canvas_data JSON NULL")
                print("   ✅ Added design_canvas_data")

            # Add design_svg_data column
            if 'design_svg_data' not in existing_columns:
                print("   Adding design_svg_data...")
                cursor.execute("ALTER TABLE cart_items ADD COLUMN design_svg_data TEXT NULL")
                print("   ✅ Added design_svg_data")

            # Add design_elements column
            if 'design_elements' not in existing_columns:
                print("   Adding design_elements...")
                cursor.execute("ALTER TABLE cart_items ADD COLUMN design_elements JSON NULL")
                print("   ✅ Added design_elements")

            conn.commit()

        # Update alembic_version to new migration
        print("\n5. Updating alembic_version to new migration...")
        cursor.execute("UPDATE alembic_version SET version_num = 'd8e9f0a1b2c3'")
        conn.commit()
        print("   ✅ Updated alembic_version to 'd8e9f0a1b2c3'")

        # Verify columns
        print("\n6. Verifying columns...")
        cursor.execute("""
            SELECT COLUMN_NAME, COLUMN_TYPE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = 'fastapi_ecommerce'
            AND TABLE_NAME = 'cart_items'
            AND COLUMN_NAME IN ('design_canvas_data', 'design_svg_data', 'design_elements')
            ORDER BY COLUMN_NAME
        """)
        columns = cursor.fetchall()

        if len(columns) == 3:
            print("   ✅ All columns verified:")
            for col_name, col_type in columns:
                print(f"      - {col_name}: {col_type}")
        else:
            print(f"   ⚠️  Only found {len(columns)} columns")
            return 1

        # Close connection
        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        print("✅ Migration fix applied successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Clear old cart items: DELETE FROM cart_items WHERE design_canvas_data IS NULL;")
        print("2. Test by adding a designed product to cart")
        print("3. Complete checkout and verify order")
        print("4. Check ZIP download in admin panel")
        print("=" * 60)

        return 0

    except pymysql.Error as e:
        print(f"\n❌ Database error: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
