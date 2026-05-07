from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "llama3"
    REDIS_URL: str = "redis://localhost:6379"
    DATABASE_URL: str = "postgresql+asyncpg://autoflow:autoflow@localhost:5432/autoflow"
    SYNC_DATABASE_URL: str = "postgresql://autoflow:autoflow@localhost:5432/autoflow"
    ESCALATION_CONFIDENCE_THRESHOLD: float = 0.4
    MAX_AGENT_ITERATIONS: int = 5
    WEBSOCKET_HEARTBEAT_SECONDS: int = 30
    APP_ENV: str = "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
