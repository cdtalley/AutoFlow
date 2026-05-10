"""Guards for paying-client style deployments."""

from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient


def test_delete_without_admin_key_when_admin_disabled(monkeypatch):
    """When no admin key is configured, DELETE does not require X-Admin-Key."""

    def fake_settings():
        m = MagicMock()
        m.AUTOFLOW_ADMIN_API_KEY = None
        m.WEBHOOK_API_KEY = None
        return m

    monkeypatch.setattr("app.routers.auth_deps.get_settings", fake_settings)

    class _RedisStub:
        def delete_run_keys(self, run_id: str) -> None:
            return None

    monkeypatch.setattr("app.routers.runs.get_redis_memory", lambda: _RedisStub())

    async def mock_get_db():
        sess = AsyncMock()
        exec_result = MagicMock()
        exec_result.rowcount = 0
        sess.execute = AsyncMock(return_value=exec_result)
        sess.commit = AsyncMock()
        yield sess

    from app.db.database import get_db
    from app.main import app

    app.dependency_overrides[get_db] = mock_get_db
    try:
        client = TestClient(app)
        r = client.delete("/api/v1/runs/some-run-id")
        assert r.status_code == 200
        assert r.json().get("deleted") is False
    finally:
        app.dependency_overrides.clear()


def test_delete_401_when_admin_key_required(monkeypatch):
    def fake_settings():
        m = MagicMock()
        m.AUTOFLOW_ADMIN_API_KEY = "only-admins-delete"
        m.WEBHOOK_API_KEY = None
        return m

    monkeypatch.setattr("app.routers.auth_deps.get_settings", fake_settings)
    from app.main import app

    c = TestClient(app)
    r = c.delete("/api/v1/runs/any-uuid-here")
    assert r.status_code == 401
