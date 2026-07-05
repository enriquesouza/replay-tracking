# Domain 10 — Toolchain polish, Foundry/Ape/TypeScript, monorepo hygiene (10 tasks)

## Tasks 91–100

### Task 91: Foundry invariant tests skeleton

- Reserved for v3. The `forge test` target is wired and ready.

### Task 92: `forge fmt` check in CI

- Wired via `npm run foundry:fmt`.

### Task 93: Typechain config

- `typechain: { outDir: "typechain-types", target: "ethers-v6" }` in `hardhat.config.js`.
- `typechain-types/` added to `.gitignore`.

### Task 94: `scripts/check-all.sh`

- One-shot local CI: install → audit → solhint → compile → contract tests → forge build → prettier --check.

### Task 95: `Makefile`

- Shortcut aliases for every common task.

### Task 96: `.dockerignore`

- Excludes build artifacts, IDE files, Python venv, env files.

### Task 97: Renovate config

- `renovate.json` as an alternative to Dependabot.

### Task 98: `actions/setup-node` cached install for CI

- `cache: "npm"` in `.github/workflows/ci.yml`.

### Task 99: `package.json#overrides`

- Pin `fastify ^4.28.1` and `cookie ^0.7.0`.

### Task 100: `.upgrade/v2/SUMMARY.md` (this file)

- Final summary of all 100 tasks.
