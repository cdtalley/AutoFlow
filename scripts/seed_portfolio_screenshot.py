"""
Seed a handful of inquiries so the dashboard /runs and charts are non-empty.

Standalone: `python scripts/seed_portfolio_screenshot.py`
Requires API at BASE_URL (default http://localhost:8000). Postgres + Redis must
match the API's DATABASE_URL / REDIS_URL. Ollama optional — runs may finish as
error if the graph cannot call the model, but rows still appear for the UI.
"""

from __future__ import annotations

import os
import sys
import time

import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")

# Fixed payloads so the screenshot looks intentional, not random noise.
INQUIRIES: list[dict] = [
    {
        "sender_name": "Alex Rivera",
        "sender_email": "alex.rivera@example.com",
        "subject": "Annual pricing and SOC2",
        "body": "We need SOC2 documentation and annual pricing for 120 seats.",
        "metadata": {"source": "portfolio_seed", "tier": "enterprise"},
    },
    {
        "sender_name": "Jordan Lee",
        "sender_email": "jordan.lee@example.com",
        "subject": "14-day trial",
        "body": "Does the trial include API access and how do we enable SSO?",
        "metadata": {"source": "portfolio_seed"},
    },
    {
        "sender_name": "Sam Patel",
        "sender_email": "sam.patel@example.com",
        "subject": "Enterprise demo this week",
        "body": "We have 400 users and need a security review plus a demo slot.",
        "metadata": {"source": "portfolio_seed"},
    },
    {
        "sender_name": "Casey Morgan",
        "sender_email": "casey.morgan@example.com",
        "subject": "Billing double charge",
        "body": "Invoice #44921 was charged twice. Please reconcile and confirm.",
        "metadata": {"source": "portfolio_seed"},
    },
    {
        "sender_name": "Riley Chen",
        "sender_email": "riley.chen@example.com",
        "subject": "Export failing on large CSV",
        "body": "Dashboard export errors above 50k rows. Need a workaround today.",
        "metadata": {"source": "portfolio_seed"},
    },
    {
        "sender_name": "Taylor Brooks",
        "sender_email": "taylor.brooks@example.com",
        "subject": "HubSpot + Slack integration",
        "body": "Confirm bidirectional sync with HubSpot and Slack notifications.",
        "metadata": {"source": "portfolio_seed"},
    },
    {
        "sender_name": "Morgan Blake",
        "sender_email": "morgan.blake@example.com",
        "subject": "Critical: automation queue stalled",
        "body": "Workflow automation stopped processing since 6am UTC. Sev1.",
        "metadata": {"source": "portfolio_seed"},
    },
    {
        "sender_name": "Jamie Fox",
        "sender_email": "jamie.fox@example.com",
        "subject": "Upgrade from Pro to Enterprise",
        "body": "Need rollout plan, SSO, and dedicated support contact.",
        "metadata": {"source": "portfolio_seed"},
    },
]


def main() -> int:
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        r.raise_for_status()
    except Exception as exc:
        print(f"API not reachable at {BASE_URL}: {exc}", file=sys.stderr)
        print(
            "Start the stack: docker compose up -d redis postgres && uvicorn app.main:app --reload",
            file=sys.stderr,
        )
        print("Postgres is on host port 5433 by default (see docker-compose.yml).", file=sys.stderr)
        return 1

    headers = {}
    key = os.environ.get("WEBHOOK_API_KEY")
    if key:
        headers["X-API-Key"] = key

    created = 0
    for payload in INQUIRIES:
        resp = requests.post(f"{BASE_URL}/api/v1/webhook", json=payload, headers=headers, timeout=30)
        if resp.status_code != 200:
            print(f"POST failed {resp.status_code}: {resp.text[:500]}", file=sys.stderr)
            return 1
        data = resp.json()
        print(f"run_id={data['run_id']} replay={data.get('idempotent_replay', False)}")
        created += 1
        time.sleep(0.25)

    # Brief wait so background graphs can flip some rows off purely "running".
    time.sleep(3)

    rr = requests.get(f"{BASE_URL}/api/v1/runs", timeout=10)
    rr.raise_for_status()
    runs = rr.json()
    print(f"GET /runs count={len(runs)} (seeded {created} new inquiries)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
