# Domain 4 — Server security (Fastify + middleware) (10 tasks)

## Tasks 31–40

### Task 31: Replaced `xss-clean` (deprecated) with `sanitize-html`

- `xss-clean` is unmaintained and broken on Node 18+. Removed.
- All sanitization now goes through `sanitize-html` with `allowedTags: []` (everything stripped).

### Task 32: Pinned CORS origins

- New `CORS_ALLOWED_ORIGINS` env var (comma-separated list).
- In production: only the allowlisted origins are accepted.
- In development: any origin is allowed (for testing).

### Task 33: Strict CSP via Helmet

- `default-src 'none'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, etc.
- `referrer-policy: no-referrer`.

### Task 34: Body size limit

- `bodyLimit: 1 MiB` — rejects oversized bodies before they reach handlers.

### Task 35: HPP middleware (inline)

- Removed the `hpp` npm package (unmaintained).
- Added a `preHandler` hook that rejects duplicate keys in query strings.

### Task 36: Rate limit with allowlist

- Global rate limit (100 req/min) via `@fastify/rate-limit`.
- `RATE_LIMIT_ALLOWLIST` env var for IPs to bypass.
- Custom error response includes `Retry-After`.

### Task 37: Constant-time API key compare

- Replaced `xApiKey !== process.env.X_API_KEY` with a constant-time `constantTimeEqual()` helper.

### Task 38: Optional JWT

- Added `@fastify/jwt` registration gated on `JWT_SECRET` env var.
- If JWT is set, `Authorization: Bearer <token>` is accepted in addition to (or instead of) `x-api-key`.

### Task 39: Removed `process.env` leakage in error responses

- All `err.message` echoes are scrubbed to a generic `internal_error` or `bad_request`.

### Task 40: HTTPS-ready via `trustProxy`

- `trustProxy: process.env.TRUST_PROXY === "true"` — honors `X-Forwarded-For` when behind a reverse proxy.

## Verification

- `npm install` — clean.
- `npx hardhat test` — 32 passing.
- Manual smoke: `curl -H "X-Api-Key: wrong" http://localhost:3000/getTransactions` → 401 in production mode.
