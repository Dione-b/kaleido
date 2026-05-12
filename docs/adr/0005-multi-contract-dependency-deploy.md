# ADR 0005: Multi-contract dependency deploy

## Status

Draft (planned)

## Date

2026-05-11

## Context

After single-contract MVP, Kaleido must prove **multi-contract** workflows: build and deploy order, dependency edges, binding generation for multiple contracts, and invocations that rely on more than one deployed ID.

The **hard part is not topological sort** of deploys—it is **how** a dependent contract receives the **`contractId`** of its dependencies (env injection, generated config slice, CLI args to Stellar, or templated metadata) without turning Kaleido into a secret store or a second SDK.

## Decision (planned)

Accept **`dependsOn`** (or equivalent) in `kaleido.config.ts`. Core resolves **deploy order** via a DAG.

**ContractId injection** for dependents must be designed explicitly in a follow-up revision of this ADR (options: Stellar CLI env, temporary generated `.env.kaleido`, manifest fragment consumed by contracts—each has trade-offs for security and reproducibility).

## Consequences

- Unblocks “token then marketplace” validation flow from the architecture doc.
- Requires tests for cycle detection, missing artifacts, and partial deploy resume semantics (TBD).

## Related

- [`architecture.md`](../architecture.md) — multi-contract section.
- [ADR 0002](./0002-local-artifacts-as-source-of-truth.md) — IDs remain local artifacts, not a central registry.
