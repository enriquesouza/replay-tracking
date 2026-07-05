#!/usr/bin/env bash
# Run the full local CI suite. Exits 0 only if every *build/test/lint* check
# passes. The audit step is reported but non-fatal because most advisories
# are in transitive deps of Hardhat/Foundry (bn.js, lodash, etc.) that we
# cannot fix without forking those tools.
# Bun-aware: uses bunx if available, otherwise npx.

set -euo pipefail
cd "$(dirname "$0")/.."

# Pick the package runner.
if command -v bun >/dev/null 2>&1; then
  RUNNER="bunx"
  INSTALLER="bun install --frozen-lockfile"
  AUDIT="bun audit --audit-level=moderate"
elif command -v npm >/dev/null 2>&1; then
  RUNNER="npx"
  INSTALLER="npm ci"
  AUDIT="npm audit --audit-level=moderate"
else
  echo "❌ Neither Bun nor npm is on the PATH."
  exit 1
fi

echo "▶ install ($INSTALLER)"
$INSTALLER

echo "▶ audit (non-fatal — most findings are in Hardhat transitive deps)"
$AUDIT || echo "⚠️  audit found advisories — see output above"

echo "▶ solhint"
$RUNNER solhint 'contracts/**/*.sol'

echo "▶ hardhat compile"
$RUNNER hardhat compile

echo "▶ hardhat test"
$RUNNER hardhat test

echo "▶ forge build"
if [ -d "$HOME/.foundry/bin" ]; then
  export PATH="$HOME/.foundry/bin:$PATH"
fi
forge build

echo "▶ prettier --check"
$RUNNER prettier --check "**/*.{js,ts,json,md,sol}" --ignore-path .gitignore

echo "✅ All checks passed"
