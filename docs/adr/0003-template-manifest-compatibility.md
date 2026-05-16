# ADR 0003: Template manifest and core compatibility

## Status

Accepted

## Date

2026-05-11

## Context

Official and community templates need a **declared contract** against `@kaleido-xlm/core` / CLI versions. Without a manifest, `kaleido init` relies on implicit directory layout and human documentation, which drifts and breaks semver intent.

## Decision

Each template must include **`kaleido.template.json`**, including:

- Template name and semver.
- **`kaleido.compatibleCore`** (or equivalent) range for supported `@kaleido-xlm/core` versions.
- Declared paths: contracts root, `kaleido.config.ts`, `kaleido.artifacts.json`, frontend kind (`vite-react`, etc.).

`kaleido init` validates compatibility before copy and fails with:

- `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND` when the manifest is missing.
- `KALEIDO_TEMPLATE_INCOMPATIBLE` when the manifest is invalid or incompatible with the current core version.

## Consequences

- Enables CI matrix: template × core versions.
- Requires release discipline: bump template when core breaks layout contract.
- Makes template copy fail earlier, before partial project creation from an incompatible template.

## Related

- [`architecture.md`](../architecture.md) — extensibility section.
- [`templates.md`](../templates.md) — manifest schema and compatibility behavior.
