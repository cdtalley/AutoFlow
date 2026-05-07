from collections.abc import AsyncGenerator

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import get_settings
from app.models.state import AgentState

settings = get_settings()
engine = create_async_engine(settings.DATABASE_URL, future=True, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


async def init_db() -> None:
    from app.db.models import RunRecord

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def save_run(db: AsyncSession, state: AgentState, subject: str) -> None:
    from app.db.models import RunRecord

    result = await db.execute(select(RunRecord).where(RunRecord.run_id == state["run_id"]))
    existing = result.scalar_one_or_none()

    payload = {
        "status": state.get("status", "running"),
        "intent": state.get("intent", ""),
        "intent_confidence": float(state.get("intent_confidence", 0.0)),
        "sender_name": state.get("sender_name", ""),
        "sender_email": state.get("sender_email", ""),
        "subject": subject,
        "raw_input": state.get("raw_input", ""),
        "final_response": state.get("final_response"),
        "lead_score": state.get("lead_score"),
        "lead_tier": state.get("lead_tier"),
        "escalate": bool(state.get("escalate", False)),
        "escalation_reason": state.get("escalation_reason"),
        "agent_steps": state.get("agent_steps", []),
    }

    if existing is None:
        db.add(RunRecord(run_id=state["run_id"], **payload))
    else:
        for key, value in payload.items():
            setattr(existing, key, value)

    await db.commit()


async def get_run(db: AsyncSession, run_id: str):
    from app.db.models import RunRecord

    result = await db.execute(select(RunRecord).where(RunRecord.run_id == run_id))
    return result.scalar_one_or_none()


async def list_runs(db: AsyncSession, limit: int = 50):
    from app.db.models import RunRecord

    result = await db.execute(select(RunRecord).order_by(RunRecord.created_at.desc()).limit(limit))
    return list(result.scalars().all())


async def delete_run(db: AsyncSession, run_id: str) -> bool:
    from app.db.models import RunRecord

    result = await db.execute(delete(RunRecord).where(RunRecord.run_id == run_id))
    await db.commit()
    return result.rowcount > 0
