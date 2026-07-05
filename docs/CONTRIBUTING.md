# Contributing

## Setup

```bash
# 1. Fork + clone
git clone <your-fork>
cd replay-tracking

# 2. Install
npm install

# 3. (Optional) Foundry + Python tools
npm run foundry:install
npm run python:setup

# 4. Verify everything
bash scripts/check-all.sh
```

## Workflow

1. Create a feature branch: `git checkout -b feat/my-change`
2. Write code + tests
3. Run `bash scripts/check-all.sh` and ensure it passes
4. Run `npm run format` to auto-format
5. Commit with a [conventional commit](https://www.conventionalcommits.org/) message:
   - `feat: add CSV export endpoint`
   - `fix: handle empty user histories`
   - `docs: update SECURITY.md`
   - `chore: bump ethers to 6.17`
6. Open a PR

## Code style

- **Solidity**: `solhint:recommended` (see `.solhint.json`)
- **JavaScript**: ESLint flat config (`eslint.config.js`)
- **Formatting**: Prettier (`.prettierrc`)
- **Commits**: Conventional Commits (`commitlint.config.js`)

Pre-commit hooks (via `husky` + `lint-staged`) run prettier + solhint + eslint
on every commit.

## Testing

- **Contract tests**: `npm run test:contracts` (mocha + chai + ethers v6)
- **Server tests**: `npm test` (Vitest + supertest)
- **Foundry tests**: `npm run foundry:test` (Forge)

Add tests for every change. The contract test suite has 32 tests and is the
canonical reference for the contract's behavior.
