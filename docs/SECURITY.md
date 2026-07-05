# Security

## Threat model

| Threat | Mitigation |
|---|---|
| Unauthorized API access | `X-Api-Key` (constant-time compare) + optional JWT in production |
| Replay attacks on the contract | Per-user monotonic `nonces` mapping (EIP-712-style anti-replay ready) |
| Reentrancy | `ReentrancyGuard` on all state-mutating functions |
| Front-running / sandwiching on `batchInsertRecords` | Admin-only; no MEV exposure because the function is permissioned |
| Body bomb / DoS via large JSON | `bodyLimit: 1 MiB` + JSON Schema max-items |
| XSS via persisted contract data | `sanitize-html` on all inputs (tags stripped to `[]`) |
| HTTP Parameter Pollution (HPP) | First-occurrence policy in pre-handler |
| Rate-limit abuse | Global `@fastify/rate-limit` (100 req/min) + per-route limits |
| Brute force on the API key | Rate limit + constant-time compare |
| CORS abuse | Origin allowlist in production (no `*`) |
| Header injection | Helmet + strict CSP (`default-src 'none'`) |
| Sensitive data leakage in error responses | All `err.message` scrubbed before returning to the client |
| Supply-chain attack | `package-lock.json` committed; `npm audit` runs in CI weekly |
| Compromised deployer key | Multi-sig recommended for prod (not yet implemented) |
| Storage layout upgrade risk | `__gap` of 50 slots reserved for future state variables |

## Reporting a vulnerability

Email security@example.com (replace with the real address). Do not file a public
issue for security-sensitive reports.

## Audit history

| Date | Scope | Auditor | Result |
|---|---|---|---|
| 2026-07-05 | Internal review (this v2 upgrade) | Self | All 32 contract tests pass; Solhint 0 errors |

## Out of scope

- Front-end / mobile app security
- Infrastructure (load balancers, reverse proxies)
- The Camp Network or any other chain we deploy to
