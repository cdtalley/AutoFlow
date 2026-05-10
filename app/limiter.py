"""Rate limiter for public ingress (webhook). Uses in-memory storage by default for local dev."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings


def _storage_uri() -> str:
    s = get_settings()
    if (s.RATE_LIMIT_STORAGE or "memory").lower() == "redis":
        return s.REDIS_URL
    return "memory://"


limiter = Limiter(key_func=get_remote_address, storage_uri=_storage_uri(), headers_enabled=True)
