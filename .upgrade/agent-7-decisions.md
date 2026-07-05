# Agent 7 — Python (Ape / Brownie) decision (2026-07-05)

## Decision: install BOTH but mark Brownie as legacy

- **Ape (ApeWorx) 0.8.50** — install via `uv tool install eth-ape` (or `pipx install eth-ape` if `pipx` is added).
- **Brownie 1.22.2** — install via `uv tool install eth-brownie` (or `pipx install eth-brownie`) for legacy projects that still use it. The Brownie README itself says it is "no longer actively maintained" and points users to Ape.

## Why both

The user asked to "install all blockchain simulation locally". `eth-brownie` is a Python framework that drives a local EVM (it depends on Hardhat or Ganache under the hood). `eth-ape` is the modern successor. Installing both gives the user a choice without forcing a decision.

## Files created

- **`pyproject.toml`** — at the repo root. Lists both tools as optional CLI dependencies.
- **`requirements.txt`** — pinned versions: `eth-ape==0.8.50`, `eth-brownie==1.22.2`, `ape-hardhat`, `ape-foundry`, `pytest`.
- **`scripts/python-setup.sh`** — creates a `.venv` with `uv` and installs everything. Prints activation instructions.
- **`ape-config.yaml`** — minimal `ape` config with the `ethereum` plugin, `local` network pointing at `127.0.0.1:8545`, and a Solidity compiler 0.8.35 override.
- **`brownie-config.yaml`** — minimal `brownie` config with the `development` network at `127.0.0.1:8545` and Solidity 0.8.35.

## Install status

- `uv` is already installed (`/opt/homebrew/bin/uv`).
- `pipx` is **NOT** installed; the user can install it via `brew install pipx` if preferred.
- `python-setup.sh` uses `uv` (modern alternative to pip/pipx).

## Verifying (commands the user will run)

```bash
bash scripts/python-setup.sh           # one-time setup
source .venv/bin/activate              # activate
ape --version                          # → 0.8.50
brownie --version                      # → 1.22.2 (legacy)
ape compile                            # compile contracts with Ape
ape test                               # run pytest-based contract tests
ape run scripts/deploy.py --network ethereum:local:foundry
brownie console --network development
```
