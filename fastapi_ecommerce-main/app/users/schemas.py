# This is like Laravel's FormRequest or DTO — for request/response validation
from pydantic import BaseModel, EmailStr, model_validator, constr, StringConstraints, ConfigDict
from typing import Optional, Literal, Annotated, List

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    confirm_password: str
    role: Optional[Literal["customer", "admin"]] = "customer"

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

class UserUpdate(BaseModel):
    name: Optional[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]] = None
    phone: Optional[Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=20)]] = None
    password: Optional[Annotated[str, StringConstraints(min_length=8)]] = None

# Admin-specific schemas for the new endpoints
class UserListQuery(BaseModel):
    page: int = 1
    per_page: int = 10
    search: Optional[str] = None
    role: Optional[Literal["customer", "admin"]] = None
    is_active: Optional[bool] = None
    sort_by: Optional[Literal["id", "name", "email", "role"]] = "id"
    sort_order: Optional[Literal["asc", "desc"]] = "asc"

class AdminUserUpdate(BaseModel):
    name: Optional[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]] = None
    email: Optional[EmailStr] = None
    role: Optional[Literal["customer", "admin"]] = None
    is_active: Optional[bool] = None
    password: Optional[Annotated[str, StringConstraints(min_length=8)]] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    phone: str
    email: EmailStr
    role: str
    is_active: bool
    is_verified: bool

class UserListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    users: List[UserResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
