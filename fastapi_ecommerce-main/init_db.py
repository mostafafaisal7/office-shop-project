import asyncio
from app.core.database import Base, engine  # Make sure this imports your async engine
# from app.models import *  # Import all your SQLAlchemy models

async def init_db():
    async with engine.begin() as conn:
        # This creates all tables based on your models
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
