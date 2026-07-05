# Architecture

The replay-tracking system has three tiers:

```mermaid
flowchart LR
    subgraph Client
        UI[Web/Mobile App]
    end

    subgraph API["Fastify API (Node 20+)"]
        Routes["server/routes/contract.js"]
        Config["server/config.js"]
        Sanitize["sanitize-html + HPP"]
        RateLimit["@fastify/rate-limit"]
        Auth["x-api-key / JWT"]
    end

    subgraph Blockchain
        Contract[("ReplayTrackingContractV3<br/>(Solidity 0.8.35)")]
        RPC[JSON-RPC provider]
    end

    subgraph Tooling
        Hardhat[Hardhat 2.28.6]
        Forge[Foundry 1.7.1]
        Ape[Ape 0.8.50]
    end

    UI -->|HTTPS| Routes
    Routes --> Config
    Config --> Sanitize
    Config --> RateLimit
    Config --> Auth
    Routes -->|ethers v6| RPC
    RPC --> Contract

    Hardhat -. compiles .-> Contract
    Forge -. compiles .-> Contract
    Ape -. compiles .-> Contract
```

## Request lifecycle

1. Client sends a request with `X-Api-Key` (or `Authorization: Bearer <jwt>`).
2. Fastify's `onRequest` hook validates the key (constant-time compare in prod).
3. The pre-handler hook runs HPP and `sanitize-html` on body / query / params.
4. JSON Schema validation rejects malformed payloads before they hit the handler.
5. The handler makes a single JSON-RPC call to the chain via ethers v6.
6. The result is `BigInt`-safe-serialized and returned.

## Failure modes

| Failure | Detection | Recovery |
|---|---|---|
| RPC unreachable | `provider.getBlockNumber()` in `/ready` | 503 from `/ready`; client retries |
| Rate limit exceeded | `@fastify/rate-limit` | 429 with `Retry-After` |
| Auth failure | `onRequest` hook | 401 |
| Schema violation | Fastify built-in | 400 with the validation error |
| Out-of-gas on chain | `tx.wait()` throws | 400 + log; admin retries with higher gas |
