from sqlalchemy.ext.asyncio import AsyncSession
from app.core.hashing import Hasher
from app.common.user_repo import get_user_by_email

from sqlalchemy import select
from app.users.models import OTPCode
from datetime import datetime,timezone


async def authenticate_user(email: str, password: str, db: AsyncSession):
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not Hasher.verify_password(password, str(user.hashed_password)):
        return None
    return user
    
# async def verify_otp(db: AsyncSession, user_id: int, otp: str) -> bool:
#     result = await db.execute(
#         select(OTP).where(
#             OTP.user_id == user_id,
#             OTP.code == otp,
#             OTP.expires_at >= datetime.utcnow(),
#             OTP.is_used == False
#         )
#     )
#     otp_obj = result.scalar_one_or_none()
#     if not otp_obj:
#         return False

#     otp_obj.is_used = True
#     await db.commit()
#     return True


# service.py
async def verify_otp(db: AsyncSession, user_id: int, otp_input: str) -> bool:
    result = await db.execute(
        select(OTPCode).where(
            OTPCode.user_id == user_id,
            OTPCode.otp == otp_input,
            OTPCode.expires_at >= datetime.now(timezone.utc),
            OTPCode.is_used == False
        )
    )
    otp_record = result.scalar_one_or_none()
    
    if not otp_record:
        return False
    
    # Mark OTP as used
    otp_record.is_used = True
    await db.commit()
    return True
