# Production checklist (AutoFlow)

Use this before pointing a **paying client** or **Upwork deliverable** at a live host.

## Environment

- [ ] `APP_ENV=production` (hides raw exception text on 500s)
- [ ] `CORS_ORIGINS` set to real UI origins (never `*` in production)
- [ ] `WEBHOOK_API_KEY` set; callers send `X-API-Key`
- [ ] `AUTOFLOW_ADMIN_API_KEY` set; only trusted operators send `X-Admin-Key` on DELETE
- [ ] `RATE_LIMIT_STORAGE=redis` if you run **multiple** Uvicorn workers (shared limiter state)
- [ ] `WEBHOOK_RATE_LIMIT` tuned to expected inbound volume
- [ ] `DATABASE_URL` / `REDIS_URL` use secrets from your host (not defaults)

## WebSocket & browser UI

- [ ] When `WEBHOOK_API_KEY` is set, WS requires `?token=<same value>`
- [ ] For the bundled Next.js UI only: `NEXT_PUBLIC_WEBHOOK_API_KEY` in `frontend/.env.local` (never commit; never use on a public site without an auth gate in front)

## Operations

- [ ] TLS terminates at your reverse proxy (Caddy, nginx, cloud LB)
- [ ] `/health` wired to load balancer checks (`database` + `redis` must be true for “in rotation”)
- [ ] Logs shipped to your aggregator; alert on `status=degraded` or error rate
- [ ] Backups for Postgres; Redis treated as cache (rebuildable except idempotency keys during TTL window)

## Still custom per contract

- Worker queue for `graph.invoke` under burst load  
- Per-tenant auth and row-level security  
- Signed webhooks / HMAC instead of shared API key if the upstream supports it  
- Model eval harness and promotion gates  
