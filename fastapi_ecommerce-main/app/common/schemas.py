from pydantic import BaseModel

class CurrentUser(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    is_verified: bool