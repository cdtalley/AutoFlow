import asyncio
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.database import get_db, get_run
from app.main import get_redis_memory, get_websocket_manager
from app.models.schemas import RunStatus

router = APIRouter()


@router.get("/status/{run_id}", response_model=RunStatus)
async def status(run_id: str, db: AsyncSession = Depends(get_db)):
    redis_memory = get_redis_memory()
    state = redis_memory.get_run_state(run_id)

    if state is not None:
        now = datetime.utcnow().isoformat()
        return RunStatus(
            run_id=run_id,
            status=state.get("status", "running"),
            intent=state.get("intent", ""),
            intent_confidence=float(state.get("intent_confidence", 0.0)),
            current_agent=state.get("current_agent", "orchestrator"),
            agent_steps=state.get("agent_steps", []),
            final_response=state.get("final_response"),
            lead_score=state.get("lead_score"),
            lead_tier=state.get("lead_tier"),
            escalate=bool(state.get("escalate", False)),
            escalation_reason=state.get("escalation_reason"),
            created_at=state.get("created_at", now),
            updated_at=state.get("updated_at", now),
        )

    record = await get_run(db, run_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Run not found")

    return RunStatus(
        run_id=record.run_id,
        status=record.status,
        intent=record.intent,
        intent_confidence=float(record.intent_confidence),
        current_agent=(record.agent_steps[-1]["agent"] if record.agent_steps else "orchestrator"),
        agent_steps=record.agent_steps,
        final_response=record.final_response,
        lead_score=record.lead_score,
        lead_tier=record.lead_tier,
        escalate=record.escalate,
        escalation_reason=record.escalation_reason,
        created_at=record.created_at.isoformat(),
        updated_at=record.updated_at.isoformat(),
    )


@router.get("/status/{run_id}/steps")
async def steps(run_id: str):
    return get_redis_memory().get_steps(run_id)


@router.websocket("/ws/{run_id}")
async def ws_run(websocket: WebSocket, run_id: str):
    manager = get_websocket_manager()
    redis_memory = get_redis_memory()
    settings = get_settings()

    await manager.connect(run_id, websocket)
    current = redis_memory.get_run_state(run_id)
    if current is not None:
        await websocket.send_json({"type": "snapshot", "state": current})

    try:
        while True:
            await asyncio.sleep(settings.WEBSOCKET_HEARTBEAT_SECONDS)
            await websocket.send_json({"type": "heartbeat", "timestamp": datetime.utcnow().isoformat()})
    except WebSocketDisconnect:
        manager.disconnect(run_id, websocket)
