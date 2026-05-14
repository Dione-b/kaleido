# v1 Readiness

Do not tag `v1.0.0` until these specs are implemented and accepted:

1. Stellar CLI version contract — **complete** (Tasks 1–3).
2. Complete `KALEIDO_*` error surface — **complete** (Task 4).
3. npm publish and consumer isolation — **complete** (Tasks 5–7).
4. Live testnet smoke CI — **complete** (Task 8).
5. Experimental multi-contract dependency deploy — **complete** (Tasks 9–12).

Pre-v1 publishing is allowed only under `0.x`, `alpha`, `beta`, or `next`.

Before `latest`, require:

- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm test:consumer`
- three consecutive successful scheduled testnet smoke runs
- no unretried testnet smoke failure in the last 7 days

The v1 release requires three consecutive successful scheduled `Testnet Smoke` runs and no unretried smoke failure in the previous 7 days.

Verify in GitHub Actions: filter workflow `Testnet Smoke` by `event:schedule` and confirm the three newest scheduled runs are green, with no hard (non-retried) smoke failure in the last seven days.
