import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.agents.faq_agent import FAQAgent
from app.agents.handoff_agent import HandoffAgent
from app.agents.lead_agent import LeadAgent
from app.agents.orchestrator import build_graph
from app.agents.support_agent import SupportAgent
from app import runtime as app_runtime
from app.config import get_settings
from app.db import database as db_module
from app.db.database import init_db, ping_db
from app.errors import unhandled_exception_handler, validation_exception_handler
from app.limiter import limiter
from app.memory.redis_memory import RedisMemory
from app.middleware.request_id import RequestIdMiddleware
from app.openapi import build_openapi_schema
from app.routers import runs, status, webhook
from app.tools.crm_tool import CRMTool
from app.tools.email_tool import EmailTool
from app.tools.knowledge_tool import KnowledgeTool
from app.utils.ollama_client import OllamaClient
from app.websocket_manager import WebSocketManager


def _configure_logging() -> None:
    level_name = os.getenv("LOG_LEVEL") or get_settings().LOG_LEVEL
    level = getattr(logging, level_name.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )


_configure_logging()
logger = logging.getLogger(__name__)


def _cors_allow_origins() -> tuple[list[str], bool]:
    raw = get_settings().CORS_ORIGINS.strip()
    if raw == "*":
        return ["*"], False
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["*"], True


def _custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    app.openapi_schema = build_openapi_schema(app)
    return app.openapi_schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await init_db()

    app_runtime.ollama_client = OllamaClient(settings.OLLAMA_BASE_URL, settings.LLM_MODEL)
    app_runtime.redis_memory = RedisMemory(settings.REDIS_URL)

    knowledge_tool = KnowledgeTool()
    crm_tool = CRMTool()
    email_tool = EmailTool()

    faq_agent = FAQAgent()
    lead_agent = LeadAgent()
    support_agent = SupportAgent()
    handoff_agent = HandoffAgent()

    app_runtime.graph = build_graph(
        ollama_client=app_runtime.ollama_client,
        faq_agent=faq_agent,
        lead_agent=lead_agent,
        support_agent=support_agent,
        handoff_agent=handoff_agent,
        email_tool=email_tool,
        knowledge_tool=knowledge_tool,
        crm_tool=crm_tool,
    )
    app_runtime.websocket_manager = WebSocketManager()

    ollama_ok = app_runtime.ollama_client.health_check()
    redis_ok = app_runtime.redis_memory.health_check()
    if not ollama_ok:
        logger.warning(
            "Ollama not reachable at %s — LLM routes may return errors until it is up",
            settings.OLLAMA_BASE_URL,
        )
    if not redis_ok:
        logger.warning("Redis not reachable — status cache, idempotency, and rate limits may fail until it is up")
    logger.info("Ollama healthy: %s | Redis healthy: %s", ollama_ok, redis_ok)

    yield

    try:
        await db_module.engine.dispose()
    except Exception as exc:
        logger.warning("DB engine dispose: %s", exc)

    app_runtime.ollama_client = None
    app_runtime.redis_memory = None
    app_runtime.graph = None
    app_runtime.websocket_manager = None
    logger.info("AutoFlow shutting down")


app = FastAPI(
    title="AutoFlow",
    description="Multi-Agent Business Process Automation — powered by local Ollama",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

origins, allow_credentials = _cors_allow_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIdMiddleware)

app.include_router(webhook.router, prefix="/api/v1", tags=["Webhook"])
app.include_router(status.router, prefix="/api/v1", tags=["Status"])
app.include_router(runs.router, prefix="/api/v1", tags=["Runs"])
app.openapi = _custom_openapi


@app.get("/health")
async def health():
    db_ok = await ping_db()
    ollama = app_runtime.ollama_client.health_check() if app_runtime.ollama_client else False
    redis_ok = app_runtime.redis_memory.health_check() if app_runtime.redis_memory else False
    degraded = not (db_ok and redis_ok)
    return {
        "status": "degraded" if degraded else "ok",
        "ollama": ollama,
        "redis": redis_ok,
        "database": db_ok,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/")
async def root():
    return {"message": "AutoFlow API", "docs": "/docs", "health": "/health"}
