from app.core.config import BASE_URL
from typing import List, Union, Optional
from app.products import schemas, models

def convert_file_path_to_url(file_path: str) -> str:
    """Convert a file path to a full URL using BASE_URL."""
    if not file_path:
        return ""
    
    # If it's already a full URL, check if it needs path correction
    if file_path.startswith(('http://', 'https://')):
        # Fix URLs that have /uploads/ instead of /images/
        if '/uploads/' in file_path:
            file_path = file_path.replace('/uploads/', '/images/')
        return file_path
    
    # If it starts with /uploads/, convert to /images/
    if file_path.startswith('/uploads/'):
        file_path = file_path.replace('/uploads/', '/images/')
        return f"{BASE_URL}{file_path}"
    
    # If it starts with /images/, it's already in the correct format for static serving
    if file_path.startswith('/images/'):
        return f"{BASE_URL}{file_path}"
    
    # If it's a relative path like "products/filename.jpg", convert to /images/products/filename.jpg
    if not file_path.startswith('/'):
        file_path = f"/images/{file_path}"
    
    return f"{BASE_URL}{file_path}"

def convert_media_to_url(media_list: List[Union[schemas.ProductMediaResponse, schemas.VariationMediaResponse, schemas.CustomizationOptionMediaResponse, models.ProductMedia, models.VariationMedia, models.CustomizationOptionMedia]]):
    """Convert media file paths to full URLs for the frontend."""
    if not media_list:
        return []
    
    converted_media = []
    for media in media_list:
        if hasattr(media, "model_copy"):
            # Pydantic model
            converted_media.append(
                media.model_copy(update={"file_path": convert_file_path_to_url(media.file_path)})
            )
        elif hasattr(media, "file_path"):
            # SQLAlchemy model or dict-like object
            if hasattr(media, "__dict__"):
                # SQLAlchemy model - modify in place
                media.file_path = convert_file_path_to_url(media.file_path)
                converted_media.append(media)
            else:
                # Dict-like object
                converted_media.append({**media, "file_path": convert_file_path_to_url(media["file_path"])})
        else:
            converted_media.append(media)
    
    return converted_media

def convert_product_media_urls(product: Union[schemas.ProductResponse, schemas.ProductWithReviewsResponse, models.Product]) -> Union[schemas.ProductResponse, schemas.ProductWithReviewsResponse, models.Product]:
    """Convert all media URLs in a product and its nested relationships."""
    if not product:
        return product
    
    # Convert product media
    if hasattr(product, 'media') and product.media:
        product.media = convert_media_to_url(product.media)
    
    # Convert variation media
    if hasattr(product, 'variations') and product.variations:
        for variation in product.variations:
            if hasattr(variation, 'media') and variation.media:
                variation.media = convert_media_to_url(variation.media)
    
    # Convert customization option media
    if hasattr(product, 'customization_options') and product.customization_options:
        for option in product.customization_options:
            if hasattr(option, 'media') and option.media:
                option.media = convert_media_to_url(option.media)
    
    return product

def convert_products_media_urls(products: List[Union[schemas.ProductResponse, schemas.ProductWithReviewsResponse, models.Product]]) -> List[Union[schemas.ProductResponse, schemas.ProductWithReviewsResponse, models.Product]]:
    """Convert all media URLs in a list of products."""
    return [convert_product_media_urls(product) for product in products]

def convert_variation_media_urls(variation: Union[schemas.ProductVariationResponse, models.ProductVariation]) -> Union[schemas.ProductVariationResponse, models.ProductVariation]:
    """Convert media URLs in a product variation."""
    if hasattr(variation, 'media') and variation.media:
        variation.media = convert_media_to_url(variation.media)
    return variation

def convert_customization_option_media_urls(option: Union[schemas.CustomizationOptionResponse, models.CustomizationOption]) -> Union[schemas.CustomizationOptionResponse, models.CustomizationOption]:
    """Convert media URLs in a customization option."""
    if hasattr(option, 'media') and option.media:
        option.media = convert_media_to_url(option.media)
    return option
