"""
Quick script to check if design data columns exist and have data
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Convert async URL to sync
sync_db_url = DATABASE_URL.replace('aiomysql', 'pymysql').replace('asyncmy', 'pymysql').replace('mysql+asyncmy', 'mysql+pymysql').replace('mysql+aiomysql', 'mysql+pymysql')

print("Checking design data in database...")
print("=" * 60)

try:
    engine = create_engine(sync_db_url)

    with engine.connect() as conn:
        # Check customization_options table
        print("\n1. Customization Options Table:")
        print("-" * 60)
        result = conn.execute(text("""
            SELECT id, product_id, variation_id,
                   CASE WHEN svg_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_svg,
                   CASE WHEN svg_data IS NOT NULL THEN LENGTH(svg_data) ELSE 0 END as svg_length,
                   created_at
            FROM customization_options
            ORDER BY created_at DESC
            LIMIT 5
        """))

        rows = result.fetchall()
        if rows:
            print(f"{'ID':<10} {'Product':<10} {'Variation':<10} {'Has SVG':<10} {'SVG Size':<12} {'Created'}")
            print("-" * 60)
            for row in rows:
                print(f"{row[0]:<10} {row[1]:<10} {row[2] or 'N/A':<10} {row[3]:<10} {row[4]:<12} {row[5]}")
        else:
            print("No customization options found")

        # Check order_items table
        print("\n2. Order Items Table:")
        print("-" * 60)
        result = conn.execute(text("""
            SELECT oi.id, oi.order_id, oi.product_name, oi.customization_option_id,
                   CASE WHEN oi.design_svg_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_svg,
                   CASE WHEN oi.design_canvas_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_canvas,
                   CASE WHEN oi.design_elements IS NOT NULL THEN 'YES' ELSE 'NO' END as has_elements
            FROM order_items oi
            ORDER BY oi.id DESC
            LIMIT 10
        """))

        rows = result.fetchall()
        if rows:
            print(f"{'ID':<6} {'Order ID':<40} {'Product':<20} {'Cust.ID':<8} {'SVG':<6} {'Canvas':<8} {'Elements'}")
            print("-" * 120)
            for row in rows:
                print(f"{row[0]:<6} {row[1]:<40} {row[2]:<20} {str(row[3]) if row[3] else 'N/A':<8} {row[4]:<6} {row[5]:<8} {row[6]}")
        else:
            print("No order items found")

        # Check table structure
        print("\n3. Table Structure Check:")
        print("-" * 60)
        result = conn.execute(text("SHOW COLUMNS FROM order_items LIKE 'design_%'"))
        columns = result.fetchall()
        print("Design-related columns in order_items:")
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")

        print("\n" + "=" * 60)
        print("✅ Check complete!")

except Exception as e:
    print(f"❌ Error: {e}")
