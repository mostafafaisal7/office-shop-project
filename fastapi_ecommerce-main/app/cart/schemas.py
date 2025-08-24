from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any

class CartItemBase(BaseModel):
    product_id: int
    product_name: str
    product_price: float
    quantity: int = 1
    size: Optional[str] = None
    color: Optional[str] = None
    customization_id: Optional[int] = None

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: Optional[int] = None
    size: Optional[str] = None
    color: Optional[str] = None
    customization_id: Optional[int] = None
    
class UpdateCartQuantity(BaseModel):
    cart_item_id: int
    quantity: int

class DeleteCartItemsRequest(BaseModel):
    item_ids: List[int]

class CartItemResponse(CartItemBase):
    id: int
    user_id: Optional[int]
    guest_id: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class CustomizationDetails(BaseModel):
    """Schema for customization details fetched from products service"""
    model_config = ConfigDict(extra='allow')  # Allow extra fields from API response
    
    # Make all fields optional to handle any API response structure
    id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    options: Optional[Dict[str, Any]] = None
    price_adjustment: Optional[float] = None
    # Add more fields as needed based on the actual API response

class CartItemWithCustomizationResponse(CartItemBase):
    id: int
    user_id: Optional[int]
    guest_id: Optional[str]
    customization_details: Optional[CustomizationDetails] = None

    model_config = ConfigDict(from_attributes=True)
