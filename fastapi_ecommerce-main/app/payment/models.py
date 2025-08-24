from sqlalchemy import Column, String, Integer, Boolean, Enum
from app.core.database import Base
from app.common.enums import PaymentType

class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    type = Column(Enum(PaymentType), server_default=PaymentType.COD)
