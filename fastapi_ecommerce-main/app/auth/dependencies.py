from typing import Optional
from fastapi import Depends, HTTPException
from app.common.dependencies import get_current_user

async def get_current_user_optional(
    user=Depends(get_current_user),
) -> Optional[dict]:
    try:
        return user
    except HTTPException:
        # If no/invalid token → just return None
        return None
