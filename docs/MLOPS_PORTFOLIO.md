# AutoFlow — MLOps overview

AutoFlow is a **reference LLM application platform**: orchestration, serving, persistence, and operator tooling. It is intended as a production-minded sample for **MLOps and ML platform** contexts—not a training notebook or batch pipeline demo.

**Related docs**

| Document | Contents |
|----------|----------|
| [README.md](../README.md) | Full architecture, API, configuration, deployment |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Pre-production operator checklist |
| Catalog thumbnail | `docs/images/mlops-thumbnail.png` — see [Screenshot assets](#screenshot-assets) |
| Dashboard screenshot | [images/dashboard.png](images/dashboard.png) — `cd frontend && npm run screenshot:upwork` |

---

## Summary

AutoFlow accepts structured inquiries via a versioned webhook, runs a **LangGraph** workflow (classify → specialist → synthesize or escalate), and persists an auditable trail. **Redis** holds hot run state; **PostgreSQL** stores durable history. A **Next.js** console exposes health, submission, live runs, and history. Inference is **local-first** via **Ollama** (`llama3` by default).

**Production-oriented patterns in the codebase:** typed APIs, optional webhook authentication, dependency health checks, structured logging, request IDs on errors, CI with real Postgres and Redis, and documented scale-out paths in the README extension roadmap.

---

## MLOps capability map

| Pillar | Implementation | Primary locations |
|--------|----------------|-------------------|
| **Serving / inference** | FastAPI async API; `graph.invoke` on a worker thread; `OLLAMA_BASE_URL` / `LLM_MODEL` | `app/services/graph_execution.py`, `app/utils/ollama_client.py` |
| **Workflow orchestration** | LangGraph: classify → specialist → synthesize / handoff → audit | `app/agents/orchestrator.py` |
| **State & lineage** | Per-run `run_id`; append-only `agent_steps`; intent and confidence stored | `app/db/models.py`, `app/services/graph_execution.py` |
| **Hot vs cold storage** | Redis TTL snapshots and step streams; Postgres authoritative history | `app/memory/redis_memory.py`, `app/db/database.py` |
| **Ingress reliability** | Per-IP rate limits; optional `Idempotency-Key`; structured 422/500 with `request_id` | `app/routers/webhook.py`, `app/limiter.py`, `app/errors.py` |
| **Security at the boundary** | Optional webhook API key, admin key on DELETE, WebSocket token gate | `app/routers/auth_deps.py`, [README §10](../README.md#10-security-model) |
| **Observability (baseline)** | `X-Request-ID`, structured logging, `/health` with `degraded` when DB or Redis is unavailable | `app/middleware/request_id.py`, `app/main.py` |
| **Operator UX** | Live runs (poll + WebSocket), history, health dashboard | `frontend/` |
| **Packaging** | Docker image and Compose (Postgres, Redis) | `Dockerfile`, `docker-compose.yml` |
| **CI** | GitHub Actions with Postgres and Redis services; `pytest` with graph stub (no Ollama in CI) | `.github/workflows/ci.yml`, `tests/conftest.py` |
| **Configuration** | `pydantic-settings`, `.env.example`, environment-specific CORS and error disclosure | `app/config.py` |

### Extension roadmap (not yet implemented)

OpenTelemetry spans per graph node, Prometheus metrics, queue-backed workers with DLQ, durable LangGraph checkpoint store, offline evaluation harness with promotion gates, and model registry integration. Details: [README §16](../README.md#16-extension-roadmap).

---

## Architecture

```mermaid
flowchart LR
  subgraph Ingest
    WH[POST /api/v1/webhook]
  end
  subgraph Serve
    API[FastAPI]
    BG[Background graph run]
  end
  subgraph Orchestrate
    LG[LangGraph + Ollama]
  end
  subgraph Stores
    R[(Redis)]
    P[(Postgres)]
  end
  subgraph Observe
    UI[Next.js console]
    HC[/health]
  end
  WH --> API --> BG --> LG
  BG --> R
  BG --> P
  UI --> API
  HC --> R
  HC --> P
```

### Design decisions

1. **HTTP separated from graph execution** — `graph_execution.process_inquiry_run` is the integration point for a queue worker (Celery, RQ, etc.) without changing the webhook contract.
2. **Structured audit trail** — Runs are replayable from Postgres; `agent_steps` are structured JSON, not only raw chat transcripts.
3. **Health semantics** — Ollama unavailability does not mark the API unhealthy; database and Redis failures do. Supports “API available, model warming” operations.
4. **Local-first inference** — Health checks, idempotency, and tracing hooks apply when models run on-premises or air-gapped.

---

## Technical highlights

- **LLM serving layer** on FastAPI: async I/O, thread-pool graph execution, versioned REST webhook, WebSocket status, OpenAPI-documented security schemes.
- **Multi-agent orchestration** with LangGraph (intent classification, conditional routing, escalation handoff) and append-only step telemetry in PostgreSQL.
- **Dual-tier state**: Redis for hot snapshots and idempotency; Postgres for durable history and operator queries.
- **Ingress hardening**: rate limiting, idempotent webhooks, optional API keys, request IDs on error paths, production-gated 500 responses.
- **CI pipeline** with Postgres and Redis service containers; fast tests via graph stubs without a live LLM in CI.
- **Operator console** (Next.js) for health, submission, live runs, and history.

---

## Repository metadata

**Suggested one-line description**

> Production-minded LLM workflow platform: webhook ingest, LangGraph routing, Ollama inference, Redis + Postgres, health checks, CI, and a Next.js operator console.

**Suggested topics**

`mlops` `llm` `langgraph` `fastapi` `ollama` `postgresql` `redis` `docker` `github-actions` `python` `nextjs`

---

## Demo walkthrough

1. **CI** — `.github/workflows/ci.yml` runs `pytest` against Postgres and Redis; the graph is stubbed so CI does not require Ollama.
2. **Health** — `GET /health` reports `ok` vs `degraded` based on database and Redis connectivity.
3. **Run** — Submit an inquiry via the UI or `POST /api/v1/webhook`; observe `run_id`, agent steps, and final response.
4. **Lineage** — `GET /api/v1/runs/{run_id}` returns `agent_steps`, `intent_confidence`, and escalation fields.
5. **Scale-out seam** — `app/services/graph_execution.py` is the module to replace with a queue worker while keeping clients unchanged.
6. **Roadmap** — Extension items in [README §16](../README.md#16-extension-roadmap).

**Local stack**

```bash
docker compose up redis postgres -d
ollama pull llama3 && ollama serve
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
cd frontend && npm run dev
python scripts/seed_portfolio_screenshot.py   # optional: seed history for the UI
```

---

## Screenshot assets

| File | Size | Generation |
|------|------|------------|
| `docs/images/mlops-thumbnail.png` | 1000×750 | `cd frontend && npm run dev` then `npm run screenshot:mlops` |
| `docs/images/dashboard.png` | full UI | `cd frontend && npm run screenshot:upwork` (requires API and webhook) |

Preview MLOps tile: `http://localhost:3000/portfolio/mlops`

---

## Operational FAQ

| Topic | Behavior in this repository |
|-------|------------------------------|
| Monitoring | Request IDs and structured logs; `/health` for load balancers; per-run steps in the database for debugging. Planned: OpenTelemetry per node, latency metrics, Ollama error rates. |
| Duplicate requests | Optional `Idempotency-Key` header maps to a stable `run_id` in Redis for the configured TTL. |
| Testing without a live model | `tests/conftest.py` stubs `build_graph`; CI does not require Ollama. |
| Horizontal scale | Queue for `process_inquiry_run`, Redis pub/sub for WebSockets, durable LangGraph checkpointer, API replicas with shared Redis rate-limit storage. |
| Model selection | `LLM_MODEL` environment variable; evaluation gates and promotion workflows are documented extensions. |

---

## Scope

AutoFlow demonstrates **LLM application and GenAI platform engineering** (orchestration, serving, operations, lineage). It does not include batch training pipelines, feature stores, or experiment-tracking platforms (for example MLflow or Kubeflow). Those concerns are complementary when evaluating the full MLOps landscape.

---

## License and attribution

AutoFlow is a reference implementation for study, extension, and integration design. Deployments should use environment-specific secrets, TLS, and operational runbooks appropriate to the target environment.
