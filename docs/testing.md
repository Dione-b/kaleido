# Testing

Default CI does not require testnet access, Freighter, or private keys. Tests use mocked command execution, mocked generated bindings, and checked-in Stellar CLI output fixtures.

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

When adding `@kaleido/client` behavior:

1. Use mocked generated bindings.
2. Use mocked wallet adapters.
3. Assert XDR is omitted unless `debugXdr` is enabled.
4. Assert raw output is omitted unless `debugRaw` is enabled.
5. Assert wallet and binding failures use public `KALEIDO_*` codes.

The default GitHub Actions workflow runs typecheck, build, and tests.
