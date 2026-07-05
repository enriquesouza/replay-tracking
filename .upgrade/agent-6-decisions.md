# Agent 6 — Foundry install decision (2026-07-05)

## Install status: SUCCESS

```
$ foundryup
forge 1.7.1
cast  1.7.1
anvil 1.7.1
chisel 1.7.1
```

All four binaries are at `~/.foundry/bin/{forge,cast,anvil,chisel}` and on the shell PATH after `source ~/.zshenv`.

## Config files created

- **`foundry.toml`** — points at `contracts/`, `out=out`, `libs=[node_modules]`, optimizer 200 runs, EVM `osaka`, Solidity `0.8.35`. Auto-detects OZ in `node_modules/`.
- **`remappings.txt`** — `@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/`.

## npm scripts added

```json
{
  "scripts": {
    "foundry:build": "forge build",
    "foundry:test": "forge test",
    "foundry:fmt": "forge fmt",
    "anvil": "anvil --host 0.0.0.0 --port 8545",
    "anvil:fork": "anvil --fork-url ${FORK_URL:-https://curtis.rpc.caldera.xyz/http}"
  }
}
```

## Port conflicts

Anvil defaults to port 8545, same as `npx hardhat node`. The two cannot run simultaneously. The user must start only ONE at a time. Documented in `README.md`.

## Notes

- `libusb` warning from foundryup is benign (anvil's HW-wallet integration needs it, not required for normal dev).
- Foundry auto-downloads the Solidity compiler matching `solc_version` in `foundry.toml`. No system `solc` install needed.
