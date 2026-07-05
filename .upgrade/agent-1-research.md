# Toolchain Research (2026-07-05)

## Recommended versions (target)

| Tool | Recommended | Why |
|---|---|---|
| Solidity | **0.8.35** | Latest stable. Default EVM `osaka`. Adds ERC-7201 builtin, `--experimental` flag. Compiles `^0.8.24` source unchanged. |
| Hardhat | **2.26.0+** (Hardhat 2 line, NOT 3) | The project's contracts use `OZv4/v5` + `AccessControl`; Hardhat 3 has major plugin-architecture changes. Stay on 2.x for stability, but use the latest 2.x release. `hardhat-toolbox@7.0.0` is the matching toolbox. |
| `@nomicfoundation/hardhat-toolbox` | **7.0.0** | Bundles the matching plugin set for Hardhat 2.26+. |
| `@nomicfoundation/hardhat-ethers` | **4.0.14** | Replaces the legacy `@nomiclabs/hardhat-ethers` (Ethers v6 ready). |
| `@nomicfoundation/hardhat-verify` | **3.0.21** | Replaces deprecated `@nomiclabs/hardhat-etherscan`. |
| `@nomicfoundation/hardhat-ignition` | **3.1.8** | Modern declarative deploy module (replaces raw `scripts/deploy-*.js`). Optional. |
| `solc-js` | **0.8.35** | Matches the compiler we pin in `hardhat.config.js`. |
| OpenZeppelin Contracts | **5.6.1** | Latest audited. v5 is a hard fork from v4. |
| Ethers | **6.17.0** | Ethers v6 is stable; v7 is not yet released. |
| `@openzeppelin/contracts-upgradeable` | NOT added | The contract is non-upgradeable. |
| Foundry (forge/cast/anvil/chisel) | **1.7.1** | Installed via `foundryup`. |
| Truffle | **DEPRECATED** — do not install | Truffle Suite was archived on Feb 26, 2024. Last release 5.11.5 (Sep 2023). No security patches. Use Hardhat or Foundry instead. |
| Ganache | **DEPRECATED** — do not install | The Truffle Ganache repo was archived Feb 26, 2024. Last release 7.9.0 (Jul 2023). The `ganache` npm package is unmaintained. Use Anvil or Hardhat Node. |
| Brownie | **LEGACY** — optional, install only on user request | Brownie's own README says "no longer actively maintained" and points users to Ape. It still gets sporadic 1.22.x releases (May 2026). |
| Ape (ApeWorx) | **0.8.50** | Active, recommended Python framework. Successor to Brownie. |

## Solidity 0.8.24 → 0.8.35 breaking changes that matter for us

None at the source level — the contract `pragma solidity ^0.8.24;` is still satisfied by 0.8.35. The notable 0.8.30+ changes are:

- **0.8.30** (May 2025): Default EVM → `prague`.
- **0.8.31** (Dec 2025): Default EVM → `osaka`. Deprecation warnings for ABI coder v1, `send`/`transfer` on addresses, contract-type comparisons, and virtual modifiers. EIP-4788 / Fusaka support.
- **0.8.32** (Dec 2025): Bug fix in array storage clearing.
- **0.8.34** (Feb 2026): Storage / transient-storage layout bug fix.
- **0.8.35** (Apr 2026): Adds `erc7201` builtin, `--experimental` flag.

For `^0.8.24` pragma, 0.8.35 is fully source-compatible.

## OpenZeppelin v4 → v5 breaking changes (apply during contract migration)

The current contract uses:

| Old (v4) | New (v5) | Change |
|---|---|---|
| `security/Pausable.sol` | `utils/Pausable.sol` | Path moved out of `security/`. |
| `security/ReentrancyGuard.sol` | `utils/ReentrancyGuard.sol` | Path moved. |
| `access/Ownable.sol` | `access/Ownable.sol` | Same path. **Constructor now REQUIRES `initialOwner` arg**: `Ownable(initialOwner)`. Old `Ownable()` form is gone. |
| `access/AccessControl.sol` | `access/AccessControl.sol` | Same path. **Default constructor removed** — use `_grantRole(DEFAULT_ADMIN_ROLE, msg.sender)` in your own constructor. |
| `utils/Address.sol` | `utils/Address.sol` | `Address.sendValue`, `functionCall`, etc. unchanged. `Address.isContract` still present. |
| `utils/structs/EnumerableSet.sol` | `utils/structs/EnumerableSet.sol` | Same. Not used by this contract anyway. |
| `utils/Strings.sol` | `utils/Strings.sol` | `escapeJSON` now escapes U+0000–U+001F (not used by this contract). |

Other v4→v5 that don't affect this project: `ReentrancyGuard` and `ERC721Holder` etc. are no longer transpiled; `ECDSA` malleability is partly deprecated; `Initializable`/`UUPSUpgradeable` are not transpiled.

## Hardhat breaking changes vs 2.22.6

Hardhat 2.x latest (2.26.0+) is mostly compatible with 2.22.6. The main one that touches us is the **removal of `@nomiclabs/hardhat-etherscan` in favor of `@nomicfoundation/hardhat-verify`**. The etherscan config block in the existing `hardhat.config.js` (commented out) is therefore stale and should be updated or removed.

## Foundry install state

```text
Foundry 1.7.1 installed at $HOME/.foundry/bin/{forge,cast,anvil,chisel}
forge build / forge test / cast call / anvil all available
Foundry uses Solidity 0.8.35 by default (auto-downloaded by the toolchain).
```

## Notes

- **Truffle Suite is archived.** We deliberately do NOT install `truffle` or `ganache`. Documented in `.upgrade/agent-5-decisions.md` and in the main `README.md`.
- **Brownie is in maintenance limbo.** We install only the Python framework (Ape) and document Brownie in `requirements.txt` as a `pipx`-installable legacy tool.
- **Hardhat 3** is a major rewrite with Viem-first support. The plugin ecosystem (`@nomicfoundation/hardhat-toolbox`) still has its 2.x line at v7, so we stay on 2.x for this project.
- **Node version**: project already runs on Node 22.22.3. All recommended packages support Node 22.
- **macOS libusb warning** from `foundryup` is benign (anvil's hardware-wallet integration needs it; not required for normal dev).
