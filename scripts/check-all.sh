#!/usr/bin/env bash
# Run the full local CI suite. Exits 0 only if everything passes.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ npm install (idempotent)"
npm install --no-audit --no-fund

echo "▶ audit (moderate+)"
npm audit --audit-level=moderate

echo "▶ solhint"
npm run --silent lint:sol

echo "▶ hardhat compile"
npm run --silent compile

echo "▶ hardhat test"
npm run --silent test:contracts

echo "▶ forge build"
( export PATH="$HOME/.foundry/bin:$PATH"; forge build )

echo "▶ prettier --check"
npx prettier --check "**/*.{js,ts,json,md,sol}" --ignore-path .gitignore

echo "✅ All checks passed"
