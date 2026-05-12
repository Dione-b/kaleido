# ADR 0004: Stable error codes as public API

## Status

Draft (planned)

## Date

2026-05-11

## Context

CI pipelines, support playbooks, and programmatic wrappers need **stable identifiers** for failure modes. Ad-hoc messages change; opaque `Error` strings do not compose.

## Decision (planned)

1. Expose **stable machine codes** for Kaleido failures (e.g. prefixed `KALEIDO_*` or a single documented namespace).
2. Document the mapping in `docs/cli.md` or a dedicated reference.
3. **Migrate existing codes** (e.g. `CONFIG_NOT_FOUND`) with a **changelog** and, if needed, a **transition window** (duplicate old + new in output) before removing old codes.

## Consequences

- Breaking change for anyone parsing legacy codes—must be semver and communicated.
- Enables fixture-based tests that assert on `code` fields, not full English strings.

## Related

- [`architecture.md`](../architecture.md) — errors as public API.
- [ADR 0001](./0001-stable-workflow-over-stellar-cli.md) — wrapped Stellar failures still need stable outer codes.
