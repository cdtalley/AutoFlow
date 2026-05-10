"""Optional route guards for production deployments."""

import secrets

from fastapi import Header, HTTPException

from app.config import get_settings


async def require_webhook_api_key(x_api_key: str | None = Header(None, alias="X-API-Key")) -> None:
    """
    When WEBHOOK_API_KEY is set in the environment, POST /webhook must send
    the same value in the X-API-Key header (timing-safe compare).
    """
    expected = get_settings().WEBHOOK_API_KEY
    if not expected:
        return
    if x_api_key is None:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    if len(x_api_key) != len(expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    if not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


async def require_admin_api_key(x_admin_key: str | None = Header(None, alias="X-Admin-Key")) -> None:
    """When AUTOFLOW_ADMIN_API_KEY is set, destructive admin routes require X-Admin-Key."""
    expected = get_settings().AUTOFLOW_ADMIN_API_KEY
    if not expected:
        return
    if x_admin_key is None:
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")
    if len(x_admin_key) != len(expected):
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")
    if not secrets.compare_digest(x_admin_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")


def verify_websocket_ingest_token(token: str | None) -> bool:
    """If WEBHOOK_API_KEY is configured, WS clients must pass the same value as query ?token=."""
    expected = get_settings().WEBHOOK_API_KEY
    if not expected:
        return True
    if token is None:
        return False
    if len(token) != len(expected):
        return False
    return secrets.compare_digest(token, expected)
