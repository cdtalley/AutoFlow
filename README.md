# AutoFlow

**Multi-agent business process automation** — classify inbound inquiries, route them through specialized agents, auto-resolve or escalate with a full audit trail. **All LLM inference runs locally** via [Ollama](https://ollama.com) (`llama3`). No paid model APIs.

I built this as a **portfolio-grade reference implementation**: something a hiring manager can skim in two minutes and still understand *what problem it solves*, *how I decomposed it*, and *where I’d harden it for production*.

---

## Why I built this

Over my career I’ve spent a lot of time at the intersection of **data science, machine learning, and production systems** — taking models from notebooks into APIs, thinking about latency, failure modes, and what “done” means for stakeholders who don’t care about your architecture diagram.

LLM-powered automation is no different: the interesting work is not “call a model,” it’s **orchestration, guardrails, auditability, and operator UX**. AutoFlow is my answer to that:

- **Explicit state machine** (LangGraph) instead of an opaque chain of prompts  
- **Fast vs. durable storage** — Redis for hot run state, PostgreSQL for history  
- **Human in the loop** — escalation paths with reasons, not blind hand-waving  
- **Real-time visibility** — WebSockets + a **Next.js** control center so a reviewer can *see* the system work  

If you’re evaluating whether I can own an AI-facing service end-to-end: this repo is the shape of how I think about it.

---

## What I bring (at a glance)

| Area | How it shows up here |
|------|----------------------|
| **Backend & APIs** | FastAPI, async lifecycle, dependency-friendly singletons, versioned REST under `/api/v1` |
| **Data & persistence** | SQLAlchemy async + PostgreSQL for runs; Redis for TTL’d session state |
| **ML / LLM integration** | Structured classification (JSON mode), retries, local Ollama only — cost and vendor control |
| **Orchestration** | LangGraph graph with routing, checkpoints, append-only agent steps |
| **Frontend** | Next.js 14, TypeScript, Tailwind — dashboard, live polling, WebSocket hookup |
| **Ops mindset** | Docker Compose, health checks, `.env` separation, simulation script for load demos |

I’m comfortable going deep on **statistics and model evaluation** when the product requires it; here the emphasis is on **reliable automation plumbing** around the model, which is what ships.

---

## Architecture

```text
Inbound inquiry (POST /webhook)
        |
LangGraph state machine (typed AgentState)
        |
Intent classification (Ollama / local)
        |
  +-- FAQ / general  -> FAQ agent + knowledge tool
  +-- Sales / pricing -> Lead agent + mock CRM scoring
  +-- Support paths   -> Support agent + severity routing
        |
  escalate? -> Handoff agent (human-ready summary)
        |
Synthesize response (simulated email tool)
        |
Persist audit (PostgreSQL) + cache (Redis) + broadcast (WebSocket)
        |
Next.js Control Center (live + history)
```

**Design choices I’d defend in an interview:**

1. **Graph over spaghetti** — Routing and escalation are explicit; easier to test and to extend.
2. **Redis + Postgres** — Hot path for status polling; durable source of truth for compliance-ish audit.
3. **Synchronous LLM client in a thread pool** — Keeps FastAPI async while talking to a blocking HTTP client; pragmatic for local Ollama.
4. **Portfolio frontend** — Not a throwaway demo UI: typed client, filters, and live run tracking so the story is visible.

---

## Stack

| Layer | Technology |
|-------|------------|
| API | Python 3.11+, FastAPI, Uvicorn |
| Agents | LangGraph (+ CrewAI in deps for role/task patterns) |
| LLM | Ollama @ `http://localhost:11434`, model `llama3` |
| Cache | Redis (`redis-py`) |
| Database | PostgreSQL, `asyncpg`, SQLAlchemy async |
| Realtime | FastAPI WebSockets |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind, Recharts |
| Config | Pydantic v2, `pydantic-settings` |
| Tests | `pytest`, `pytest-asyncio` |
| Containers | Docker, Docker Compose |

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.com) running locally (for real agent behavior)
- Docker & Docker Compose (Redis + PostgreSQL)

---

## Quick start

**Backend**

```bash
pip install -r requirements.txt
ollama pull llama3
cp .env.example .env
docker compose up redis postgres -d
uvicorn app.main:app --reload
```

**Frontend** (from repo root)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The UI expects the API at `http://localhost:8000` by default; override with `NEXT_PUBLIC_API_BASE` if needed.

**Stress demo**

```bash
python scripts/simulate_requests.py
```

---

## API summary

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Ollama, Redis, DB signal |
| `POST` | `/api/v1/webhook` | Submit inquiry; returns `run_id` |
| `GET` | `/api/v1/status/{run_id}` | Poll run state |
| `GET` | `/api/v1/status/{run_id}/steps` | Step list from Redis |
| `WS` | `/api/v1/ws/{run_id}` | Live updates |
| `GET` | `/api/v1/runs` | List runs |
| `GET` | `/api/v1/runs/{run_id}` | Full run from DB |
| `DELETE` | `/api/v1/runs/{run_id}` | Remove run (DB + Redis keys) |

---

## Intent routing (high level)

- **`general_inquiry`, `faq`** — FAQ / knowledge agent  
- **`sales`, `pricing`, `demo_request`, `upgrade`** — Lead qualification + draft reply  
- **`support`, `bug_report`, `complaint`, `billing_issue`** — Support agent; high/critical severity triggers escalation  
- Escalated runs — Handoff summary for a human operator  

---

## Testing

```bash
pytest -q
```

Tests cover webhook validation, health, and orchestrator routing helpers. I’d expand with contract tests against Ollama mocks and integration tests with Testcontainers for a production team.

---

## If I took this to production (next steps)

These are the conversations I expect with a staff+ panel — and how I’d address them:

- **Authn/z on webhook and WebSockets** — API keys, JWT, per-tenant isolation  
- **Idempotency** — Dedup inbound messages by external id  
- **Observability** — Structured logs, traces around graph nodes, metrics on escalation rate  
- **Model governance** — Eval sets per intent, regression checks before promote  
- **Queue-based workers** — Decouple `webhook` accept from long-running `invoke` for burst traffic  

---

## License & contact

This project is a **personal portfolio piece**.  
If you’re hiring for **data science, ML engineering, or backend-heavy AI product work** and want to talk through design tradeoffs or extend AutoFlow for your use case, I’m happy to walk through it in detail.

*(Add your preferred contact: LinkedIn, site, or email — I keep this README honest and leave those lines for you.)*

---

**Zero paid LLM APIs.** Inference stays on your machine via Ollama and `llama3`.
