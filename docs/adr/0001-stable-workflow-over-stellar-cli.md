# ADR 0001: Stable Kaleido workflow over Stellar CLI churn

## Status

Accepted

## Date

2026-05-11

## Context

Kaleido orchestrates the official Stellar CLI and Soroban toolchain. Those tools change flags, output shapes, and defaults across versions. Users adopting Kaleido expect **repeatable commands** (`kaleido build`, `kaleido deploy`, `kaleido generate`, `kaleido invoke`) without rewriting local scripts on every upstream release.

If parsing and subprocess details leak into the CLI or userland, the project becomes hard to maintain and breaks the “meta-framework” positioning.

## Decision

1. **User-visible stability** is defined at the **Kaleido CLI command surface** and the **serialized project files** (`kaleido.config.ts`, `kaleido.artifacts.json`), not at every Stellar CLI flag.
2. **All adaptation** to Stellar CLI invocation, stdout/stderr interpretation, and path normalization lives in **`@kaleido/core`**, behind a small shell abstraction (`run-command` and contract/network helpers).
3. **`@kaleido/cli`** remains a thin layer: parse args, print structured errors, call core services.
4. **Testing** must treat Stellar CLI as an unstable dependency: unit tests plus **versioned fixtures** of CLI output for parsers; CI matrix against supported Stellar CLI versions when feasible.

## Consequences

- **Positive:** Clear ownership of “where upstream pain goes”; easier docs and CI for users.
- **Positive:** Kaleido can rev core patch versions when only Stellar integration changes, while keeping CLI verbs stable.
- **Negative:** Maintainers must update fixtures and compatibility notes when Stellar CLI output changes; ignoring that creates silent breakage.
- **Neutral:** Users may still need to upgrade Stellar CLI for network features; Kaleido documents supported ranges rather than pretending versions do not matter.

## Related

- [`architecture.md`](../architecture.md) — package boundaries and promise.
- Future [ADR 0004](./0004-error-codes-as-public-api.md) — stable codes for `COMMAND_FAILED`-style failures from wrapped tools.
