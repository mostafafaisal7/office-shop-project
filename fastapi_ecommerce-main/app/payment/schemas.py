from pydantic import BaseModel, ConfigDict
from typing import Optional
from enum import Enum

class PaymentType(str, Enum):
    CARD = "card"
    PAYPAL = "paypal"
    COD = "cod"

class PaymentMethodCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    type: PaymentType

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    type: Optional[str] = None

class PaymentMethodOut(PaymentMethodCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
