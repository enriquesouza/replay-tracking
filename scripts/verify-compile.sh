#!/usr/bin/env bash
# Verify the contracts compile cleanly.
# Exits 0 on success, non-zero on any compiler error or warning escalated to error.

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v npx >/dev/null 2>&1; then
  echo "❌ npx not found — install Node.js >= 20 first"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 node_modules missing — running npm install"
  npm install
fi

echo "🔨 Compiling contracts with Hardhat (Solidity 0.8.35, OZ v5.6.1)..."
npx hardhat compile

echo "✅ hardhat compile OK"
