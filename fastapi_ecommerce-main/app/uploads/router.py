# app/uploads/router.py
import os
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status, Depends
from typing import Annotated, Optional
from app.core.config import BASE_URL
from app.common.dependencies import get_current_user_optional,get_current_user


from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


router = APIRouter()

BASE_IMAGE_DIR = "app/static"
ALLOWED_UPLOAD_TYPES = ["products", "users", "categories", "previews"]



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




























# User/customer preview upload
@router.post("/image_user", summary="Upload user preview image")
async def upload_preview_image(
    upload_type: Annotated[
        str,
        Form(description=f"Must be one of: {', '.join(ALLOWED_UPLOAD_TYPES)}")
    ],
    file: UploadFile = File(...),
    guest_id: Optional[str] = Form(None),
    current_user: Optional["User"] = Depends(get_current_user_optional)
):
    if upload_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid upload type. Must be one of: {', '.join(ALLOWED_UPLOAD_TYPES)}"
        )

    # Determine folder
    if current_user and getattr(current_user, "id", None):
        subfolder = f"user_{current_user.id}"  # logged-in user
    elif guest_id:
        subfolder = f"guest_{guest_id}"        # guest user
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guest ID is required for non-authenticated uploads"
        )

    # Save directory (folder reused for all uploads)
    save_dir = os.path.join(BASE_IMAGE_DIR, upload_type, subfolder)
    os.makedirs(save_dir, exist_ok=True)

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    save_path = os.path.join(save_dir, unique_filename)

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving the file: {e}"
        )
    finally:
        file.file.close()

    image_url = f"{BASE_URL}/images/{upload_type}/{subfolder}/{unique_filename}"

    return {"image_url": image_url, "subfolder": subfolder, "filename": unique_filename}



from fastapi.responses import JSONResponse

@router.get("/images/{upload_type}", summary="Get uploaded images")
async def list_uploaded_images(
    upload_type: str,
    guest_id: Optional[str] = None,
    current_user: Optional["User"] = Depends(get_current_user_optional)
):
    """
    Returns a list of uploaded images URLs for logged-in user or guest.
    """
    if upload_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid upload type. Must be one of: {', '.join(ALLOWED_UPLOAD_TYPES)}"
        )

    # Determine folder
    if current_user and getattr(current_user, "id", None):
        subfolder = f"user_{current_user.id}"
    elif guest_id:
        subfolder = f"guest_{guest_id}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guest ID is required for non-authenticated users"
        )

    folder_path = os.path.join(BASE_IMAGE_DIR, upload_type, subfolder)
    if not os.path.exists(folder_path):
        return JSONResponse(content={"images": []})

    files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
    urls = [f"{BASE_URL}/images/{upload_type}/{subfolder}/{f}" for f in files]

    return {"images": urls}



def migrate_guest_images_to_user(guest_id: str, user_id: int):
    for upload_type in ALLOWED_UPLOAD_TYPES:
        guest_folder = os.path.join(BASE_IMAGE_DIR, upload_type, f"guest_{guest_id}")
        user_folder = os.path.join(BASE_IMAGE_DIR, upload_type, f"user_{user_id}")

        if os.path.exists(guest_folder):
            os.makedirs(user_folder, exist_ok=True)

            for filename in os.listdir(guest_folder):
                src = os.path.join(guest_folder, filename)

                if not os.path.isfile(src):
                    continue

                dst = os.path.join(user_folder, filename)

                # 🔹 Prevent overwrites by renaming
                if os.path.exists(dst):
                    name, ext = os.path.splitext(filename)
                    new_filename = f"{name}_{uuid.uuid4().hex}{ext}"
                    dst = os.path.join(user_folder, new_filename)
                    logger.warning(f"Filename conflict: {filename}, renamed to {new_filename}")

                try:
                    shutil.move(src, dst)
                    logger.info(f"Migrated {src} → {dst}")
                except Exception as e:
                    logger.error(f"Failed to migrate {src}: {e}")

            # Try removing empty guest folder
            try:
                os.rmdir(guest_folder)
            except OSError:
                pass


@router.post("/migrate-guest-images", summary="Migrate guest images to user after login")
async def migrate_guest_images(
    guest_id: str = Form(...),
    current_user: "User" = Depends(get_current_user)
):
    if not current_user or not getattr(current_user, "id", None):
        raise HTTPException(status_code=401, detail="User authentication required")

    migrated_urls = []

    for upload_type in ALLOWED_UPLOAD_TYPES:
        guest_folder = os.path.join(BASE_IMAGE_DIR, upload_type, f"guest_{guest_id}")
        user_folder = os.path.join(BASE_IMAGE_DIR, upload_type, f"user_{current_user.id}")

        if os.path.exists(guest_folder):
            os.makedirs(user_folder, exist_ok=True)

            for filename in os.listdir(guest_folder):
                src = os.path.join(guest_folder, filename)
                if not os.path.isfile(src):
                    continue

                dst = os.path.join(user_folder, filename)
                if os.path.exists(dst):
                    name, ext = os.path.splitext(filename)
                    filename = f"{name}_{uuid.uuid4().hex}{ext}"
                    dst = os.path.join(user_folder, filename)

                shutil.move(src, dst)

                # build URL for frontend
                url = f"{BASE_URL}/images/{upload_type}/user_{current_user.id}/{filename}"
                migrated_urls.append(url)

            try:
                os.rmdir(guest_folder)
            except OSError:
                pass

    return {
        "detail": "Guest images migrated successfully",
        "images": migrated_urls
    }
