from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from langchain_core.messages import HumanMessage
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.database import get_db, save_run
from app.limiter import limiter
from app.models.schemas import InquiryRequest, WebhookResponse
from app.routers.auth_deps import require_webhook_api_key
from app.routers.webhook_helpers import replay_webhook_response
from app.runtime import get_graph, get_redis_memory, get_websocket_manager
from app.services.graph_execution import process_inquiry_run

router = APIRouter()

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
    response: Response,
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
            return replay_webhook_response(redis_memory, existing)
        run_id = str(uuid4())
        if not redis_memory.claim_idempotent_run_id(idem, run_id, settings.IDEMPOTENCY_TTL_SECONDS):
            winner = redis_memory.get_idempotent_run_id(idem) or run_id
            return replay_webhook_response(redis_memory, winner)
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

    background_tasks.add_task(
        process_inquiry_run,
        run_id,
        initial_state,
        body.subject,
        graph=graph,
        redis_memory=redis_memory,
        ws_manager=ws_manager,
    )

    return WebhookResponse(
        run_id=run_id,
        status="running",
        message="Inquiry received and processing",
        poll_url=f"/api/v1/status/{run_id}",
        idempotent_replay=False,
    )
