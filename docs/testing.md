# Testing

Default CI does not require testnet access. Tests use mocked command execution and checked-in Stellar CLI output fixtures.

Stellar CLI fixtures live under:

```txt
packages/core/test/fixtures/stellar-cli/
```

Use versioned directories such as `v26.0.0` when the output came from a known CLI version. Use `unknown` only for minimal parser edge cases.

When adding parser behavior:

1. Add the raw CLI output fixture.
2. Add a parser test that reads the fixture.
3. Include at least one failure fixture.
4. Assert the public `KALEIDO_*` error code.

The default GitHub Actions workflow runs typecheck, build, and tests.
