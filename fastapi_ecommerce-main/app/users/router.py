from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.schemas import UserCreate, UserUpdate, UserResponse, UserListQuery, UserListResponse, AdminUserUpdate
from app.users import crud, service
from app.users.models import User
from app.core.database import get_db
from app.common.dependencies import require_admin, get_current_user
from typing import Optional, Literal

router = APIRouter()

@router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == user.email))
    db_user = result.scalar_one_or_none()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = await crud.create_user(db, user)
    return new_user

@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    updates: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated_user = await crud.update_user_profile(db, current_user, updates)
    return updated_user

# Admin routes
@router.get("/", response_model=UserListResponse, dependencies=[Depends(require_admin)])
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[Literal["customer", "admin"]] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort_by: Optional[Literal["id", "name", "email", "role"]] = Query("id", description="Sort by field"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("asc", description="Sort order"),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users with pagination, search, and filtering.
    Admin only endpoint.
    """
    query_params = UserListQuery(
        page=page,
        per_page=per_page,
        search=search,
        role=role,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    try:
        return await service.list_users_for_admin(db, query_params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving users: {str(e)}")

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific user details by ID.
    Admin only endpoint.
    """
    try:
        user = await service.get_user_details(db, user_id)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user: {str(e)}")

@router.patch("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def admin_update_user(
    user_id: int,
    updates: AdminUserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update any user (admin action).
    Different from /users/me as this allows admins to update other users.
    Can update: name, email, role, is_active, password.
    """
    try:
        updated_user = await service.update_user_as_admin(db, user_id, updates)
        return UserResponse.model_validate(updated_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@router.get("/admin-only", dependencies=[Depends(require_admin)])
async def admin_dashboard():
    return {"message": "Welcome admin!"}

@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)  # enforce admin
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return
