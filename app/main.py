import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.agents.faq_agent import FAQAgent
from app.agents.handoff_agent import HandoffAgent
from app.agents.lead_agent import LeadAgent
from app.agents.orchestrator import build_graph
from app.agents.support_agent import SupportAgent
from app.config import get_settings
from app.db.database import init_db
from app.memory.redis_memory import RedisMemory
from app.routers import runs, status, webhook
from app.tools.crm_tool import CRMTool
from app.tools.email_tool import EmailTool
from app.tools.knowledge_tool import KnowledgeTool
from app.utils.ollama_client import OllamaClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_ollama_client = None
_redis_memory = None
_graph = None
_websocket_manager = None


class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, run_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(run_id, []).append(websocket)

    def disconnect(self, run_id: str, websocket: WebSocket):
        if run_id in self.active_connections and websocket in self.active_connections[run_id]:
            self.active_connections[run_id].remove(websocket)
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]

    async def broadcast_to_run(self, run_id: str, message: dict):
        clients = self.active_connections.get(run_id, [])
        for ws in list(clients):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(run_id, ws)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _ollama_client, _redis_memory, _graph, _websocket_manager

    settings = get_settings()
    await init_db()

    _ollama_client = OllamaClient(settings.OLLAMA_BASE_URL, settings.LLM_MODEL)
    _redis_memory = RedisMemory(settings.REDIS_URL)

    knowledge_tool = KnowledgeTool()
    crm_tool = CRMTool()
    email_tool = EmailTool()

    faq_agent = FAQAgent()
    lead_agent = LeadAgent()
    support_agent = SupportAgent()
    handoff_agent = HandoffAgent()

    _graph = build_graph(
        ollama_client=_ollama_client,
        faq_agent=faq_agent,
        lead_agent=lead_agent,
        support_agent=support_agent,
        handoff_agent=handoff_agent,
        email_tool=email_tool,
        knowledge_tool=knowledge_tool,
        crm_tool=crm_tool,
    )
    _websocket_manager = WebSocketManager()

    logger.info("Ollama healthy: %s", _ollama_client.health_check())
    logger.info("Redis healthy: %s", _redis_memory.health_check())

    yield
    logger.info("AutoFlow shutting down")


app = FastAPI(
    title="AutoFlow",
    description="Multi-Agent Business Process Automation - powered by local Ollama",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook.router, prefix="/api/v1", tags=["Webhook"])
app.include_router(status.router, prefix="/api/v1", tags=["Status"])
app.include_router(runs.router, prefix="/api/v1", tags=["Runs"])


def get_ollama_client() -> OllamaClient | None:
    return _ollama_client


def get_redis_memory() -> RedisMemory:
    return _redis_memory


def get_graph():
    return _graph


def get_websocket_manager() -> WebSocketManager:
    return _websocket_manager


@app.get("/health")
async def health():
    db_ok = True
    try:
        pass
    except Exception:
        db_ok = False
    return {
        "ollama": _ollama_client.health_check() if _ollama_client else False,
        "redis": _redis_memory.health_check() if _redis_memory else False,
        "db": db_ok,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/")
async def root():
    return {"message": "AutoFlow API", "docs": "/docs"}
