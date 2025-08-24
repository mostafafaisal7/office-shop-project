# Token and LoginRequest schemas
from pydantic import BaseModel, EmailStr, model_validator, Field, field_validator, ValidationInfo,constr  
from typing import Optional,Annotated

# class RegisterRequest(BaseModel):
#     name: str
#     email: EmailStr
#     # phone: str
#     phone: Optional[str] = '' # UPDATE FAYSAL
#     password: str
#     confirm_password: str

#     @model_validator(mode="after")
#     def check_passwords_match(self):
#         if self.password != self.confirm_password:
#             raise ValueError("Passwords do not match")
#         return self

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Annotated[
        str,
        Field(
            min_length=11,
            max_length=14,
            pattern=r'^(?:\+8801|01)[3-9]\d{8}$'
        )
    ]
    password: str
    confirm_password: str  # <-- must exist if you validate it

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


    
# class LoginRequest(BaseModel):
#     email: str
#     password: str

class LoginRequest(BaseModel):
    email: Optional[str] = None # ✅ added email by fasal
    phone: Optional[str] = None
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


class OtpVerifyRequest(BaseModel):
    userId: int
    otp: str