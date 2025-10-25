# common/http.py

import httpx
from typing import Optional

# Set aggressive timeout for microservice calls to prevent blocking
# Total timeout of 2 seconds (connect: 0.5s, read: 1.5s)
DEFAULT_TIMEOUT = httpx.Timeout(2.0, connect=0.5)


async def http_post(url: str, data: dict, headers: Optional[dict] = None, timeout: Optional[httpx.Timeout] = None):
    """HTTP POST with timeout to prevent blocking"""
    async with httpx.AsyncClient(timeout=timeout or DEFAULT_TIMEOUT) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()


async def http_get(url: str, headers: Optional[dict] = None, timeout: Optional[httpx.Timeout] = None):
    """HTTP GET with timeout to prevent blocking"""
    async with httpx.AsyncClient(timeout=timeout or DEFAULT_TIMEOUT) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()


async def http_delete(url: str, data: Optional[dict] = None, headers: Optional[dict] = None, timeout: Optional[httpx.Timeout] = None):
    """HTTP DELETE with timeout to prevent blocking"""
    async with httpx.AsyncClient(timeout=timeout or DEFAULT_TIMEOUT) as client:
        response = await client.request("DELETE", url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()
