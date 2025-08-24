# Create the User database table
# app/users/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, text,ForeignKey
from app.core.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(255), server_default=text("'customer'"), nullable=False)
    is_active = Column(Boolean, server_default=text("1"))
    otp_codes = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")



    is_verified = Column(Boolean, server_default=text("0"))
    verification_token = Column(String(255), nullable=True)
    token_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)



# class OTPCode(Base):
#     __tablename__ = "otp_codes"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     otp = Column(String(6), nullable=False)   # make sure this exists
#     delivery = Column(String(10), nullable=False)
#     expires_at = Column(DateTime, nullable=False)

#     user = relationship("User", back_populates="otp_codes")


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    otp = Column(String(6), nullable=False)
    delivery = Column(String(10), nullable=False)
    is_used = Column(Boolean, server_default=text("0"), nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="otp_codes")
