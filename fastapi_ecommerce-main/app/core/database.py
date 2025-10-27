from databases import Database
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import DATABASE_URL

# Async database for FastAPI
database = Database(DATABASE_URL)

# Async engine for FastAPI (echo=False disables SQL query logging)
engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(bind=engine, expire_on_commit=False)

# Declarative base
Base = declarative_base()

# Dependency for FastAPI routes
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
