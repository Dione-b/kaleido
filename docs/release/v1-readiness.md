# v1 Readiness

## Track A — Pre-v1 Public Publish (`0.x` / `next`)

- package metadata valid
- package READMEs complete
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm test:consumer`
- release workflow aligned with pre-v1 `next` publishing policy in [`docs/release/v1.0.0.md`](./v1.0.0.md#dist-tag-policy)

## Track B — Stable Release (`v1.0.0` / `latest`)

- live testnet smoke workflow configured with CI secrets; three consecutive green scheduled runs per [observability plan](./v1.0.0.md#observability-plan)
- all five v1 specs implemented and accepted, as listed in [`docs/superpowers/specs/00-v1-viability-index.md`](../superpowers/specs/00-v1-viability-index.md)
- three consecutive successful scheduled smoke runs, verified with the procedure in [`docs/release/v1.0.0.md`](./v1.0.0.md#observability-plan)
- no unretried smoke failure in the last 7 days, verified with the procedure in [`docs/release/v1.0.0.md`](./v1.0.0.md#observability-plan)
- release evidence captured in `docs/release/v1.0.0.md`
