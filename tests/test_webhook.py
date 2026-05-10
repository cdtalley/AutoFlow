def test_health_returns_200(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "ollama" in data
    assert "redis" in data
    assert "database" in data


def test_webhook_returns_run_id(client):
    payload = {
        "sender_name": "Jane Doe",
        "sender_email": "jane@example.com",
        "subject": "Need pricing",
        "body": "Please share pricing.",
        "metadata": {},
    }
    resp = client.post("/api/v1/webhook", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "run_id" in data
    assert data["status"] == "running"


def test_webhook_missing_email(client):
    payload = {
        "sender_name": "Jane Doe",
        "subject": "Need pricing",
        "body": "Please share pricing.",
        "metadata": {},
    }
    resp = client.post("/api/v1/webhook", json=payload)
    assert resp.status_code == 422


def test_webhook_empty_body(client):
    payload = {
        "sender_name": "Jane Doe",
        "sender_email": "jane@example.com",
        "subject": "Need pricing",
        "body": "",
        "metadata": {},
    }
    resp = client.post("/api/v1/webhook", json=payload)
    assert resp.status_code == 422


def test_status_not_found(client):
    resp = client.get("/api/v1/status/nonexistent-id")
    assert resp.status_code == 404
