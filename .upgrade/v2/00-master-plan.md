# v2 Master Plan — 100 micro-tasks (security + best practices)

**Date**: 2026-07-05
**Workspace**: `/Users/enriquesouza/projects/replay-tracking`
**Goal**: Apply the latest security and best-practices upgrades across the entire codebase, organized into 10 domains × 10 tasks.

## Note on execution

The `runSubagent` tool is unavailable in this environment. The "100 agents" are modeled as 100 focused micro-tasks executed in coordinated, parallelized batches. Each task is a single file edit (or a small related group), scoped to avoid conflicts with the others.

## Domains

| # | Domain | Tasks file |
|---|---|---|
| 1 | **Solidity contract security hardening** | `.upgrade/v2/01-solidity-security.md` |
| 2 | **Solidity contract gas optimization & best practices** | `.upgrade/v2/02-solidity-gas-bestpractices.md` |
| 3 | **Solidity test suite expansion** | `.upgrade/v2/03-solidity-tests.md` |
| 4 | **Server security (Fastify + middleware)** | `.upgrade/v2/04-server-security.md` |
| 5 | **Server reliability, observability & input validation** | `.upgrade/v2/05-server-reliability.md` |
| 6 | **Dependency audit, lockfile, secret management** | `.upgrade/v2/06-dependency-secrets.md` |
| 7 | **CI/CD, linting, formatting, pre-commit** | `.upgrade/v2/07-cicd-quality.md` |
| 8 | **Deployment, infrastructure, multi-chain support** | `.upgrade/v2/08-deploy-infra.md` |
| 9 | **Documentation, ADR, threat model, runbooks** | `.upgrade/v2/09-documentation.md` |
| 10 | **Toolchain polish — Foundry/Ape/TypeScript, monorepo hygiene** | `.upgrade/v2/10-toolchain.md` |

## Conflict-free batch plan

Tasks are organized so that no two tasks in the same batch touch the same file. Batches run in parallel.

### Batch A (parallel — independent files)
1. Add `nonces` storage gap fix (Solidity)
2. Add OZ v5 `ReentrancyGuard` to `batchInsertRecords`
3. Add NatSpec to all public functions
4. Convert `require` strings → custom errors
5. Add explicit visibility to storage vars
6. Use `calldata` instead of `memory` where possible
7. Add `pausable` admin-actions list
8. Add `MAX_BATCH_SIZE` immutable constant
9. Cache `userHistories[userKey].length` in loop
10. Use `EnumerableSet` for `transactionKeys` instead of array

### Batch B (parallel — independent files)
11. New test: reentrancy on `getTransactionsByUserId`
12. New test: pause prevents all admin writes
13. New test: `getUserHistories` for empty user returns []
14. New test: `getTransactionsByUserId` for ghost user returns []
15. New test: event payload is correct byte-for-byte
16. New test: non-admin cannot `insertUserHistory`
17. New test: `pause`/`unpause` only by ADMIN_ROLE
18. New test: `initialOwner` parameter is honored exactly
19. New test: fuzz — random batches never revert on valid input
20. New test: invariant — sum of `totalDuration` is preserved across batches

### Batch C (parallel — server middleware)
21. Replace `xss-clean` (deprecated, broken) → `sanitize-html` everywhere
22. Add CSRF protection to state-changing routes
23. Add per-route rate limits (not just global)
24. Add `x-api-key` constant-time comparison
25. Add request size limits (Fastify `bodyLimit`)
26. Add per-IP burst limit
27. Pin CORS origins (no `*`)
28. Add `strict-dynamic` CSP via Helmet
29. Remove `process.env` leakage in error responses
30. Add HTTPS enforcement behind proxy

### Batch D (parallel — server code quality)
31. Use Zod (or Fastify JSON Schema) for request validation
32. Add request ID middleware (`x-request-id`)
33. Add structured logger (Pino is Fastify default — make sure config is set)
34. Add `/health` and `/ready` endpoints
35. Add `/metrics` Prometheus endpoint
36. Add `BigInt` serialization safe-json replacer
37. Add transactional nonce for sequential writes
38. Replace `try/catch` on `tx.wait()` with explicit confirmations
39. Add gas estimation + gas price sanity check
40. Add request timeout per route

### Batch E (parallel — dependencies / secrets)
41. Add `.env.example`
42. Add `dotenv-flow` for env layering
43. Add `secret-helper` helper that redacts in logs
44. Add `npm audit` script with thresholds
45. Pin `package.json` `overrides` for vulnerable transitive deps
46. Add `engines` field
47. Add `packageManager` field
48. Add `.nvmrc`
49. Add `LICENSE` (MIT)
50. Add `SECURITY.md`

### Batch F (parallel — CI / linting)
51. Add `.github/workflows/ci.yml` (compile + test + lint on every push)
52. Add `.github/workflows/audit.yml` (weekly npm audit)
53. Add `.github/dependabot.yml`
54. Add `.editorconfig`
55. Add `.prettierrc` + `.prettierignore`
56. Add `prettier` to devDeps + `format` script
57. Add `lint-staged` + `husky` for pre-commit
58. Add `commitlint` for conventional commits
59. Add `solhint` config (already exists) + `lint:sol` script (already exists) — extend rules
60. Add `eslint.config.js` for JS files (flat config)

### Batch G (parallel — deploy / infra)
61. Add `hardhat.config.js` separate `production` network with secure defaults
62. Add `scripts/deploy-contract-verify.js` (deploy + auto-verify on Etherscan/Blockscout)
63. Add `scripts/check-balance.js` (pre-flight check before deploy)
64. Add multi-chain RPC config to `.env.example`
65. Add `scripts/health-check.js` (checks all RPC endpoints)
66. Add `Dockerfile` for the API
67. Add `docker-compose.yml` (API + anvil + postgres if needed later)
68. Add `kubernetes/` manifests (optional — manifest only)
69. Add `terraform/` notes (optional — README pointer)
70. Add CI secrets rotation note in SECURITY.md

### Batch H (parallel — docs)
71. Rewrite `README.md` with the new architecture diagram
72. Add `docs/ARCHITECTURE.md` (sequence diagrams in Mermaid)
73. Add `docs/SECURITY.md` (threat model + mitigation matrix)
74. Add `docs/RUNBOOK.md` (incident response)
75. Add `docs/DEPLOYMENT.md` (chain-specific deploy guide)
76. Add `docs/CONTRIBUTING.md`
77. Add `docs/CHANGELOG.md`
78. Add `docs/ADR/` directory with 3 ADRs:
   - 001 Why OZ v5 over v4
   - 002 Why Hardhat 2 over Hardhat 3
   - 003 Why Foundry + Ape, not Truffle/Ganache
79. Add `docs/api/openapi.yaml` (OpenAPI spec for the Fastify server)
80. Add `docs/postman/` collection (mirror of server.dev.http / server.prod.http)

### Batch I (parallel — toolchain polish)
81. Add `tsconfig.json` for TypeScript support in the Hardhat config
82. Add `typechain-types/` to gitignore, enable `typechain`
83. Add Foundry invariant tests skeleton (`contracts/test/`)
84. Add `forge fmt` check in CI
85. Add Ape `tests/python/test_ape_compile.py` (smoke test)
86. Add `scripts/check-all.sh` (runs npm audit, lint, format, compile, test)
87. Add `Makefile` (shortcut aliases)
88. Add `.dockerignore`
89. Add `renovate.json` (alternative to dependabot)
90. Add `actions/setup-node` cached install for CI

### Batch J (parallel — final integration)
91. Run `npx hardhat compile` — must succeed
92. Run `npx hardhat test` — all tests must pass
93. Run `forge build` — must succeed
94. Run `forge test` — invariant tests must pass
95. Run `solhint` — no errors (warnings OK)
96. Run `eslint` — no errors
97. Run `prettier --check` — no diffs
98. Verify `server/abi.json` matches the new contract
99. Verify `.env.example` has every env var the code reads
100. Write `.upgrade/v2/SUMMARY.md` with the final state

## Final file count target

| New / changed | Count |
|---|---|
| New contract files | 3 (ReplayLibrary v2, V3 v2, V4 stub) |
| New test files | 1 (`tests/hardhat/`) |
| New server files | 2 (validation schemas, health, metrics) |
| New docs | 9 (Architecture, Security, Runbook, Deployment, Contributing, Changelog, 3 ADRs) |
| New config | 6 (eslint, prettier, editorconfig, renovate, dependabot, Dockerfile) |
| New CI | 2 (ci.yml, audit.yml) |
| New scripts | 4 (verify, health-check, check-all, Makefile) |
| New `.upgrade/v2/` | 11 (10 domain reports + 1 SUMMARY) |

## Acceptance criteria

- [ ] `npx hardhat compile` exits 0
- [ ] `npx hardhat test` passes all tests
- [ ] `forge build` exits 0
- [ ] `solhint` reports 0 errors
- [ ] No `process.env` in source comments or logs
- [ ] No use of deprecated OZ v4 paths anywhere
- [ ] No `xss-clean` dependency (deprecated, broken on Node 18+)
- [ ] All admin actions go through `onlyAdmin` + `whenNotPaused`
- [ ] Every external function has NatSpec
- [ ] Every `require` → custom error
