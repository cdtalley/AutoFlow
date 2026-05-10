# AutoFlow

Inbound inquiries hit a webhook, get classified, routed through a small set of specialist paths (FAQ, sales, support), and either finish with a drafted response or escalate with a reason you can actually audit. LLM work goes through [Ollama](https://ollama.com) with `llama3` on your machine—no OpenAI, no Anthropic, no token bill.

I use this repo as a sample when someone asks whether I can wire models into a real service: not a notebook, not a demo script, but something with persistence, failure behavior, and an operator-facing UI.

---

## What this is

Most of the “hard” part of LLM products is everything around the model call: routing, retries, where state lives, what happens when Postgres is fine but Redis isn’t, and whether a human can reconstruct what happened. AutoFlow is my cut at that layer.

The graph is explicit (LangGraph). Hot state for polling sits in Redis; run history and steps you care about for disputes live in Postgres. The frontend is Next.js with TypeScript—I wanted something I’d actually open during an incident, not a Streamlit toy.

---

## Flow

```text
POST /webhook
    → LangGraph (typed AgentState)
    → intent classification (Ollama, JSON where it matters)
    → FAQ | lead (mock CRM) | support branch
    → optional handoff if escalation fires
    → draft + simulated send
    → Postgres + Redis + WebSocket fan-out
    → Next.js dashboard (history + live view)
```

I keep the LLM client synchronous and run `graph.invoke` off the async event loop when needed—that’s a deliberate trade for local Ollama and blocking HTTP, not an accident.

---

## Stack (honest list)

Python 3.11, FastAPI, Uvicorn, LangGraph (CrewAI is in requirements for agent-style patterns; the graph here is LangGraph-first). Postgres via async SQLAlchemy + asyncpg, Redis for TTL’d run snapshots and step lists. Next.js 14, React 18, Tailwind, a bit of Recharts on the dashboard. Pydantic v2 and pydantic-settings for config. pytest for the pieces that don’t need a live model. Docker Compose for the bits that aren’t Ollama.

---

## Run it

You’ll need Ollama running if you want the agents to do anything interesting, plus Redis and Postgres (Compose is the easy path).

Backend:

```bash
pip install -r requirements.txt
ollama pull llama3
cp .env.example .env
docker compose up redis postgres -d
uvicorn app.main:app --reload
```

Frontend (from repo root):

```bash
cd frontend
npm install
npm run dev
```

UI defaults to `http://localhost:8000` for the API. Point it elsewhere with `NEXT_PUBLIC_API_BASE` (see `frontend/.env.example`).

Throw load at it if you want to see the dashboard move:

```bash
python scripts/simulate_requests.py
```

---

## API (short)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Returns `status` (`ok` or `degraded`) and booleans for Ollama, Redis, and a real DB ping |
| POST | `/api/v1/webhook` | Starts a run; returns `run_id` and optional `idempotent_replay`. Per-IP rate limit (see `WEBHOOK_RATE_LIMIT`). Optional `Idempotency-Key` header dedupes within `IDEMPOTENCY_TTL_SECONDS`. If `WEBHOOK_API_KEY` is set, send `X-API-Key` |
| GET | `/api/v1/status/{run_id}` | Poll state (Redis first, then DB) |
| GET | `/api/v1/status/{run_id}/steps` | Steps from Redis |
| WS | `/api/v1/ws/{run_id}` | Live channel. If `WEBHOOK_API_KEY` is set, connect with `?token=<same value>` |
| GET | `/api/v1/runs` | Recent runs |
| GET | `/api/v1/runs/{run_id}` | Full record from DB |
| DELETE | `/api/v1/runs/{run_id}` | Drops DB row and Redis run/step keys. If `AUTOFLOW_ADMIN_API_KEY` is set, send `X-Admin-Key` |

---

## Intents (where traffic goes)

FAQ-ish and general inquiries go to the knowledge-backed FAQ path. Sales, pricing, demos, upgrades go through lead scoring and a drafted reply. Support, bugs, complaints, and billing go through support; if severity comes back high or critical, it escalates and the handoff agent writes something a human can pick up without re-reading the whole thread.

---

## Config I actually use in “prod-shaped” demos

| Variable | What it does |
|----------|----------------|
| `CORS_ORIGINS` | Comma-separated browser origins, or `*` for local work (`*` turns off credentialed CORS by design) |
| `WEBHOOK_API_KEY` | When set: `X-API-Key` on POST `/webhook`, and `?token=` on WebSocket |
| `AUTOFLOW_ADMIN_API_KEY` | When set: `X-Admin-Key` required on DELETE `/runs/{run_id}` |
| `WEBHOOK_RATE_LIMIT` | slowapi string, e.g. `60/minute` |
| `RATE_LIMIT_STORAGE` | `memory` (single worker) or `redis` (shared across workers) |
| `IDEMPOTENCY_TTL_SECONDS` | How long `Idempotency-Key` maps to the same `run_id` |
| `LOG_LEVEL` | Standard library logging level |

Shared singletons hang off `app/runtime.py` so routers don’t import `main` in a circle. On shutdown the SQLAlchemy async engine is disposed cleanly.

Ingress for a paying client: rate-limited webhook, Redis idempotency for safe retries, optional keys for webhook/admin/WS, structured 422/500 JSON with `request_id`, OpenAPI security metadata. Handoff notes: [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) and [docs/UPWORK_PORTFOLIO.md](docs/UPWORK_PORTFOLIO.md).

---

## Tests

```bash
pytest -q
```

Coverage today is mostly webhook validation, health shape, and orchestrator routing helpers. If I were shipping this for a paying client, I’d add contract tests around the Ollama boundary and something like Testcontainers for CI—not because I don’t trust the code, but because that’s what keeps regressions from sneaking in when someone “just tweaks the prompt.”

---

## What I’d still build for a real launch

Webhook and WS auth beyond a shared secret, idempotency on ingest, rate limits, traces that follow a `run_id` through the graph, and a worker queue so a traffic spike doesn’t tie up the API process. Eval hooks per intent would live next to the graph, not buried in string templates.

None of that is missing because I forgot; it’s the line between “credible sample” and “your contract.”

---

## Upwork / proposals / resume copy

I keep catalog blurbs, pricing anchors I’m comfortable quoting, and resume bullets in one place so I’m not rewriting the same paragraph every proposal:

[docs/UPWORK_PORTFOLIO.md](docs/UPWORK_PORTFOLIO.md)

---

## Contact

No separate license file—this is my own work sample. If you’re comparing vendors on Upwork and want a live walkthrough of how the graph and persistence fit together, that’s the channel I use.

---

Inference stays local: Ollama + `llama3`. No paid model APIs in this design.
