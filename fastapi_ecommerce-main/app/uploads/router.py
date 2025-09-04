import os
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from typing import Annotated
from app.core.config import BASE_URL  

router = APIRouter()

# Base directory where images are stored
BASE_IMAGE_DIR = "app/static"

# Allowed upload types (maps to subdirectories in BASE_IMAGE_DIR)
ALLOWED_UPLOAD_TYPES = ["products", "users", "categories"]

@router.post("/image", summary="Upload an image")
async def upload_image(
    upload_type: Annotated[str, Form(description=f"The type of upload. Must be one of: {', '.join(ALLOWED_UPLOAD_TYPES)}")],
    file: UploadFile = File(...)
):
    """
    Handles image uploads and saves them to the appropriate directory based on `upload_type`.

    - **upload_type**: Specifies the destination folder (e.g., 'products').
    - **file**: The image file to upload.

    Returns the web-accessible URL of the uploaded image.
    """
    # 1. Validate the upload type
    if upload_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid upload type. Must be one of: {', '.join(ALLOWED_UPLOAD_TYPES)}"
        )

    # 2. Create a unique filename to prevent conflicts
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # 3. Construct the full save path
    #    e.g., "app/static/products/your-unique-filename.jpg"
    save_path = os.path.join(BASE_IMAGE_DIR, upload_type, unique_filename)

    # 4. Save the file to the server
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        # If something goes wrong during file save, return an error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"There was an error uploading the file: {e}"
        )
    finally:
        file.file.close()

    # 5. Construct the web-accessible URL for the frontend
    #    This matches the /images mount point in your main.py
    #    e.g., "/images/products/your-unique-filename.jpg"
    image_url = f"{BASE_URL}/images/{upload_type}/{unique_filename}"
    return {"image_url": image_url}

