"""
Fix Alembic Version Mismatch

This script updates the alembic_version table to the correct revision
so migrations can proceed.
"""

import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def fix_alembic_version():
    """Update alembic version to match current branch's migration chain"""

    # The correct revision (last one before our new SVG migration)
    CORRECT_REVISION = '6b6cc1cb2a00'

    # Load environment variables
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL not found in .env file")
        print("Please make sure your .env file exists and has DATABASE_URL set")
        sys.exit(1)

    # Convert async database URL to sync (replace aiomysql/asyncmy with pymysql)
    sync_db_url = DATABASE_URL.replace('aiomysql', 'pymysql').replace('asyncmy', 'pymysql').replace('mysql+asyncmy', 'mysql+pymysql').replace('mysql+aiomysql', 'mysql+pymysql')

    print("Connecting to database...")
    print(f"Database URL: {sync_db_url.split('@')[1] if '@' in sync_db_url else 'hidden'}")

    try:
        engine = create_engine(sync_db_url)

        with engine.connect() as conn:
            # Check current version
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            current_version = result.scalar()
            print(f"Current alembic version: {current_version}")

            if current_version == CORRECT_REVISION:
                print("✅ Already at correct revision!")
                return

            # Update to correct revision
            print(f"Updating to revision: {CORRECT_REVISION}")
            conn.execute(
                text("UPDATE alembic_version SET version_num = :new_version"),
                {"new_version": CORRECT_REVISION}
            )
            conn.commit()

            # Verify
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            new_version = result.scalar()
            print(f"✅ Updated alembic version to: {new_version}")
            print("\n✅ Success! Now you can run: alembic upgrade head")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure MySQL is running")
        print("2. Check your .env file has correct DATABASE_URL")
        print("3. Verify database credentials are correct")
        sys.exit(1)

if __name__ == "__main__":
    fix_alembic_version()
