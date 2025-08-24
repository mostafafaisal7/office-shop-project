from sqlalchemy.ext.asyncio import AsyncSession
from app.users import crud
from app.users.schemas import UserListQuery, UserListResponse, AdminUserUpdate, UserResponse
from app.users.models import User
from typing import List
import math

async def list_users_for_admin(
    db: AsyncSession,
    query_params: UserListQuery
) -> UserListResponse:
    """
    Business logic for listing users with pagination, search, and filtering
    """
    # Validate pagination parameters
    page = max(1, query_params.page)
    per_page = min(max(1, query_params.per_page), 100)  # Limit max per_page to 100
    
    # Get paginated users and total count
    users, total = await crud.get_users_paginated(
        db=db,
        page=page,
        per_page=per_page,
        search=query_params.search,
        role=query_params.role,
        is_active=query_params.is_active,
        sort_by=query_params.sort_by or "id",
        sort_order=query_params.sort_order or "asc"
    )
    
    # Calculate total pages
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    
    # Convert users to response format manually
    user_responses = [UserResponse.model_validate(user) for user in users]
    
    return UserListResponse(
        users=user_responses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

async def get_user_details(db: AsyncSession, user_id: int) -> User:
    """
    Get specific user details by ID
    """
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    return user

async def update_user_as_admin(
    db: AsyncSession,
    user_id: int,
    updates: AdminUserUpdate
) -> User:
    """
    Business logic for admin updating any user
    """
    # Check if email is being updated and if it's already taken
    if updates.email:
        existing_user = await crud.get_user_by_email(db, updates.email)
        if existing_user is not None:
            if existing_user.id != user_id:  # type: ignore
                raise ValueError("Email already registered by another user")
    
    # Update the user
    updated_user = await crud.admin_update_user(db, user_id, updates)
    return updated_user
