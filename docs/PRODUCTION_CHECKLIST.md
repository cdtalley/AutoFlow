# Production checklist (AutoFlow)

Use this before deploying AutoFlow to a production or staging environment.

## Environment

- [ ] `APP_ENV=production` (hides raw exception text on 500s)
- [ ] `CORS_ORIGINS` set to real UI origins (never `*` in production)
- [ ] `WEBHOOK_API_KEY` set; callers send `X-API-Key`
- [ ] `AUTOFLOW_ADMIN_API_KEY` set; only trusted operators send `X-Admin-Key` on DELETE
- [ ] `RATE_LIMIT_STORAGE=redis` when running **multiple** Uvicorn workers (shared limiter state)
- [ ] `WEBHOOK_RATE_LIMIT` tuned to expected inbound volume
- [ ] `DATABASE_URL` / `REDIS_URL` use deployment secrets (not defaults)

## WebSocket & browser UI

- [ ] When `WEBHOOK_API_KEY` is set, WebSocket connections require `?token=<same value>`
- [ ] For the bundled Next.js UI only: `NEXT_PUBLIC_WEBHOOK_API_KEY` in `frontend/.env.local` (never commit; do not expose on a public site without an auth gate in front)

## Operations

- [ ] TLS terminates at the reverse proxy (Caddy, nginx, cloud load balancer)
- [ ] `/health` wired to load balancer checks (`database` + `redis` must be true for “in rotation”)
- [ ] Logs shipped to a log aggregator; alert on `status=degraded` or elevated error rate
- [ ] Backups for Postgres; Redis treated as cache (rebuildable except idempotency keys during the TTL window)

## Optional hardening (per deployment requirements)

- Worker queue for `graph.invoke` under burst load  
- Per-tenant authentication and row-level security  
- Signed webhooks / HMAC instead of a shared API key when the upstream supports it  
- Model evaluation harness and promotion gates  
