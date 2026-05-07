import asyncio
import logging
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db, save_run
from app.main import get_graph, get_redis_memory, get_websocket_manager
from app.models.schemas import InquiryRequest, WebhookResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhook", response_model=WebhookResponse)
async def webhook(
    request: InquiryRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    graph = get_graph()
    redis_memory = get_redis_memory()
    ws_manager = get_websocket_manager()
    if graph is None:
        raise HTTPException(status_code=503, detail="Graph not initialized")

    run_id = str(uuid4())
    raw_input = f"{request.subject}\n\n{request.body}"
    initial_state = {
        "run_id": run_id,
        "messages": [HumanMessage(content=raw_input)],
        "raw_input": raw_input,
        "sender_name": request.sender_name,
        "sender_email": request.sender_email,
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
    }

    redis_memory.set_run_state(run_id, initial_state)
    await save_run(db, initial_state, request.subject)

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
            logger.exception("Graph run failed")
            error_state = {**initial_state_value, "status": "error", "error": str(exc)}
            redis_memory.set_run_state(run_id_value, error_state)
            await save_run(db_session, error_state, subject)
            await ws_manager.broadcast_to_run(run_id_value, {"type": "error", "error": str(exc)})
        finally:
            await db_session.close()

    background_tasks.add_task(run_graph_background, run_id, initial_state, request.subject)

    return WebhookResponse(
        run_id=run_id,
        status="running",
        message="Inquiry received and processing",
        poll_url=f"/api/v1/status/{run_id}",
    )
