# Spec 01 — Stellar CLI Version Contract

## Status

Required before v1.

## Problem

Kaleido depends on Stellar CLI behavior for build, deploy, bindings, invoke and XDR-related commands. If Stellar CLI output or flags change, Kaleido can parse incorrect data and write invalid `kaleido.artifacts.json`.

## Goal

Declare, enforce and test a supported Stellar CLI version range.

## External contract

Kaleido uses Stellar CLI as the operational backend for:

- `stellar contract build`
- `stellar contract deploy`
- `stellar contract bindings`
- `stellar contract invoke`
- `stellar xdr`
- `stellar doctor`

Kaleido must not assume untested Stellar CLI versions are safe.

## Required decisions

Set these constants in `@kaleido-xlm/core`:

```ts
export const STELLAR_CLI_MIN_VERSION = "x.y.z";
export const STELLAR_CLI_TESTED_MAX_VERSION = "x.y.z";
```

Rules:

- Below `STELLAR_CLI_MIN_VERSION`: reject.
- Above `STELLAR_CLI_TESTED_MAX_VERSION`: reject by default.
- Add `--allow-untested-stellar-cli` only for local override.
- CI must never use `--allow-untested-stellar-cli`.

## Implementation

### Files

```txt
packages/core/src/stellar-cli/version.ts
packages/core/src/stellar-cli/check-stellar-cli-version.ts
packages/core/src/shell/run-command.ts
packages/core/src/errors/KaleidoError.ts
docs/stellar-cli-version-contract.md
```

### Version parser

```ts
export function parseStellarCliVersion(output: string): string {
  const match = output.match(/\b(\d+\.\d+\.\d+)\b/);

  if (!match) {
    throw new KaleidoError(
      "Could not parse Stellar CLI version.",
      KaleidoErrorCode.STELLAR_CLI_VERSION_PARSE_FAILED,
      "Run `stellar --version` and check the output."
    );
  }

  return match[1];
}
```

### Runtime check

Before any command that shells out to `stellar`, run:

```ts
await checkStellarCliVersion({
  allowUntested: options.allowUntestedStellarCli === true,
});
```

### New error codes

```txt
KALEIDO_STELLAR_CLI_NOT_FOUND
KALEIDO_STELLAR_CLI_VERSION_PARSE_FAILED
KALEIDO_UNSUPPORTED_CLI_VERSION
KALEIDO_UNTESTED_CLI_VERSION
```

## Fixture naming

Use CLI semver in fixture filenames:

```txt
deploy.v21.3.0.success.fixture.txt
deploy.v22.0.0.success.fixture.txt
invoke.v21.3.0.success.fixture.txt
bindings.v22.0.0.success.fixture.txt
version.v22.0.0.fixture.txt
```

## Tests

Required tests:

```txt
parseStellarCliVersion parses known outputs
unsupported old version fails
untested newer version fails by default
untested newer version passes with explicit override
run-command checks CLI version before stellar commands
```

## Documentation

Add:

```txt
Supported Stellar CLI versions
Minimum version
Tested maximum version
How to upgrade
How to use --allow-untested-stellar-cli locally
Why CI must not use the override
```

## Acceptance criteria

```txt
stellar --version is checked at runtime
unsupported versions fail with KALEIDO_UNSUPPORTED_CLI_VERSION
untested newer versions fail with KALEIDO_UNTESTED_CLI_VERSION
fixtures include Stellar CLI semver in filename
docs declare supported version range
CI runs fixture tests for at least two Stellar CLI versions
```
