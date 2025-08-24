from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, asc, desc
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate, AdminUserUpdate
from passlib.context import CryptContext
from typing import Tuple, List, Optional
import math

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def create_user(db: AsyncSession, user: UserCreate) -> User:
    hashed_pw = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        hashed_password=hashed_pw,
        role=user.role
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def update_user_profile(db: AsyncSession, user: User, updates: UserUpdate) -> User:
    # Re-fetch the user to ensure it's in the current session
    result = await db.execute(select(User).filter(User.id == user.id))
    persistent_user = result.scalar_one()
    
    if not persistent_user:
        raise ValueError("User not found")

    update_data = updates.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(persistent_user, key, value)

    await db.commit()
    await db.refresh(persistent_user)
    return persistent_user

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()

# New CRUD functions for admin endpoints

async def get_users_paginated(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 10,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    sort_by: str = "id",
    sort_order: str = "asc"
) -> Tuple[List[User], int]:
    """
    Get paginated list of users with optional filtering and search
    Returns tuple of (users_list, total_count)
    """
    # Build base query
    query = select(User)
    count_query = select(func.count(User.id))
    
    # Apply filters
    filters = []
    
    if search:
        search_filter = or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    if role:
        filters.append(User.role == role)
    
    if is_active is not None:
        filters.append(User.is_active == is_active)
    
    # Apply filters to both queries
    if filters:
        query = query.where(*filters)
        count_query = count_query.where(*filters)
    
    # Apply sorting
    sort_column = getattr(User, sort_by, User.id)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    # Execute queries
    users_result = await db.execute(query)
    users = users_result.scalars().all()
    
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    return list(users), total

async def admin_update_user(db: AsyncSession, user_id: int, updates: AdminUserUpdate) -> User:
    """
    Admin update user - can update more fields than regular user update
    """
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise ValueError("User not found")

    update_data = updates.model_dump(exclude_unset=True)

    # Handle password update
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    # Apply updates
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user
