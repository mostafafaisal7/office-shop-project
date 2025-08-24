import asyncio
from sqlalchemy import inspect, select
from app.core.database import Base, engine, async_session_maker
from app.users.models import User,OTPCode  
from app.core.hashing import Hasher  # your hashing class

# Admin credentials (change before production!)
ADMIN_EMAIL = "progfaysal@gmail.com"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "Admin"
ADMIN_PHONE = "01303151830"


async def initialize_database():
    """Drop all tables and create them again."""
    async with engine.begin() as conn:
        print("Dropping all tables...")
        # Drop all tables (sync method called safely via run_sync)
        await conn.run_sync(Base.metadata.drop_all)

        print("Creating all tables...")
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Tables created successfully!")


async def verify_all_tables():
    """Automatically verify all tables declared in Base.metadata."""
    async with engine.begin() as conn:
        # Use run_sync to safely call the synchronous inspector
        def sync_inspect_tables(sync_conn):
            inspector = inspect(sync_conn)
            all_tables = [table.name for table in Base.metadata.sorted_tables]
            existing_tables = inspector.get_table_names()
            result = {}
            for table in all_tables:
                if table in existing_tables:
                    columns = [col["name"] for col in inspector.get_columns(table)]
                    result[table] = columns
                else:
                    result[table] = None
            return result

        table_info = await conn.run_sync(sync_inspect_tables)
        for table, columns in table_info.items():
            if columns:
                print(f"✅ Table '{table}' exists with columns: {columns}")
            else:
                print(f"❌ Table '{table}' does NOT exist!")


async def create_admin():
    """Create a default admin user if it doesn't exist."""
    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        admin = result.scalar_one_or_none()

        if admin:
            print(f"✅ Admin user '{ADMIN_EMAIL}' already exists.")
            return

        hashed_password = Hasher.get_password_hash(ADMIN_PASSWORD)
        admin_user = User(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            phone=ADMIN_PHONE,
            hashed_password=hashed_password,
            role="admin",
            is_active=True,
            is_verified=True
        )

        session.add(admin_user)
        await session.commit()
        print(f"✅ Admin user '{ADMIN_EMAIL}' created successfully!")


async def main():
    await initialize_database()
    await verify_all_tables()
    await create_admin()

    # Properly close connections
    await engine.dispose()
    print("✅ Database connections closed.")


if __name__ == "__main__":
    asyncio.run(main())
