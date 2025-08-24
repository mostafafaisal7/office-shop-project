from sys import version
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
import uuid
from fastapi.responses import JSONResponse
from sqlalchemy import and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta, datetime, timezone
from typing import Optional

from app.core.database import get_db
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, RefreshTokenRequest, PasswordResetRequest, PasswordResetConfirm
from app.auth.utils import create_access_token, create_refresh_token, decode_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from app.auth.service import authenticate_user
from app.core.hashing import Hasher
from app.auth.models import RefreshToken, PasswordResetToken
from app.common.dependencies import get_current_user
from app.common.schemas import CurrentUser
from app.common.user_repo import get_user_by_id, get_user_by_email, construct_user, get_user_by_verification_token
from app.common.email_templates import password_reset_email, verification_email
from app.common.email_utils import send_email
from app.common.otp_utils import create_otp
from app.common.sms_utils import send_sms
from app.users.models import User
from sqlalchemy import select

from pydantic import BaseModel
from app.auth.service import verify_otp





class OtpVerifyRequest(BaseModel):
    userId: int
    otp: str




async def get_user_by_phone(db: AsyncSession, phone: str) -> User | None:
    result = await db.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()

# from app.db.session import async_session


router = APIRouter()

# async def construct_userr(data):
#     """Create a new User instance and save to the database"""
#     new_user = User(
#         name=data.name,
#         email=data.email,
#         phone=data.phone,
#         hashed_password=hash_password(data.password),
#         role="user",  # default role
#         is_active=True,
#         is_verified=False,
#         verification_token=secrets.token_urlsafe(32),
#         token_expires_at=datetime.utcnow() + timedelta(hours=24),
#         created_at=datetime.utcnow(),
#         updated_at=datetime.utcnow(),
#     )

#     # Save to DB
#     async with async_session() as session:
#         session.add(new_user)
#         await session.commit()
#         await session.refresh(new_user)

#     return new_user

@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email or phone already exists
    if await get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    if await get_user_by_phone(db, data.phone):
        raise HTTPException(status_code=400, detail="Phone already exists")

    # Create user with verification token (existing system)
    new_user = construct_user(data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Send verification email (existing verification system)
    verify_link = f"http://127.0.0.1:8000/auth/verify-email?token={new_user.verification_token}"
    html = verification_email(name=new_user.name, link=verify_link)
    send_email(to_email=new_user.email, subject="Verify Your Email", html_content=html)

    return {
        "detail": "Registration successful. Please check your email to verify your account."
    }


    # async def construct_userr(data):
    #     """Create a new User instance and save to the database"""
    #     new_user = User(
    #     name=data.name,
    #     email=data.email,
    #     phone=data.phone,
    #     hashed_password=hash_password(data.password),
    #     role="user",  # default role
    #     is_active=True,
    #     is_verified=False,
    #     verification_token=secrets.token_urlsafe(32),
    #     token_expires_at=datetime.utcnow() + timedelta(hours=24),
    #     created_at=datetime.utcnow(),
    #     updated_at=datetime.utcnow(),
    # )

    # # Save to DB
    # async with async_session() as session:
    #     session.add(new_user)
    #     await session.commit()
    #     await session.refresh(new_user)

    # return new_user



    # new_user = await construct_user(data)





    # previous version by niloy
    # new_user = construct_user(data) 

    # db.add(new_user)
    # await db.commit()
    # await db.refresh(new_user)

    # # Send verification email
    # verify_link = f"http://localhost:8000/auth/verify-email?token={new_user.verification_token}"
    # html = verification_email(name=new_user.name, link=verify_link)
    # send_email(to_email=new_user.email, subject="Verify Your Email", html_content=html)

    # return {"detail": "Registration successful. Please check your email to verify your account."}

        # previous version by niloy



@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_verification_token(db, token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.is_verified = True
    user.verification_token = None
    user.token_expires_at = None
    await db.commit()
    await db.refresh(user)

    return {"detail": "Email verified successfully. You can now log in."}


@router.post("/resend-verification-email")
async def resend_verification_email(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Your email is already verified")

    user = await get_user_by_id(db, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    user.verification_token = token
    user.token_expires_at = expires_at
    await db.commit()

    verify_link = f"http://127.0.0.1:8000/auth/verify-email?token={token}"
    html = verification_email(name=user.name or "User", link=verify_link)

    send_email(to_email=user.email, subject="Verify Your Email", html_content=html)

    return {"detail": "Verification email has been resent."}


# @router.post("/login")      # ✅ added phone by fasal
# async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
#     # Identify user
#     if data.email:
#         user = await get_user_by_email(db, data.email)
#         method = "email"
#     elif data.phone:
#         user = await get_user_by_phone(db, data.phone)
#         method = "phone"
#     else:
#         raise HTTPException(status_code=400, detail="Email or phone is required")

#     if not user:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

#     # Verify password
#     if not Hasher.verify_password(data.password, user.hashed_password):
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

#     # Check email verification if login via email
#     if method == "email" and not user.is_verified:
#         raise HTTPException(status_code=403, detail="Email not verified")

#     # Create OTP for login
#     otp = await create_otp(db, user.id, method)

#     # Send OTP
#     if method == "email":
#         send_email(
#             to_email=user.email,
#             subject="Login OTP",
#             html_content=f"Hello {user.name}, your login OTP is <b>{otp}</b>"
#         )
#     else:
#         # Assuming you have a send_sms function
#         send_sms(user.phone, f"Hello {user.name}, your login OTP is {otp}")

#     return {"user_id": user.id, "detail": f"OTP sent via {method}. Please verify to complete login."}


# @router.post("/login")
# async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):


# ... (other imports)



# @router.post("/login")
# async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Identify user by email or phone
    if data.email:
        user = await get_user_by_email(db, data.email)
        method = "email"
    elif data.phone:
        user = await get_user_by_phone(db, data.phone)
        method = "phone"
    else:
        # Return a structured error for missing credentials
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Email or phone is required"}
        )

    # Handle cases where the user is not found or password is wrong
    if not user or not Hasher.verify_password(data.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid credentials"}
        )

    # Check for email verification
    if method == "email" and not user.is_verified:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Email not verified"}
        )

    # Create and send OTP
    otp = await create_otp(db, user.id, method)
    if method == "email":
        send_email(
            to_email=user.email,
            subject="Login OTP",
            html_content=f"Hello {user.name}, your login OTP is <b>{otp}</b>"
        )
    else:
        # Assuming you have a send_sms function
        send_sms(user.phone, f"Hello {user.name}, your login OTP is {otp}")
    
    # Return a structured response indicating OTP is required
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "detail": f"OTP sent via {method}. Please verify to complete login.",
            "otpRequired": True
        }
    )
    # Identify user
    if data.email:
        user = await get_user_by_email(db, data.email)
        method = "email"
    elif data.phone:
        user = await get_user_by_phone(db, data.phone)
        method = "phone"
    else:
        raise HTTPException(status_code=400, detail="Email or phone is required")

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Verify password
    if not Hasher.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Check email verification if login via email
    if method == "email" and not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    # Create OTP for login
    otp = await create_otp(db, user.id, method)

    # Send OTP
    if method == "email":
        send_email(
            to_email=user.email,
            subject="Login OTP",
            html_content=f"Hello {user.name}, your login OTP is <b>{otp}</b>"
        )
    else:
        send_sms(user.phone, f"Hello {user.name}, your login OTP is {otp}")

    # Return with your existing field names but include otp_required
    # return {
    #     "user_id": user.id,
    #     "detail": f"OTP sent via {method}. Please verify to complete login.",
    #     "otp_required": True  # frontend will use this to show OTP field
    # }
    return {
    "success": True,
    "message": f"OTP sent via {method}. Please verify to complete login.",
    "data": {"user_id": user.id, "otpRequired": True}
    }


# @router.post("/login", response_model=TokenResponse)
# async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(data.email, data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    # db_token = RefreshToken(
    #     user_id=user.id,
    #     refresh_token=refresh_token,
    #     ip_address=request.client.host if request.client else None,
    #     user_agent=request.headers.get("user-agent"),
    #     expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    # )
    # db.add(db_token)
    # await db.commit()
    db_token = RefreshToken(
    user_id=user.id,
    user_agent=request.headers.get("user-agent"),
    ip_address=request.client.host if request.client else None,
    expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    db_token.set_token(refresh_token)  # <-- important
    db.add(db_token)
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

# @router.post("/login")
# async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
#     """
#     Handles user login by verifying credentials and sending a one-time password (OTP).
#     """

#     # Step 1: Identify the user by email or phone.
#     if data.email:
#         user = await get_user_by_email(db, data.email)
#         method = "email"
#     elif data.phone:
#         user = await get_user_by_phone(db, data.phone)
#         method = "phone"
#     else:
#         # If no email or phone is provided, raise a bad request exception.
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Email or phone is required"
#         )

#     # Step 2: Verify the user's password.
#     if not user or not Hasher.verify_password(data.password, user.hashed_password):
#         # If the user does not exist or the password is incorrect, raise a 401 Unauthorized exception.
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid credentials"
#         )

#     # Step 3: Check for email verification (if applicable).
#     if method == "email" and not user.is_verified:
#         # If the email is not verified, raise a 403 Forbidden exception.
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Email not verified"
#         )

#     # Step 4: All checks passed. Create and send the OTP.
#     otp = await create_otp(db, user.id, method)
    
#     if method == "email":
#         send_email(
#             to_email=user.email,
#             subject="Login OTP",
#             html_content=f"Hello {user.name}, your login OTP is <b>{otp}</b>"
#         )
#     else:
#         # Assuming `send_sms` is a valid function in your project
#         send_sms(user.phone, f"Hello {user.name}, your login OTP is {otp}")

#     # Step 5: Return a structured JSON response to the client.
#     # This is the ONLY return statement in the successful path of the function.
#     return JSONResponse(
#         status_code=status.HTTP_200_OK,
#         content={
#             "message": f"OTP sent via {method}. Please verify to complete login.",
#             "data": {
#                 "userId": user.id,
#                 "otpRequired": True
#             }
#         }
#     )

# -------------------------------
# Login: Request OTP
# -------------------------------
@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = None
    method = None

    if data.email:
        user = await get_user_by_email(db, data.email)
        method = "email"
    elif data.phone:
        user = await get_user_by_phone(db, data.phone)
        method = "phone"
    else:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "message": "Email or phone is required", "data": {}}
        )

    if not user or not Hasher.verify_password(data.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"success": False, "message": "Invalid credentials", "data": {}}
        )

    if method == "email" and not user.is_verified:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Email not verified", "data": {}}
        )

    # Generate OTP
    otp = await create_otp(db, user.id, method)
    if method == "email":
        send_email(
            to_email=user.email,
            subject="Login OTP",
            html_content=f"Hello {user.name}, your login OTP is <b>{otp}</b>"
        )
    else:
        # Send SMS OTP using GreenWeb API
        sms_sent = send_sms(user.phone, f"Hello {user.name}, your login OTP is {otp}")
        if not sms_sent:
            print(f"Failed to send SMS to {user.phone}, OTP: {otp}")

    # Return consistent response format expected by frontend
    response_data = {
        "success": True,
        "message": f"OTP sent via {method}. Please verify to complete login.",
        "data": {
            "otpRequired": True,
            "userId": user.id,  # Frontend expects userId, not user_id
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "isEmailVerified": user.is_verified,
                "createdAt": user.created_at.isoformat(),
                "updatedAt": user.updated_at.isoformat()
            }
        }
    }

    print("LOGIN RESPONSE:", response_data)  # Debug log
    return JSONResponse(status_code=200, content=response_data)


# Verify OTP and get tokens
# -------------------------------
@router.post("/login/verify-otp")
async def verify_login_otp(data: OtpVerifyRequest, request: Request, db: AsyncSession = Depends(get_db)):
    if not await verify_otp(db, data.userId, data.otp):
        raise HTTPException(status_code=400, detail="OTP verification failed")

    user = await get_user_by_id(db, data.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    db_token = RefreshToken(
        user_id=user.id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db_token.set_token(refresh_token)
    db.add(db_token)
    await db.commit()
    
    # After sending OTP, before returning response
    response_data = {
        "detail": "OTP verified successfully",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "isEmailVerified": user.is_verified,
            "createdAt": user.created_at.isoformat(),
            "updatedAt": user.updated_at.isoformat()
        },
        "tokens": {
            "accessToken": access_token,
            "refreshToken": refresh_token
        }
    }

    print("VERIFY OTP RESPONSE:", response_data)
    return JSONResponse(status_code=200, content=response_data)


    




@router.post("/logout")
async def logout(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    data: Optional[RefreshTokenRequest] = Body(None)
):
    if data and data.refresh_token:
        # Revoke specific refresh token if provided
        result = await db.execute(
            RefreshToken.__table__.select().where(
                RefreshToken.refresh_token == data.refresh_token,
                RefreshToken.user_id == current_user.id,
                RefreshToken.is_valid == True
            )
        )
        db_token = result.fetchone()

        if not db_token:
            raise HTTPException(status_code=404, detail="Refresh token not found")

        await db.execute(
            RefreshToken.__table__.update()
            .where(RefreshToken.id == db_token.id)
            .values(is_valid=False)
        )
    else:
        # Revoke all refresh tokens for the user if no specific token provided
        await db.execute(
            RefreshToken.__table__.update()
            .where(RefreshToken.user_id == current_user.id, RefreshToken.is_valid == True)
            .values(is_valid=False)
        )
    
    await db.commit()
    return JSONResponse(status_code=200, content={"detail": "Logged out successfully"})


@router.post("/logout-all")
async def logout_all(current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        RefreshToken.__table__.update()
        .where(RefreshToken.user_id == current_user.id, RefreshToken.is_valid == True)
        .values(is_valid=False)
    )
    await db.commit()
    return JSONResponse(status_code=200, content={"detail": "Logged out from all devices"})


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, request: Request, db: AsyncSession = Depends(get_db)):
    payload = decode_refresh_token(data.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(
        RefreshToken.__table__.select().where(
            RefreshToken.refresh_token == data.refresh_token,
            RefreshToken.is_valid == True
        )
    )
    db_token = result.fetchone()

    if not db_token:
        raise HTTPException(status_code=401, detail="Refresh token revoked or not found")

    await db.execute(
        RefreshToken.__table__.update()
        .where(RefreshToken.id == db_token.id)
        .values(is_valid=False)
    )

    access_token = create_access_token(data={"sub": str(user_id), "role": payload.get("role")})
    new_refresh_token = create_refresh_token(data={"sub": str(user_id), "role": payload.get("role")})

    new_db_token = RefreshToken(
        user_id=user_id,
        refresh_token=new_refresh_token,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_db_token)
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/password-reset-request")
async def request_password_reset(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, data.email)
    if not user:
        return {"detail": "If this email exists, a reset link has been sent."}

    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    db_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )

    try:
        # Cleanup expired tokens
        await db.execute(
            PasswordResetToken.__table__.delete().where(
                PasswordResetToken.expires_at < datetime.now(timezone.utc)
            )
        )

        db.add(db_token)
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"[ERROR] Password reset error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    reset_link = f"http://127.0.0.1:8000/reset-password?token={token}"
    html = password_reset_email(name=user.name or "User", reset_link=reset_link)

    send_email(to_email=user.email, subject="Reset Your Password", html_content=html)

    return {"detail": "Password reset link sent to your email"}


@router.post("/password-reset-confirm")
async def confirm_password_reset(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        PasswordResetToken.__table__.select().where(
            PasswordResetToken.token == data.token,
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at >= datetime.now(timezone.utc)
        )
    )
    db_token = result.fetchone()

    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = await get_user_by_id(db, db_token.user_id)

    user.hashed_password = Hasher.get_password_hash(data.new_password)
    db_token.is_used = True

    await db.commit()

    return {"detail": "Password reset successful"}


# -------------------------------
# SEPARATE ADMIN AND CUSTOMER LOGIN ENDPOINTS
# -------------------------------

@router.post("/admin/login")
async def admin_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Admin-specific login endpoint - only allows admin users"""
    user = None
    method = None

    if data.email:
        user = await get_user_by_email(db, data.email)
        method = "email"
    elif data.phone:
        user = await get_user_by_phone(db, data.phone)
        method = "phone"
    else:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "message": "Email or phone is required", "data": {}}
        )

    if not user or not Hasher.verify_password(data.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"success": False, "message": "Invalid credentials", "data": {}}
        )

    # Check if user is admin
    if user.role != "admin":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Access denied. Admin privileges required.", "data": {}}
        )

    if method == "email" and not user.is_verified:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Email not verified", "data": {}}
        )

    # Generate OTP
    otp = await create_otp(db, user.id, method)
    if method == "email":
        send_email(
            to_email=user.email,
            subject="Admin Login OTP",
            html_content=f"Hello {user.name}, your admin login OTP is <b>{otp}</b>"
        )
    else:
        sms_sent = send_sms(user.phone, f"Hello {user.name}, your admin login OTP is {otp}")
        if not sms_sent:
            print(f"Failed to send SMS to {user.phone}, OTP: {otp}")

    response_data = {
        "success": True,
        "message": f"Admin OTP sent via {method}. Please verify to complete login.",
        "data": {
            "otpRequired": True,
            "userId": user.id,
            "userType": "admin",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "isEmailVerified": user.is_verified,
                "createdAt": user.created_at.isoformat(),
                "updatedAt": user.updated_at.isoformat()
            }
        }
    }

    print("ADMIN LOGIN RESPONSE:", response_data)
    return JSONResponse(status_code=200, content=response_data)


@router.post("/customer/login")
async def customer_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Customer-specific login endpoint - only allows customer users"""
    user = None
    method = None

    if data.email:
        user = await get_user_by_email(db, data.email)
        method = "email"
    elif data.phone:
        user = await get_user_by_phone(db, data.phone)
        method = "phone"
    else:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "message": "Email or phone is required", "data": {}}
        )

    if not user or not Hasher.verify_password(data.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"success": False, "message": "Invalid credentials", "data": {}}
        )

    # Check if user is customer
    if user.role != "customer":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Access denied. Customer account required.", "data": {}}
        )

    if method == "email" and not user.is_verified:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Email not verified", "data": {}}
        )

    # Generate OTP
    otp = await create_otp(db, user.id, method)
    if method == "email":
        send_email(
            to_email=user.email,
            subject="Customer Login OTP",
            html_content=f"Hello {user.name}, your login OTP is <b>{otp}</b>"
        )
    else:
        sms_sent = send_sms(user.phone, f"Hello {user.name}, your login OTP is {otp}")
        if not sms_sent:
            print(f"Failed to send SMS to {user.phone}, OTP: {otp}")

    response_data = {
        "success": True,
        "message": f"Customer OTP sent via {method}. Please verify to complete login.",
        "data": {
            "otpRequired": True,
            "userId": user.id,
            "userType": "customer",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "isEmailVerified": user.is_verified,
                "createdAt": user.created_at.isoformat(),
                "updatedAt": user.updated_at.isoformat()
            }
        }
    }

    print("CUSTOMER LOGIN RESPONSE:", response_data)
    return JSONResponse(status_code=200, content=response_data)


@router.post("/admin/login/verify-otp")
async def verify_admin_login_otp(data: OtpVerifyRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Verify OTP for admin login"""
    if not await verify_otp(db, data.userId, data.otp):
        raise HTTPException(status_code=400, detail="OTP verification failed")

    user = await get_user_by_id(db, data.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Double-check admin role
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin privileges required.")

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    db_token = RefreshToken(
        user_id=user.id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db_token.set_token(refresh_token)
    db.add(db_token)
    await db.commit()
    
    response_data = {
        "detail": "Admin OTP verified successfully",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "isEmailVerified": user.is_verified,
            "createdAt": user.created_at.isoformat(),
            "updatedAt": user.updated_at.isoformat()
        },
        "tokens": {
            "accessToken": access_token,
            "refreshToken": refresh_token
        }
    }

    print("ADMIN VERIFY OTP RESPONSE:", response_data)
    return JSONResponse(status_code=200, content=response_data)


@router.post("/customer/login/verify-otp")
async def verify_customer_login_otp(data: OtpVerifyRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Verify OTP for customer login"""
    if not await verify_otp(db, data.userId, data.otp):
        raise HTTPException(status_code=400, detail="OTP verification failed")

    user = await get_user_by_id(db, data.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Double-check customer role
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Access denied. Customer account required.")

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    db_token = RefreshToken(
        user_id=user.id,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db_token.set_token(refresh_token)
    db.add(db_token)
    await db.commit()
    
    response_data = {
        "detail": "Customer OTP verified successfully",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "isEmailVerified": user.is_verified,
            "createdAt": user.created_at.isoformat(),
            "updatedAt": user.updated_at.isoformat()
        },
        "tokens": {
            "accessToken": access_token,
            "refreshToken": refresh_token
        }
    }

    print("CUSTOMER VERIFY OTP RESPONSE:", response_data)
    return JSONResponse(status_code=200, content=response_data)


# @router.post("/login/verify-otp", response_model=TokenResponse)
# async def verify_login_otp(
#     data: OtpVerifyRequest,
#     request: Request,
#     db: AsyncSession = Depends(get_db)
# ):
#     if not await verify_otp(db, data.userId, data.otp):
#         raise HTTPException(status_code=400, detail="Invalid OTP")

#     user = await get_user_by_id(db, data.userId)

#     # Generate tokens
#     access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
#     refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

#     db_token = RefreshToken(
#         user_id=user.id,
#         user_agent=request.headers.get("user-agent"),
#         ip_address=request.client.host if request.client else None,
#         expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
#     )
#     db_token.set_token(refresh_token)
#     db.add(db_token)
#     await db.commit()

#     return TokenResponse(access_token=access_token, refresh_token=refresh_token)
