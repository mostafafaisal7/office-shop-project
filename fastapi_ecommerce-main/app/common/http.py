# common/http.py

import httpx
from typing import Optional

async def http_post(url: str, data: dict, headers: Optional[dict] = None):
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()


async def http_get(url: str, headers: Optional[dict] = None):
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()


async def http_delete(url: str, data: Optional[dict] = None, headers: Optional[dict] = None):
    async with httpx.AsyncClient() as client:
        response = await client.request("DELETE", url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()
