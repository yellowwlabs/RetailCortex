import asyncio
import time

import httpx
from jose import JWTError, jwt

from src.config import settings

_CLERK_API = "https://api.clerk.com/v1"

_jwks_cache: dict = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600
_jwks_lock = asyncio.Lock()


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and (time.time() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    async with _jwks_lock:
        # Re-check after acquiring lock — another coroutine may have fetched already
        if _jwks_cache and (time.time() - _jwks_fetched_at) < _JWKS_TTL:
            return _jwks_cache

        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.clerk_jwks_url, timeout=10)
            resp.raise_for_status()

        _jwks_cache = resp.json()
        _jwks_fetched_at = time.time()

    return _jwks_cache


async def verify_clerk_token(token: str) -> dict:
    jwks = await _get_jwks()
    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise ValueError(str(exc)) from exc

    if payload.get("sub") is None:
        raise ValueError("Token missing sub claim")

    return payload


async def set_user_public_metadata(clerk_user_id: str, metadata: dict) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{_CLERK_API}/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            json={"public_metadata": metadata},
            timeout=10,
        )
        resp.raise_for_status()
