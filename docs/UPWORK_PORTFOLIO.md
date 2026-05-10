# AutoFlow — Upwork portfolio & pricing kit

Use this file when you add AutoFlow to your **Upwork project catalog**, attach it as a **portfolio sample**, or paste pieces into **proposals**. Replace bracketed placeholders with your own details.

**Portfolio images (Upwork):**  
- **AutoFlow catalog thumbnail (upload this file):** repo path **`docs/images/upwork-thumbnail.png`** (same as [images/upwork-thumbnail.png](images/upwork-thumbnail.png)). **1000×750**. Built from the DocuMind-style canvas at **`http://localhost:3000/portfolio/upwork?run=<uuid>`** (reference stack, headline, 2×2 metrics, mono pills).  
- **Full dashboard proof (optional):** [images/upwork-dashboard.png](images/upwork-dashboard.png).

**Recommended capture:** bring up **Redis, Postgres, API, Ollama,** and **`npm run dev`**, then from `frontend/` run `npm run screenshot:upwork`. The script **POSTs the demo webhook**, waits for graph steps, saves the **full dashboard** PNG, then opens **`/portfolio/upwork?run=…`** at **1000×750** for **`upwork-thumbnail.png`**. Set `PLAYWRIGHT_WEBHOOK_API_KEY` if the API requires it. Manual preview: open `http://localhost:3000/portfolio/upwork?run=<any-run-uuid>`. Optional seed: `python scripts/seed_portfolio_screenshot.py`. Postgres in compose is often on host **5433**.

---

## One-line catalog title (pick one)

- **Multi-agent inquiry automation (FastAPI + LangGraph + local LLM + Next.js dashboard)**  
- **Production-style AI routing: classify → specialist agents → escalate → audit trail**  
- **Local-first LLM ops: Ollama, Redis, Postgres, WebSockets, TypeScript UI**

---

## Short overview (paste into “Project details” or proposal intro)

AutoFlow automates business inquiries: a webhook accepts structured requests, a **LangGraph** graph classifies intent and routes to FAQ, sales, or support paths, then returns a drafted reply or **escalates with a handoff**. **Redis** holds hot run state; **PostgreSQL** stores history. A **Next.js** UI shows health, history, and live status. Inference runs **locally via Ollama** (`llama3`), with no OpenAI/Anthropic dependency on that path.

Shipped patterns: **typed APIs**, **optional webhook API key**, **DB-backed health checks**, **structured logging**, **request IDs on errors**, and headroom for **auth, queues, and observability** later.

### What the reference code already includes (client-ready ingress)

Concrete items to list in a **fixed-price catalog** or “Phase 0 delivered” scope:

| Capability | Behavior |
|------------|----------|
| Rate limiting | `POST /api/v1/webhook` limited per client IP (`WEBHOOK_RATE_LIMIT`); storage `memory` or `redis` |
| Idempotent ingest | Optional `Idempotency-Key` header: same key returns the same `run_id` without enqueueing duplicate graph runs (`idempotent_replay` in JSON) |
| Webhook auth | Optional `X-API-Key` when `WEBHOOK_API_KEY` is set |
| WebSocket auth | When webhook key is set, `GET /api/v1/ws/{run_id}?token=<same secret>` |
| Admin delete | Optional `X-Admin-Key` on `DELETE /api/v1/runs/{run_id}` when `AUTOFLOW_ADMIN_API_KEY` is set |
| Errors | `422` and `500` return structured JSON with `request_id` (safe message when `APP_ENV=production`) |
| OpenAPI | Security schemes documented for code generators and security review |
| Shutdown | Async SQLAlchemy engine disposed on app shutdown |

Operator checklist for live handoff: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md).

---

## What clients actually buy (map features → outcomes)

| Buyer pain | What AutoFlow demonstrates |
|------------|---------------------------|
| “We drown in inbound email/forms” | Webhook intake + async processing + poll/WS status |
| “We can’t trust black-box AI” | Explicit graph, logged steps, escalation reasons |
| “We need auditability” | Postgres run records + append-only agent steps |
| “We can’t send data to US clouds” | Local Ollama path; architecture supports air-gapped deploy |
| “We need an operator UI” | Next.js dashboard, not a toy script |

---

## Skills & keywords (profile + catalog tags)

`FastAPI` · `Python` · `slowapi` · `async SQLAlchemy` · `PostgreSQL` · `Redis` · `LangGraph` · `LangChain` · `Ollama` · `LLM orchestration` · `WebSockets` · `Next.js` · `TypeScript` · `Tailwind CSS` · `Docker` · `pytest` · `Pydantic` · `API design` · `idempotency` · `MLOps-minded` (degradation, health)

---

## Pricing & packaging guidance (Upwork)

**Important:** Upwork takes a service fee; your **take-home** depends on your country, niche, and profile strength. Treat numbers as **starting anchors**, then adjust after you win 2–3 similar jobs and see actual effort.

### Hourly (good when scope shifts)

| Tier | Who it’s for | Typical *posted* hourly range (USD) | Notes |
|------|----------------|--------------------------------------|--------|
| **Senior / specialist** | You own architecture, security tradeoffs, and delivery | **$85–150+** | Use when the brief says “production,” compliance, or multi-agent orchestration |
| **Strong mid-market** | Solid delivery, some discovery | **$55–95** | Competitive for international talent with strong English + portfolio |
| **Value / volume** | Smaller fixes, narrow tasks | **$35–60** | Only if you want volume; avoid underselling complex AI work |

*If you are US-based with 30+ years experience and a strong Upwork history, many specialists anchor **$100–175/hr** for architecture-heavy AI backend work; if you’re new on the platform, start lower until you have reviews, then raise.*

### Fixed-price milestones (good when scope is clear)

Sell **outcomes**, not “I will run Docker”:

| Milestone | Example deliverable | Example fixed range (USD) |
|-----------|---------------------|---------------------------|
| **M1 — Discovery** | Integrations map, data flow, risk list, backlog | **$600–2,000** |
| **M2 — MVP** | One channel (e.g. form/webhook) + one agent path + logging + deploy doc | **$2,500–8,000** |
| **M3 — Hardening** | Auth, rate limits, observability, eval harness, staging/prod split | **$3,000–12,000+** |

Always add a **change budget** line in proposals: *“Scope beyond X integrations / Y agents is quoted separately.”*

### Retainer (good for ongoing tuning)

- **$1,500–5,000/month** for a small block of hours (monitoring, prompt/graph tweaks, incident response) — scale with SLA and timezone coverage.

---

## Proposal snippet (copy-paste, then customize)

> I’ve shipped a reference architecture (**AutoFlow**) for multi-step LLM workflows: FastAPI ingestion with **per-IP rate limits** and optional **Idempotency-Key** dedupe, LangGraph routing, Redis + Postgres persistence, WebSockets (token-gated when keys are on), and a Next.js operator dashboard. Inference is **local-first (Ollama)** so you avoid per-token SaaS lock-in while we prove value.  
> For your project I’d start with a **1-week discovery** to lock integrations and escalation rules, then deliver an **MVP milestone** with one production path and measurable acceptance tests (latency, escalation rate, audit completeness). Happy to walk through the repo on a short call.

---

## Resume bullets (paste into “Selected projects” or experience)

- Architected **multi-agent business automation** service: webhook intake, **LangGraph** orchestration, conditional escalation, and **append-only audit trails** (PostgreSQL + Redis).  
- Built **async FastAPI** API with versioned routes, **per-IP rate limits** (slowapi), **idempotent webhook** semantics via `Idempotency-Key`, **structured 422/500 errors** with `request_id`, and **configurable CORS**.  
- Hardened ingress: optional **X-API-Key** (webhook), **X-Admin-Key** (destructive routes), **WebSocket `?token=`** when keys are enabled; **OpenAPI** security metadata for client generators.  
- Implemented **local LLM integration** (Ollama) with retries, JSON-mode classification, and **degraded `/health`** when dependencies are down.  
- Delivered **Next.js 14 + TypeScript** operator UI with **WebSocket + polling**; documented **production checklist** and commercial packaging for catalog work.  

---

## Demo checklist before client calls

1. `docker compose up redis postgres -d` (or your host DB)  
2. `ollama pull llama3` and `ollama serve`  
3. `uvicorn app.main:app --reload`  
4. `cd frontend && npm run dev`  
5. `GET /health` → expect `database: true`, `redis: true` when services are up  
6. Submit one inquiry from the UI; show **run history** + **live** tab  

---

## Optional: set production-like env for demos

```env
CORS_ORIGINS=http://localhost:3000
WEBHOOK_API_KEY=replace-with-long-random-string
AUTOFLOW_ADMIN_API_KEY=replace-with-different-secret
WEBHOOK_RATE_LIMIT=60/minute
RATE_LIMIT_STORAGE=redis
LOG_LEVEL=INFO
```

- Webhooks: header `X-API-Key: <WEBHOOK_API_KEY>`  
- Deletes: header `X-Admin-Key: <AUTOFLOW_ADMIN_API_KEY>`  
- WebSocket: `?token=<WEBHOOK_API_KEY>` (local Next.js: `NEXT_PUBLIC_WEBHOOK_API_KEY` in `frontend/.env.local` — not for public anonymous sites)  

---

## Legal / positioning (one sentence)

Frame AutoFlow as **your** reference implementation and IP you license or reuse in client work per your contract; for Upwork, clarify whether deliverables are **exclusive** to the client or **non-exclusive** reuse of your libraries.
