"""
Pytest fixtures for HTTP-level tests.

- ``TestClient`` must be used as a context manager so FastAPI lifespan runs
  (Postgres tables, Redis, compiled graph). Module-level ``TestClient(app)``
  skips lifespan and leaves ``app.runtime`` uninitialized — that caused
  ``RuntimeError: Redis not initialized`` on webhook and status routes.

- The ``client`` fixture patches ``build_graph`` to return a stub that completes
  immediately without calling Ollama, so tests stay fast and deterministic.
  Tests that need the real graph should use a separate fixture or mark as
  integration.

Requires PostgreSQL and Redis reachable at ``DATABASE_URL`` / ``REDIS_URL``
(defaults match ``docker compose up redis postgres`` and ``app/config.py``).
"""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient


def _stub_graph_invoke(state: dict[str, Any], config: dict | None = None) -> dict[str, Any]:
    """Minimal terminal state for ``save_run`` / Redis after a fake graph run."""
    out = dict(state)
    out.setdefault("agent_steps", list(out.get("agent_steps") or []))
    out["status"] = "completed"
    out["intent"] = out.get("intent") or "faq"
    out["intent_confidence"] = float(out.get("intent_confidence", 0.85))
    out.setdefault("final_response", "Stub response for automated test.")
    out.setdefault("escalate", False)
    out.setdefault("escalation_reason", None)
    out.setdefault("resolution_draft", None)
    out.setdefault("lead_score", None)
    out.setdefault("lead_tier", None)
    out.setdefault("current_agent", "orchestrator")
    out.setdefault("error", None)
    return out


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch):
    fake_compiled = MagicMock()
    fake_compiled.invoke = MagicMock(side_effect=_stub_graph_invoke)
    monkeypatch.setattr("app.main.build_graph", lambda **kwargs: fake_compiled)

    # Import after patching so lifespan picks up the stub.
    from app.main import app

    with TestClient(app) as c:
        yield c
