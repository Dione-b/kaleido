# ADR 0003: Template manifest and core compatibility

## Status

Draft (planned)

## Date

2026-05-11

## Context

Official and community templates need a **declared contract** against `@kaleido/core` / CLI versions. Without a manifest, `kaleido init` relies on implicit directory layout and human documentation, which drifts and breaks semver intent.

## Decision (planned)

Introduce **`kaleido.template.json`** (name TBD) on each template, including at minimum:

- Template name and semver.
- **`kaleido.compatibleCore`** (or equivalent) range for supported `@kaleido/core` versions.
- Declared paths: contracts root, `kaleido.config.ts`, `kaleido.artifacts.json`, frontend kind (`vite-react`, etc.).

`kaleido init` (or core) will **validate compatibility before copy** and fail with a clear error if unsupported.

## Consequences

- Enables CI matrix: template × core versions.
- Requires release discipline: bump template when core breaks layout contract.

## Related

- [`architecture.md`](../architecture.md) — extensibility section.
- Implementation ticket: validate manifest on `init` after this ADR is accepted.
