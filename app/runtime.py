"""
Process-wide singletons populated during FastAPI lifespan.

Routers import from here to avoid circular imports with app.main.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.memory.redis_memory import RedisMemory
    from app.utils.ollama_client import OllamaClient
    from app.websocket_manager import WebSocketManager

ollama_client: "OllamaClient | None" = None
redis_memory: "RedisMemory | None" = None
graph: Any = None
websocket_manager: "WebSocketManager | None" = None


def get_ollama_client() -> "OllamaClient | None":
    return ollama_client


def get_redis_memory() -> "RedisMemory":
    if redis_memory is None:
        raise RuntimeError("Redis not initialized")
    return redis_memory


def get_graph() -> Any:
    return graph


def get_websocket_manager() -> "WebSocketManager":
    if websocket_manager is None:
        raise RuntimeError("WebSocket manager not initialized")
    return websocket_manager
