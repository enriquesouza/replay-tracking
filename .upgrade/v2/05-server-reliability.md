# Domain 5 — Server reliability, observability & input validation (10 tasks)

## Tasks 41–50

### Task 41: `/health` endpoint
- `GET /health` → `{ status: "ok", uptime: <seconds> }`.
- Used by Docker HEALTHCHECK, k8s liveness probes, load balancers.

### Task 42: `/ready` endpoint
- `GET /ready` → 200 if the contract is configured, 503 if RPC is unreachable.
- Used by k8s readiness probes (don't send traffic until ready).

### Task 43: Request-ID middleware
- Every request gets a UUID stored in `request.id` and returned in the `x-request-id` response header.
- The ID is included in every log line via Pino.

### Task 44: Structured Pino logger
- Fastify's default logger is Pino (JSON output in production, pretty in dev).
- `authorization` and `x-api-key` headers are redacted.
- `set-cookie` is redacted.

### Task 45: BigInt safe JSON serialization
- `bigIntReplacer` for `JSON.parse(JSON.stringify(obj, bigIntReplacer))` — converts BigInts to strings.

### Task 46: JSON Schema validation on every route
- Each route declares its `body`, `params`, and `querystring` schema.
- Fastify rejects bad payloads at the edge with a 400.

### Task 47: Explicit tx confirmation
- `txOptions.confirmations = 1`, `txOptions.timeout = 30_000`.
- `tx.wait()` will throw on revert; we return 400 to the client.

### Task 48: Deploy scripts fail fast
- All deploy scripts check that the RPC is reachable before constructing the wallet.
- Prod deploy also checks the deployer balance.

### Task 49: Removed unused V1 contract routes
- `/addTokens`, `/updateBalance`, `/addTransaction`, `/batchIncrementRecords`, `/addAdmin`, `/removeAdmin`, `/setTokenAdmin`, `/getBalance` were never wired to the V3 contract. Removed.

### Task 50: Removed unused dependencies
- `@aws-sdk/client-sqs` (unused), `hpp` (replaced inline), `xss-clean` (deprecated), `uuid` (replaced with `crypto.randomUUID`).

## Verification

- All 32 contract tests pass.
- Manual: `npm start` boots, `curl localhost:3000/health` returns OK.
