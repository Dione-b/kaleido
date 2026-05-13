# Spec 04 — Live Testnet Smoke CI

## Status

Required before v1.

## Problem

Fixture tests prove parser behavior. They do not prove the actual Kaleido promise:

```txt
init -> build -> deploy -> generate -> invoke
```

That flow must be verified against a real Stellar network before v1.

## Goal

Add scheduled and release-gated smoke CI that deploys and invokes the official counter template on Stellar testnet.

## Preconditions

This spec depends on:

```txt
Spec 01 — Stellar CLI Version Contract
Spec 02 — KALEIDO_* Error Surface
Spec 03 — Consumer Isolation
```

## CI command flow

```bash
kaleido init smoke-app --template react-vite-counter
cd smoke-app
kaleido build counter
kaleido deploy counter --network testnet --source "$CI_IDENTITY"
kaleido generate counter --network testnet
kaleido invoke counter.increment --network testnet --source "$CI_IDENTITY"
```

## Identity model

Do not store private keys in repository.

Preferred model:

```txt
Use Stellar CLI identity alias configured in CI
Pass alias through --source
Do not pass secret key directly to Kaleido
```

Kaleido must reject source values that look like secret keys or seed phrases.

## GitHub secrets

```txt
KALEIDO_CI_IDENTITY_ALIAS
KALEIDO_CI_STELLAR_CONFIG_B64
```

Alternative if unavoidable:

```txt
KALEIDO_CI_SECRET_KEY
```

If secret key is used, it must be imported into Stellar CLI config before Kaleido runs, then deleted at job end. Kaleido must still receive only the alias.

## Assertions

After each step:

```txt
exit code is 0
expected output exists
kaleido.artifacts.json exists
contractId exists after deploy
contractId matches /^C[A-Z0-9]{55}$/
generated bindings directory exists after generate
invoke returns success
```

## Retry policy

```txt
testnet transient failure: retry once
same failure after retry: fail job
parser or Kaleido error: no retry
unsupported CLI version: no retry
```

## Schedule

```yaml
on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:
  release:
    types: [published]
```

For v1 release gate:

```txt
Require 3 consecutive successful scheduled runs before tag v1.0.0.
No unretried failure in the last 7 days.
```

## Required workflow

```txt
.github/workflows/testnet-smoke.yml
```

## Artifacts uploaded by CI

```txt
kaleido.artifacts.json
smoke logs
stellar --version output
kaleido --version output
```

Do not upload secrets or Stellar config.

## Acceptance criteria

```txt
smoke job runs against Stellar testnet
deploy writes valid contractId
generate creates bindings
invoke succeeds
transient failures retry once
release process requires 3 consecutive green runs
```
