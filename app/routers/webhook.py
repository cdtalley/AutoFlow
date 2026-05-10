import asyncio
import logging
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.database import get_db, save_run
from app.limiter import limiter
from app.models.schemas import InquiryRequest, WebhookResponse
from app.routers.auth_deps import require_webhook_api_key
from app.runtime import get_graph, get_redis_memory, get_websocket_manager

router = APIRouter()
logger = logging.getLogger(__name__)

_WEBHOOK_RL = get_settings().WEBHOOK_RATE_LIMIT


def _normalize_idempotency_key(raw: str | None) -> str | None:
    if raw is None:
        return None
    s = raw.strip()
    if not s:
        return None
    return s[:256]


@router.post("/webhook", response_model=WebhookResponse)
@limiter.limit(_WEBHOOK_RL)
async def webhook(
    request: Request,
    body: InquiryRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_webhook_api_key),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    graph = get_graph()
    redis_memory = get_redis_memory()
    ws_manager = get_websocket_manager()
    if graph is None:
        raise HTTPException(status_code=503, detail="Graph not initialized")

    settings = get_settings()
    idem = _normalize_idempotency_key(idempotency_key)

    if idem:
        existing = redis_memory.get_idempotent_run_id(idem)
        if existing:
            return WebhookResponse(
                run_id=existing,
                status="running",
                message="Same Idempotency-Key: returning existing run (no duplicate work enqueued).",
                poll_url=f"/api/v1/status/{existing}",
                idempotent_replay=True,
            )
        run_id = str(uuid4())
        if not redis_memory.claim_idempotent_run_id(idem, run_id, settings.IDEMPOTENCY_TTL_SECONDS):
            winner = redis_memory.get_idempotent_run_id(idem) or run_id
            return WebhookResponse(
                run_id=winner,
                status="running",
                message="Same Idempotency-Key: returning existing run (no duplicate work enqueued).",
                poll_url=f"/api/v1/status/{winner}",
                idempotent_replay=True,
            )
    else:
        run_id = str(uuid4())

    raw_input = f"{body.subject}\n\n{body.body}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    initial_state = {
        "run_id": run_id,
        "messages": [HumanMessage(content=raw_input)],
        "raw_input": raw_input,
        "sender_name": body.sender_name,
        "sender_email": body.sender_email,
        "intent": "",
        "intent_confidence": 0.0,
        "lead_score": None,
        "lead_tier": None,
        "resolution_draft": None,
        "escalate": False,
        "escalation_reason": None,
        "current_agent": "orchestrator",
        "agent_steps": [],
        "final_response": None,
        "status": "running",
        "error": None,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    redis_memory.set_run_state(run_id, initial_state)
    await save_run(db, initial_state, body.subject)

    async def run_graph_background(run_id_value: str, initial_state_value: dict, subject: str):
        from app.db.database import async_session_factory

        db_session = async_session_factory()
        try:
            config = {"configurable": {"thread_id": run_id_value}}
            final_state = await asyncio.to_thread(graph.invoke, initial_state_value, config)
            await save_run(db_session, final_state, subject)
            redis_memory.set_run_state(run_id_value, dict(final_state))
            for step in final_state.get("agent_steps", []):
                redis_memory.append_step(run_id_value, step)
            await ws_manager.broadcast_to_run(run_id_value, {"type": "completed", "state": dict(final_state)})
        except Exception as exc:
            logger.exception("Graph run failed run_id=%s", run_id_value)
            error_state = {**initial_state_value, "status": "error", "error": str(exc)}
            redis_memory.set_run_state(run_id_value, error_state)
            await save_run(db_session, error_state, subject)
            await ws_manager.broadcast_to_run(run_id_value, {"type": "error", "error": str(exc)})
        finally:
            await db_session.close()

    background_tasks.add_task(run_graph_background, run_id, initial_state, body.subject)

    return WebhookResponse(
        run_id=run_id,
        status="running",
        message="Inquiry received and processing",
        poll_url=f"/api/v1/status/{run_id}",
        idempotent_replay=False,
    )
