# Publish Checklist

## Before `next`

- verify package READMEs are current for `@kaleido/cli`, `@kaleido/client`, and `@kaleido/core`
- verify `.github/workflows/release.yml` is aligned with the pre-v1 dist-tag policy
- run `pnpm typecheck`
- run `pnpm build`
- run `pnpm test`
- run `pnpm test:consumer`
- run `pnpm test:consumer:client-bundlers`
- run `pnpm ci:publish-matrix`

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm test:consumer
pnpm test:consumer:client-bundlers
pnpm ci:publish-matrix
```

## Before `latest`

- complete every `next` check above
- verify all five v1 specs are implemented and accepted
- verify three consecutive scheduled `Testnet Smoke` runs succeeded
- verify no unretried smoke failure occurred in the previous 7 days
- verify the release evidence section in `docs/release/v1.0.0.md` is complete
- verify release owner approval for the `latest` promotion
