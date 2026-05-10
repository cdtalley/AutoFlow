from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import delete_run, get_db, get_run, list_runs
from app.models.schemas import RunListItem, RunStatus
from app.routers.auth_deps import require_admin_api_key
from app.runtime import get_redis_memory

router = APIRouter()


@router.get("/runs", response_model=list[RunListItem])
async def runs(db: AsyncSession = Depends(get_db)):
    records = await list_runs(db, limit=50)
    return [
        RunListItem(
            run_id=r.run_id,
            status=r.status,
            intent=r.intent,
            sender_name=r.sender_name,
            sender_email=r.sender_email,
            subject=r.subject,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]


@router.get("/runs/{run_id}", response_model=RunStatus)
async def run_detail(run_id: str, db: AsyncSession = Depends(get_db)):
    r = await get_run(db, run_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Run not found")

    return RunStatus(
        run_id=r.run_id,
        status=r.status,
        intent=r.intent,
        intent_confidence=float(r.intent_confidence),
        current_agent=(r.agent_steps[-1]["agent"] if r.agent_steps else "orchestrator"),
        agent_steps=r.agent_steps,
        final_response=r.final_response,
        lead_score=r.lead_score,
        lead_tier=r.lead_tier,
        escalate=r.escalate,
        escalation_reason=r.escalation_reason,
        created_at=r.created_at.isoformat(),
        updated_at=r.updated_at.isoformat(),
    )


@router.delete("/runs/{run_id}")
async def delete_run_endpoint(
    run_id: str,
    _: None = Depends(require_admin_api_key),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_run(db, run_id)
    get_redis_memory().delete_run_keys(run_id)
    return {"deleted": deleted, "run_id": run_id}
