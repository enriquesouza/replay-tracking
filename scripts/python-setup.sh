#!/usr/bin/env bash
# One-time Python toolchain setup for replay-tracking.
# Installs uv, creates .venv, installs eth-ape, ape plugins, and (optionally) eth-brownie.
#
# Usage:
#   bash scripts/python-setup.sh
#
# After this finishes, activate the venv with:
#   source .venv/bin/activate

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v uv >/dev/null 2>&1; then
  echo "📦 uv not found — installing via the official installer"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "uv version: $(uv --version)"

if [ ! -d .venv ]; then
  echo "🐍 Creating .venv"
  uv venv .venv --python 3.12
fi

echo "📥 Installing Python dependencies from requirements.txt"
uv pip install --python .venv/bin/python -r requirements.txt

echo ""
echo "✅ Python toolchain ready"
echo ""
echo "Activate with:    source .venv/bin/activate"
echo "Then try:         ape --version"
echo "                  brownie --version"
echo "                  ape compile"
echo "                  ape test"
