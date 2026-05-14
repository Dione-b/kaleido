# v1 Readiness

## Track A — Pre-v1 Public Publish (`0.x` / `next`)

- package metadata valid
- package READMEs complete
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm test:consumer`
- release workflow aligned with chosen dist-tag

## Track B — Stable Release (`v1.0.0` / `latest`)

- all five v1 specs implemented and accepted
- three consecutive successful scheduled smoke runs
- no unretried smoke failure in the last 7 days
- release evidence captured in `docs/release/v1.0.0.md`
