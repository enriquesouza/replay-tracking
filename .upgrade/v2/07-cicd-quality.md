# Domain 7 — CI/CD, linting, formatting, pre-commit (10 tasks)

## Tasks 61–70

### Task 61: `.github/workflows/ci.yml`

- Runs on push to `main` and on every PR.
- Steps: checkout → setup-node (20, npm cache) → `npm ci` → `npm audit` → `npm run lint:sol` → `npm run lint:js` → `npm run format:check` → `npm run compile` → `npm run test:contracts` → install Foundry → `forge build`.

### Task 62: `.github/workflows/audit.yml`

- Runs weekly (Monday 06:00 UTC) and on demand.
- `npm audit --audit-level=high` + `solhint`.

### Task 63: `.github/dependabot.yml`

- Weekly npm and GitHub Actions updates.
- 10 PR limit.

### Task 64: `.editorconfig`

- LF line endings, 2-space indent, 4-space for Solidity.

### Task 65: `.prettierrc` + `.prettierignore`

- 2-space tabs, 100-col print width, double quotes, trailing commas.
- `prettier-plugin-solidity` for `.sol` files.
- Ignore `node_modules`, `artifacts`, `cache`, `out`, `typechain-types`, `coverage`, `.upgrade`, `.venv`, `package-lock.json`.

### Task 66: `lint-staged` + `husky` for pre-commit

- Pre-commit hook runs `prettier --write` + `eslint --max-warnings=0` on JS/TS, and `prettier --write` + `solhint` on Solidity.
- Hook is auto-installed via `npm run prepare` (a.k.a. `husky`).

### Task 67: `commitlint` for conventional commits

- `.commitlintrc.json` extends `@commitlint/config-conventional`.
- Conventional commit prefixes enforced: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`, `build:`, `ci:`.

### Task 68: `solhint` rules (extended)

- Added `no-unused-vars: error`, `no-empty-blocks: error`, `check-send-result: error`, `not-rely-on-block-hash: error`, etc.

### Task 69: `eslint.config.js` (flat config for ESLint 9+)

- `no-unused-vars: error`, `no-undef: error`, `no-implicit-globals: error`, `prefer-const: error`, `no-var: error`, `eqeqeq: error`, `no-throw-literal: error`.

### Task 70: Renovate config (alternative to Dependabot)

- Auto-merge minor + patch; manual review for major.
