# app/products/utils/media_utils.py
from app.utils.media import convert_customization_option_media_urls
from typing import List, Union
from app.products import schemas

def convert_customization_option_media(option: Union[schemas.CustomizationOptionResponse, List[schemas.CustomizationOptionResponse]]):
    """Convert media file paths to full URLs for frontend."""
    if isinstance(option, list):
        return [convert_customization_option_media_urls(o) for o in option]
    else:
        return convert_customization_option_media_urls(option)
