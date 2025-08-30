import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Column
from datetime import datetime, timedelta, timezone
from app.users.models import User
from app.auth.schemas import RegisterRequest
from app.core.hashing import Hasher

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_phone(db: AsyncSession, phone: str) -> User | None:
    result = await db.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: int | Column[int]) -> User | None:
    if isinstance(user_id, Column):
        # Handle Column case (for joins/filters)
        stmt = select(User).where(User.id == user_id)
    else:
        # Normal integer case
        stmt = select(User).where(User.id == user_id)
    
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def get_user_by_verification_token(db: AsyncSession, token: str) -> User | None:
    stmt = select(User).where(
        User.verification_token == token,
        User.token_expires_at >= datetime.now(timezone.utc)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Return user even if already verified to allow frontend to handle gracefully
    return user

def construct_user(data: RegisterRequest) -> User:
    verification_token = str(uuid.uuid4())
    token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    return User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        hashed_password=Hasher.get_password_hash(data.password),
        role="customer",
        is_verified=False,
        verification_token=verification_token,
        token_expires_at=token_expires_at
    )
