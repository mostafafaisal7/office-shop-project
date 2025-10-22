import asyncio
from sqlalchemy import select, func, text
from app.core.database import get_db, engine
from sqlalchemy.ext.asyncio import AsyncSession

async def check_order_customizations():
    """Check order items and their customization linkage"""

    async with AsyncSession(engine) as session:
        # Check recent order items with customization
        query = text('''
            SELECT
                oi.id,
                oi.order_id,
                oi.product_name,
                oi.customization_option_id,
                oi.customized_images,
                co.id as cust_id,
                co.design_area,
                LENGTH(co.canvas_data) as canvas_size,
                co.user_id as cust_user_id,
                oi.created_at
            FROM order_items oi
            LEFT JOIN customization_options co ON oi.customization_option_id = co.id
            ORDER BY oi.created_at DESC
            LIMIT 10
        ''')
        result = await session.execute(query)
        rows = result.fetchall()

        print('\n' + '=' * 120)
        print('RECENT ORDER ITEMS WITH CUSTOMIZATION DATA')
        print('=' * 120)

        for row in rows:
            print(f'\nOrder Item ID: {row[0]}, Order: {row[1]}, Product: {row[2]}')
            print(f'  Created: {row[10]}')
            print(f'  Customization ID in order_items: {row[3]}')
            print(f'  Customized Images: {row[4][:100] if row[4] else None}...' if row[4] and len(str(row[4])) > 100 else f'  Customized Images: {row[4]}')
            print(f'  Actual Customization Found in DB: {"YES ✓" if row[5] else "NO ✗"}')
            if row[5]:
                print(f'    - Design Area: {row[6]}')
                print(f'    - Canvas Data Size: {row[7]} bytes')
                print(f'    - User ID: {row[8]}')
            print('-' * 120)

        # Summary statistics
        print('\n' + '=' * 120)
        summary_query = text('''
            SELECT
                COUNT(*) as total_orders,
                COUNT(oi.customization_option_id) as with_cust_id,
                COUNT(co.id) as with_actual_cust
            FROM order_items oi
            LEFT JOIN customization_options co ON oi.customization_option_id = co.id
        ''')
        result = await session.execute(summary_query)
        summary = result.fetchone()

        print('SUMMARY STATISTICS:')
        print(f'  Total Order Items: {summary[0]}')
        print(f'  Order Items with customization_option_id: {summary[1]}')
        print(f'  Order Items with actual customization found: {summary[2]}')
        print(f'  Missing customizations: {summary[1] - summary[2]}')
        print('=' * 120 + '\n')

if __name__ == "__main__":
    asyncio.run(check_order_customizations())
