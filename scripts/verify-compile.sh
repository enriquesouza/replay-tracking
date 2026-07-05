#!/usr/bin/env bash
# Verify the contracts compile cleanly.
# Exits 0 on success, non-zero on any compiler error.
# Bun-aware: uses `bunx` if available, otherwise `npx`.

set -euo pipefail
cd "$(dirname "$0")/.."

if command -v bunx >/dev/null 2>&1; then
  RUNNER="bunx"
elif command -v npx >/dev/null 2>&1; then
  RUNNER="npx"
else
  echo "❌ Neither bunx nor npx is on the PATH. Install Node 20+ or Bun 1.3+."
  exit 1
fi

# Install deps if node_modules is missing.
if [ ! -d node_modules ]; then
  echo "📦 node_modules missing — installing"
  if [ -f bun.lock ] && command -v bun >/dev/null 2>&1; then
    bun install --frozen-lockfile
  elif [ -f package-lock.json ]; then
    npm ci
  else
    echo "❌ No lockfile (bun.lock or package-lock.json) found."
    exit 1
  fi
fi

echo "🔨 Compiling contracts with $RUNNER (Solidity 0.8.35, OZ v5.6.1)..."
$RUNNER hardhat compile

echo "✅ hardhat compile OK"
