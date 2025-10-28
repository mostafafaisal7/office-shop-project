#!/usr/bin/env python3
"""
Diagnostic script to check if design snapshots are being created correctly.
Run this from the fastapi_ecommerce-main directory.
"""

import asyncio
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = "mysql+pymysql://root:mysql@127.0.0.1:3306/ecommerce_db"

def check_snapshots():
    """Check for snapshot customization options in the database"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Check recent customization options
        query = text("""
            SELECT
                id,
                user_id,
                product_id,
                variation_id,
                design_area,
                JSON_EXTRACT(design_metadata, '$.is_snapshot') as is_snapshot,
                JSON_EXTRACT(design_metadata, '$.source_customization_id') as source_id,
                JSON_EXTRACT(canvas_data, '$.objects[0].text') as first_text,
                created_at,
                updated_at
            FROM customization_options
            WHERE user_id = 66
            ORDER BY id DESC
            LIMIT 20
        """)

        result = conn.execute(query)
        rows = result.fetchall()

        print("\n" + "="*100)
        print("CUSTOMIZATION OPTIONS FOR USER 66 (Most Recent 20)")
        print("="*100)
        print(f"{'ID':<6} {'Snapshot':<10} {'Source':<8} {'Text Content':<30} {'Created':<20}")
        print("-"*100)

        snapshot_count = 0
        live_count = 0

        for row in rows:
            id_val = row[0]
            is_snapshot = str(row[5]) if row[5] else "false"
            source_id = str(row[6]) if row[6] else "-"
            text_content = str(row[7])[:28] if row[7] else "-"
            created_at = str(row[8])[:19] if row[8] else "-"

            if is_snapshot == "true":
                snapshot_count += 1
                print(f"{id_val:<6} {'✅ YES':<10} {source_id:<8} {text_content:<30} {created_at:<20}")
            else:
                live_count += 1
                print(f"{id_val:<6} {'❌ NO':<10} {source_id:<8} {text_content:<30} {created_at:<20}")

        print("-"*100)
        print(f"Summary: {snapshot_count} snapshots, {live_count} live customizations")
        print("="*100)

        # Check order items to see which customization IDs they're using
        query2 = text("""
            SELECT
                oi.id as item_id,
                oi.order_id,
                oi.customization_option_id,
                JSON_EXTRACT(co.design_metadata, '$.is_snapshot') as is_snapshot,
                JSON_EXTRACT(co.canvas_data, '$.objects[0].text') as text_content,
                o.created_at
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            LEFT JOIN customization_options co ON oi.customization_option_id = co.id
            WHERE o.user_id = 66
            ORDER BY o.created_at DESC
            LIMIT 10
        """)

        result2 = conn.execute(query2)
        rows2 = result2.fetchall()

        print("\n" + "="*100)
        print("RECENT ORDERS FOR USER 66")
        print("="*100)
        print(f"{'Item ID':<10} {'Customization ID':<18} {'Is Snapshot?':<15} {'Text Content':<30}")
        print("-"*100)

        for row in rows2:
            item_id = row[0]
            cust_id = row[2] if row[2] else "None"
            is_snap = "✅ YES" if str(row[3]) == "true" else "❌ NO" if row[3] is not None else "⚠️ NULL"
            text_content = str(row[4])[:28] if row[4] else "-"

            print(f"{item_id:<10} {cust_id:<18} {is_snap:<15} {text_content:<30}")

        print("="*100)

        # Recommendations
        print("\n📋 DIAGNOSIS:")
        if snapshot_count == 0:
            print("❌ NO SNAPSHOTS FOUND - The snapshot feature may not be working!")
            print("   1. Check frontend logs for 'Creating snapshot of customization' messages")
            print("   2. Verify backend endpoint /products/options/{id}/snapshot is accessible")
            print("   3. Clear cart and try adding items again with the new code")
        elif snapshot_count > 0:
            print(f"✅ Found {snapshot_count} snapshot(s) - Snapshot feature is working!")
            print("   Check if recent orders are using these snapshot IDs")

        print("\n🔧 NEXT STEPS:")
        print("1. Clear your cart completely")
        print("2. Create a new design")
        print("3. Add to cart and watch for '✅ Snapshot created' message in browser console")
        print("4. Run this script again to verify new snapshot was created")

if __name__ == "__main__":
    try:
        check_snapshots()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        print("\nMake sure you're running this from the correct directory and the database is accessible.")
        sys.exit(1)
