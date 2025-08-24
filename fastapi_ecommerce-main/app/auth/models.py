from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, text, func,ForeignKey
# from app.core.database import Base
import hashlib
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base








class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # Not a foreign key
    # refresh_token = Column(Text, unique=True, nullable=False)



    refresh_token = Column(String(4096), nullable=False)  # full token
    token_hash = Column(String(64), unique=True, nullable=False)  # SHA256 hash

    user_agent = Column(String(255))
    ip_address = Column(String(100))
    is_valid = Column(Boolean, server_default=text("1"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime)

    def set_token(self, token: str):
        self.refresh_token = token
        self.token_hash = hashlib.sha256(token.encode()).hexdigest()

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    is_used = Column(Boolean, server_default=text("0"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    expires_at = Column(DateTime)





# class OTPCode(Base):
#     __tablename__ = "otp_codes"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     otp = Column(String, nullable=False)
#     delivery = Column(String, nullable=False)  # "email" or "phone"
#     expires_at = Column(DateTime, nullable=False)

#     user = relationship("User", back_populates="otps")




# class OTPCode(Base):
#     __tablename__ = "otp_codes"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     otp = Column(String, nullable=False)
#     delivery = Column(String, nullable=False)  # "email" or "phone"
#     expires_at = Column(DateTime, nullable=False)

#     user = relationship("User", back_populates="otps")