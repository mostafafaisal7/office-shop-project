"""
Fix Alembic Version Mismatch

This script updates the alembic_version table to the correct revision
so migrations can proceed.
"""

import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_alembic_version():
    """Update alembic version to match current branch's migration chain"""

    # The correct revision (last one before our new SVG migration)
    CORRECT_REVISION = '6b6cc1cb2a00'

    print("Connecting to database...")
    engine = create_engine(settings.DATABASE_URL)

    try:
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
            print("\nNow you can run: alembic upgrade head")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_alembic_version()
