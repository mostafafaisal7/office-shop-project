from typing import Optional, List
from pydantic import BaseModel, field_validator, ValidationInfo, Field
from slugify import slugify


class CategoryBase(BaseModel):
    name: str
    slug: str | None = Field(
        None,
        pattern=r"^[a-z0-9-]+$",
        examples=["gaming-laptops"]
    )
    description: str | None = None
    parent_id: int | None = None
    is_active: bool = True
    sort_order: int = 0

    @field_validator('slug', mode='before')
    @classmethod
    
    def ensure_slug_exists(cls, v: Optional[str], info: ValidationInfo) -> str:
        if not v:
            name = info.data.get('name')
            if not name:
                raise ValueError("Name is required to generate slug")
            return slugify(name)
        return v
    
     
class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = Field(
        None, 
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",  # URL-friendly pattern
        examples=["electronics", "gaming-pcs"]
    )
    description: str | None = None
    parent_id: int | None = None
    is_active: bool | None = None
    sort_order: int | None = None

    @field_validator('slug', mode='before')
    @classmethod
    def generate_slug_if_name_changed(
        cls, 
        v: str | None, 
        info: ValidationInfo
    ) -> str | None:
        if v is None and 'name' in info.data and info.data['name'] is not None:
            return slugify(info.data['name'])
        return v
    

class CategoryOut(CategoryBase):
    id: int
    children: List['CategoryOut'] = []

    class Config:
        from_attributes = True


CategoryOut.model_rebuild()
