# app/common/otp_utils.py
import random
from datetime import datetime, timedelta
from app.users.models import OTPCode
from sqlalchemy.ext.asyncio import AsyncSession


# async def create_otp(db, user_id: int, delivery: str):
#     otp = str(random.randint(100000, 999999))
#     expires_at = datetime.utcnow() + timedelta(minutes=10)

#     db_otp = OTPCode(
#         user_id=user_id,
#         otp=otp,
#         delivery=delivery,
#         expires_at=expires_at
#     )
#     db.add(db_otp)
#     await db.commit()

#     return otp


from datetime import datetime, timedelta
import random
from sqlalchemy.ext.asyncio import AsyncSession

async def create_otp(db: AsyncSession, user_id: int, delivery: str, expires_in_minutes: int = 5) -> str:
    code = f"{random.randint(100000, 999999)}"
    otp_obj = OTPCode(
        user_id=user_id,
        otp=code,
        delivery=delivery,
        expires_at=datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    )
    db.add(otp_obj)
    await db.commit()
    await db.refresh(otp_obj)
    return code
