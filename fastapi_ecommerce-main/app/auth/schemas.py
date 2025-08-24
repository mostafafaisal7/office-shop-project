# Token and LoginRequest schemas
from pydantic import BaseModel, EmailStr, model_validator, Field, field_validator, ValidationInfo
from typing import Optional

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    # phone: str
    phone: Optional[str] = None # UPDATE FAYSAL
    password: str
    confirm_password: str

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
    
class LoginRequest(BaseModel):
    email: str
    password: str
    
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    
class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
    confirm_password: str

    @field_validator("new_password")
    def strong_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("confirm_password")
    def passwords_match(cls, v, info: ValidationInfo):
        new_password = info.data.get("new_password")
        if new_password and v != new_password:
            raise ValueError("Passwords do not match")
        return v