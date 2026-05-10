from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "llama3"
    REDIS_URL: str = "redis://localhost:6379"
    DATABASE_URL: str = "postgresql+asyncpg://autoflow:autoflow@localhost:5433/autoflow"
    SYNC_DATABASE_URL: str = "postgresql://autoflow:autoflow@localhost:5433/autoflow"
    ESCALATION_CONFIDENCE_THRESHOLD: float = 0.4
    MAX_AGENT_ITERATIONS: int = 5
    WEBSOCKET_HEARTBEAT_SECONDS: int = 30
    APP_ENV: str = "development"
    # Comma-separated origins; use "*" for dev only. Production: https://app.example.com,https://www.example.com
    CORS_ORIGINS: str = "*"
    # If set, POST /api/v1/webhook requires header X-API-Key: <value>
    WEBHOOK_API_KEY: str | None = None
    # If set, DELETE /api/v1/runs/{run_id} requires header X-Admin-Key: <value>
    AUTOFLOW_ADMIN_API_KEY: str | None = None
    LOG_LEVEL: str = "INFO"
    # slowapi limit for POST /webhook (per client IP). Examples: "60/minute", "100/hour"
    WEBHOOK_RATE_LIMIT: str = "60/minute"
    # "memory" = single process only; "redis" = shared limiter state across workers
    RATE_LIMIT_STORAGE: str = "memory"
    # How long Idempotency-Key maps to the same run_id (seconds)
    IDEMPOTENCY_TTL_SECONDS: int = 86400


@lru_cache
def get_settings() -> Settings:
    return Settings()
