"""
Debug script to trace the complete flow: Design → Cart → Order
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Convert async URL to sync
sync_db_url = DATABASE_URL.replace('aiomysql', 'pymysql').replace('asyncmy', 'pymysql').replace('mysql+asyncmy', 'mysql+pymysql').replace('mysql+aiomysql', 'mysql+pymysql')

print("=" * 80)
print("DEBUGGING CART AND CHECKOUT FLOW")
print("=" * 80)

try:
    engine = create_engine(sync_db_url)

    with engine.connect() as conn:
        # 1. Check current cart items
        print("\n1. CURRENT CART ITEMS:")
        print("-" * 80)
        result = conn.execute(text("""
            SELECT id, user_id, guest_id, product_id, variation_id, quantity, customization_option_id
            FROM cart_items
            ORDER BY id DESC
            LIMIT 10
        """))

        cart_rows = result.fetchall()
        if cart_rows:
            print(f"{'ID':<6} {'User':<8} {'Guest':<38} {'Product':<8} {'Var':<6} {'Qty':<5} {'Cust.Opt.ID'}")
            print("-" * 80)
            for row in cart_rows:
                user = str(row[1]) if row[1] else "N/A"
                guest = str(row[2])[:36] if row[2] else "N/A"
                print(f"{row[0]:<6} {user:<8} {guest:<38} {row[3]:<8} {str(row[4]) if row[4] else 'N/A':<6} {row[5]:<5} {str(row[6]) if row[6] else 'N/A'}")
        else:
            print("❌ No items in cart")

        # 2. Check what those customization options contain
        if cart_rows:
            print("\n2. CUSTOMIZATION OPTIONS USED IN CART:")
            print("-" * 80)
            cust_ids = [str(row[6]) for row in cart_rows if row[6]]
            if cust_ids:
                cust_ids_str = ','.join(cust_ids)
                result = conn.execute(text(f"""
                    SELECT id, product_id, variation_id,
                           CASE WHEN svg_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_svg,
                           CASE WHEN svg_data IS NOT NULL THEN LENGTH(svg_data) ELSE 0 END as svg_length,
                           created_at
                    FROM customization_options
                    WHERE id IN ({cust_ids_str})
                    ORDER BY id DESC
                """))

                cust_rows = result.fetchall()
                print(f"{'ID':<10} {'Product':<10} {'Variation':<10} {'Has SVG':<10} {'SVG Size':<12} {'Created'}")
                print("-" * 80)
                for row in cust_rows:
                    print(f"{row[0]:<10} {row[1]:<10} {row[2] or 'N/A':<10} {row[3]:<10} {row[4]:<12} {row[5]}")
            else:
                print("No customization options in cart items")

        # 3. Check recent customization options created
        print("\n3. RECENTLY CREATED CUSTOMIZATION OPTIONS:")
        print("-" * 80)
        result = conn.execute(text("""
            SELECT id, product_id, variation_id,
                   CASE WHEN svg_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_svg,
                   CASE WHEN svg_data IS NOT NULL THEN LENGTH(svg_data) ELSE 0 END as svg_length,
                   created_at
            FROM customization_options
            ORDER BY id DESC
            LIMIT 5
        """))

        rows = result.fetchall()
        print(f"{'ID':<10} {'Product':<10} {'Variation':<10} {'Has SVG':<10} {'SVG Size':<12} {'Created'}")
        print("-" * 80)
        for row in rows:
            print(f"{row[0]:<10} {row[1]:<10} {row[2] or 'N/A':<10} {row[3]:<10} {row[4]:<12} {row[5]}")

        # 4. Check recent orders and what customization they used
        print("\n4. RECENT ORDERS AND THEIR CUSTOMIZATION OPTIONS:")
        print("-" * 80)
        result = conn.execute(text("""
            SELECT oi.id, oi.order_id, oi.product_name, oi.customization_option_id,
                   CASE WHEN oi.design_svg_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_svg
            FROM order_items oi
            ORDER BY oi.id DESC
            LIMIT 5
        """))

        rows = result.fetchall()
        print(f"{'ID':<6} {'Order ID':<40} {'Product':<20} {'Cust.Opt.ID':<13} {'Has SVG'}")
        print("-" * 80)
        for row in rows:
            print(f"{row[0]:<6} {row[1]:<40} {row[2]:<20} {str(row[3]) if row[3] else 'N/A':<13} {row[4]}")

        print("\n" + "=" * 80)
        print("ANALYSIS:")
        print("-" * 80)

        # Analyze the issue
        if cart_rows:
            cart_cust_ids = [row[6] for row in cart_rows if row[6]]
            print(f"✅ Cart has {len(cart_rows)} items")
            print(f"✅ Cart is using customization option IDs: {cart_cust_ids}")
        else:
            print("❌ Cart is empty - add items first!")

        recent_svg_options = conn.execute(text("""
            SELECT id FROM customization_options
            WHERE svg_data IS NOT NULL
            ORDER BY id DESC LIMIT 5
        """)).fetchall()
        svg_ids = [row[0] for row in recent_svg_options]

        if svg_ids:
            print(f"✅ Customizations with SVG: {svg_ids}")

            if cart_rows and cart_cust_ids:
                if any(cid in svg_ids for cid in cart_cust_ids):
                    print("✅ GOOD: Cart is using a customization with SVG data!")
                else:
                    print("❌ PROBLEM: Cart is using OLD customization without SVG!")
                    print(f"   Cart uses: {cart_cust_ids}")
                    print(f"   Should use one of: {svg_ids}")
                    print("\n   → You need to ADD TO CART again with a fresh design!")

        print("=" * 80)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
