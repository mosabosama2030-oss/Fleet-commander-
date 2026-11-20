# HTTP API — FC-API-01 (development slice)

**Status: Draft / development only.** This API uses an in-memory FleetService and a configured single-captain bearer token. It is not production auth and has no persistence.

## Run and configuration
- Configure `FC_AUTH_TOKEN` (minimum 32 chars) and `FC_OWNER_ID` via environment variables.
- No default token, no account registration, and no credential is committed.
- The token is a shared bearer credential for this development slice; production needs a proper login/session and secure token storage, rate limiting and review.
- Storage is memory-only and is lost on restart.

## Routes
- `GET /health` public.
- `POST /api/vehicles`, `GET /api/vehicles`.
- `POST /api/shifts`, `GET /api/shifts`, `POST /api/shifts/:id/end`, `POST /api/shifts/:id/cancel`.
- `GET /api/shifts/:id/trips`, `POST /api/trips`, `POST /api/trips/:id/void`.
- `POST /api/shifts/:id/corrections`.

Mutating routes require `Idempotency-Key`. Owner identity is server-configured, not read from the client body. Health labels memory storage explicitly.

## Safety boundary
- Single captain only; not multi-user/multi-tenant production authentication.
- No expenses, financial reports, fare calculations, GPS, or external AI.
- DEC-03 remains blocking for financial metrics.
- No deployment, hosting, secrets or paid provider configured.

## Test
The app factory is tested with `fastify.inject()`, without opening a network port.
