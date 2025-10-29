"""
Fix alembic_version table to point to the correct latest migration.
This script updates the alembic_version table to point to 'a1b2c3d4e5f6'
which is the last known good migration.
"""
import asyncio
from sqlalchemy import create_engine, text
from app.core.config import SQLALCHEMY_DATABASE_URI

def fix_alembic_version():
    # Create synchronous engine for this operation
    sync_url = SQLALCHEMY_DATABASE_URI.replace('aiomysql', 'pymysql')
    engine = create_engine(sync_url)

    print("Checking current alembic_version...")

    with engine.connect() as conn:
        # Check current version
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        row = result.fetchone()

        if row:
            current_version = row[0]
            print(f"Current version in database: {current_version}")

            # Update to the last known good migration
            target_version = 'a1b2c3d4e5f6'
            print(f"\nUpdating to version: {target_version}")

            conn.execute(
                text("UPDATE alembic_version SET version_num = :version"),
                {"version": target_version}
            )
            conn.commit()

            print(f"✅ Successfully updated alembic_version to {target_version}")
            print("\nYou can now run: python -m alembic revision --autogenerate -m 'add design data to cart items'")
            print("Then run: python -m alembic upgrade head")
        else:
            print("❌ No version found in alembic_version table")
            print("Initializing to the latest migration: a1b2c3d4e5f6")

            conn.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:version)"),
                {"version": "a1b2c3d4e5f6"}
            )
            conn.commit()
            print("✅ Initialized alembic_version")

    engine.dispose()

if __name__ == "__main__":
    fix_alembic_version()
