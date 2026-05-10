"""Pure helpers for webhook responses (no FastAPI request objects)."""

from app.memory.redis_memory import RedisMemory
from app.models.schemas import WebhookResponse


def replay_webhook_response(redis_memory: RedisMemory, run_id: str) -> WebhookResponse:
    """Build response for an idempotent replay using best-known status from Redis."""
    state = redis_memory.get_run_state(run_id)
    status = "running"
    if state and isinstance(state.get("status"), str):
        status = state["status"]
    return WebhookResponse(
        run_id=run_id,
        status=status,
        message="Idempotent replay: same Idempotency-Key; existing run returned.",
        poll_url=f"/api/v1/status/{run_id}",
        idempotent_replay=True,
    )
