from app.core.config import BASE_URL

def convert_media_to_url(media_list):
    """Convert media file paths to full URLs for the frontend."""
    return [
        m.model_copy(update={"file_path": f"{BASE_URL}{m.file_path}"})
        if hasattr(m, "model_copy") else {**m, "file_path": f"{BASE_URL}{m['file_path']}"}
        for m in media_list
    ]
