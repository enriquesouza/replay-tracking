# ADR 003 — Foundry + Ape, not Truffle/Ganache

**Date**: 2026-07-05
**Status**: Accepted
**Deciders**: @enriquesouza

## Context

Truffle and Ganache (the original Truffle Suite packages) were **archived on
Feb 26, 2024** by ConsenSys. They no longer receive security or compatibility
updates.

## Decision

Install **Foundry 1.7.1** (forge, cast, anvil, chisel) and **Ape 0.8.50**
(ApeWorx, Python). **Do not install** Truffle or Ganache.

## Consequences

### Positive
- Foundry's anvil is a high-performance EVM that supports EIP-1559, EIP-4844,
  and the latest EVM upgrades.
- Foundry's `forge test` is significantly faster than Hardhat's mocha.
- Ape is the official successor to Brownie and is actively maintained.
- We support two languages (Solidity via Hardhat, Python via Ape) for tests.

### Negative
- Two compilers to maintain (solc-js for Hardhat, solc binary for Forge).
- Foundry's Rust toolchain is a heavier system dependency (~500 MB).

## Alternatives considered

- **Install Truffle + Ganache**: rejected — both packages are archived and
  have known Node 20+ incompatibilities.
- **Brownie-only**: rejected — Brownie is in maintenance mode; Ape is the
  recommended successor. We install both so existing Brownie users can still
  contribute.
