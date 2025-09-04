# app/products/utils/media_utils.py
from app.core.config import BASE_URL
from typing import List, Union
from app.products import schemas

def convert_customization_option_media(option: Union[schemas.CustomizationOptionResponse, List[schemas.CustomizationOptionResponse]]):
    """Convert media file paths to full URLs for frontend."""
    if isinstance(option, list):
        for o in option:
            o.media = [
                m.model_copy(update={"file_path": f"{BASE_URL}{m.file_path}"})
                for m in o.media
            ]
    else:
        option.media = [
            m.model_copy(update={"file_path": f"{BASE_URL}{m.file_path}"})
            for m in option.media
        ]
    return option
