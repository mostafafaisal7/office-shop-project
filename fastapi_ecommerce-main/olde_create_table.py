import asyncio
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.engine.reflection import Inspector
from app.core.database import Base, engine 

#from app.core.sync_database import Base, engine

from app.users.models import User  # Make sure to import all models here
from app.auth.models import RefreshToken, PasswordResetToken
from app.categories.models import Category
from app.products.models import Product, ProductMedia, ProductVariation, VariationMedia, CustomizationOption, ProductCategory
from app.cart.models import CartItem
from app.orders.models import Order, OrderItem
from app.discounts.models import QuantityDiscountRule, ProductDiscountAssignment
from app.shipping.models import ShippingAddress, ShippingMethod, ShippingCostRule, ProductShippingRule
from app.payment.models import PaymentMethod
from app.reviews.models import Review, ReviewMedia, ReviewHelpfulVote, ReviewSummary
from app.orders.models import OrderItem, Order


async def initialize_database():
    """Drop all tables and create them again."""
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)

        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Tables created successfully!")


async def verify_table_exists(table_name: str):
    """Verify that a specific table exists and show its columns."""
    async with async_sessionmaker() as session:
        conn = await session.connection()
        sync_conn = conn.sync_connection

        inspector = inspect(sync_conn)

        if not isinstance(inspector, Inspector):
            raise ValueError("Failed to create inspector")

        tables = inspector.get_table_names()

        if table_name in tables:
            print(f"✅ Table '{table_name}' exists.")
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            print(f"Columns in '{table_name}': {columns}")
        else:
            print(f"❌ Table '{table_name}' does NOT exist.")


if __name__ == "__main__":
    asyncio.run(initialize_database())
    # Optional: Verify specific table
    asyncio.run(verify_table_exists("orders"))
