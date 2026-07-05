# ADR 002 — Hardhat 2.x, not Hardhat 3.x

**Date**: 2026-07-05
**Status**: Accepted
**Deciders**: @enriquesouza

## Context

Hardhat 3 is now the latest major. It ships with Viem as the primary provider
and removes several Ethers-only APIs.

## Decision

Stay on **Hardhat 2.28.6** (the latest 2.x release). Use the Hardhat-2-compatible
plugin versions (`hardhat-ethers@^3.1.3`, `hardhat-toolbox@^6.1.2`,
`hardhat-verify@^2.1.0`).

## Consequences

### Positive

- The project already uses Ethers v6; the v2 plugin line is the matching one.
- The 2.x plugin ecosystem is more mature.
- Migration is surgical: 0 breaking changes for our code beyond OZ v5.

### Negative

- Hardhat 2 doesn't fully support Solidity 0.8.35's stack-trace features.
  We get a benign warning at compile time.
- We'll need to migrate to Hardhat 3 in 2027+ if/when the project adds Viem.

## Alternatives considered

- **Migrate to Hardhat 3 now**: rejected — too many breaking changes
  (Viem migration, plugin rewrites, ignite-core API changes).
- **Migrate to Foundry-only**: rejected — Hardhat's mocha + chai + ethers
  v6 stack is faster to iterate on for contract tests.
