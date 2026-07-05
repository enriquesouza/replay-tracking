# ADR 001 — OpenZeppelin Contracts v5 over v4

**Date**: 2026-07-05
**Status**: Accepted
**Deciders**: @enriquesouza

## Context

The project originally used three OZ aliases (`@openzeppelin/contracts4` 4.9.6,
`@openzeppelin/contracts47` 4.7.0, `@openzeppelin/contracts5` 5.0.2) — a
maintenance liability. We needed to pick a single version.

## Decision

Adopt **OpenZeppelin Contracts v5.6.1** (the latest audited release as of
2026-07-05).

## Consequences

### Positive

- Single dep, no aliases.
- v5 has been stable for 2+ years, all known audit issues resolved.
- Custom errors are now first-class (cheaper gas than `require` strings).
- `EnumerableSet.Bytes32Set` replaces our unbounded `bytes32[]` array.
- Storage layout compatible with future upgradeable variants.

### Negative

- `Ownable` constructor now requires `address initialOwner` (breaking).
- `security/Pausable` and `security/ReentrancyGuard` moved to `utils/`.
- We must regenerate the deployed contract's ABI; existing on-chain contracts
  must be redeployed.

## Alternatives considered

- **Stay on v4.9.6**: rejected — v4 is end-of-life and no longer gets security
  backports.
- **Adopt OZ Contracts Upgradeable**: rejected — the contract is not
  upgradeable today. We added a `__gap` of 50 storage slots so a future
  upgradeable version is possible without a redeploy.
