"""
Background execution of LangGraph inquiry runs.

Kept out of the webhook router so routing stays thin and this unit is
testable / replaceable (e.g. swap to a queue worker without changing HTTP shape).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.utils.state_json import state_json_safe

logger = logging.getLogger(__name__)


async def process_inquiry_run(
    run_id: str,
    initial_state: dict[str, Any],
    subject: str,
    *,
    graph: Any,
    redis_memory: Any,
    ws_manager: Any,
) -> None:
    from app.db.database import async_session_factory, save_run

    db_session = async_session_factory()
    try:
        config = {"configurable": {"thread_id": run_id}}
        final_state = await asyncio.to_thread(graph.invoke, initial_state, config)
        await save_run(db_session, final_state, subject)
        state_dict = dict(final_state)
        redis_memory.set_run_state(run_id, state_dict)
        for step in final_state.get("agent_steps", []):
            redis_memory.append_step(run_id, step)
        await ws_manager.broadcast_to_run(
            run_id, {"type": "completed", "state": state_json_safe(state_dict)}
        )
    except Exception as exc:
        logger.exception("Graph run failed run_id=%s", run_id)
        error_state = {**initial_state, "status": "error", "error": str(exc)}
        redis_memory.set_run_state(run_id, error_state)
        await save_run(db_session, error_state, subject)
        await ws_manager.broadcast_to_run(
            run_id,
            {"type": "error", "error": str(exc), "state": state_json_safe(error_state)},
        )
    finally:
        await db_session.close()
