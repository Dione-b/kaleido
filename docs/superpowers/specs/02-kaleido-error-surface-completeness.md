# Spec 02 — KALEIDO_* Error Surface Completeness

## Status

Implemented on `master` (error codes in `packages/core/src/errors/`, static tests, `docs/errors.md`, `docs/release/error-code-policy.md`). Implementation plan: `docs/superpowers/plans/2026-05-13-kaleido-error-surface-completeness.md`.

## Problem

Error codes are public API. If user-facing errors are undocumented or unstable, CI scripts built on Kaleido cannot safely handle failures.

## Goal

Every user-facing failure path in `@kaleido/cli`, `@kaleido/core`, and `@kaleido/client` must expose a documented `KALEIDO_*` code.

## Scope

Audit:

```txt
packages/cli/src
packages/core/src
packages/client/src
```

Cover:

```txt
throw
process.exit
catch blocks
command failures
schema validation
missing files
Stellar CLI failures
template failures
artifact failures
client/XDR failures
wallet failures
```

## Required changes

### Error code rule

Every public error must use:

```ts
new KaleidoError(message, KaleidoErrorCode.SOME_CODE, hint)
```

Never use raw strings:

```ts
new KaleidoError(message, "CONFIG_NOT_FOUND")
```

### Semver rule

Document:

```txt
Adding a new KALEIDO_* code: minor change
Removing a KALEIDO_* code: major change
Renaming a KALEIDO_* code: major change
Changing the meaning of a code: major change
Changing message text only: patch change
```

## Required files

```txt
packages/core/src/errors/KaleidoError.ts
packages/core/src/errors/KaleidoErrorCode.ts
docs/errors.md
docs/release/error-code-policy.md
```

## Minimum code list

```txt
KALEIDO_CONFIG_NOT_FOUND
KALEIDO_INVALID_CONFIG
KALEIDO_COMMAND_FAILED
KALEIDO_STELLAR_CLI_NOT_FOUND
KALEIDO_STELLAR_CLI_VERSION_PARSE_FAILED
KALEIDO_UNSUPPORTED_CLI_VERSION
KALEIDO_UNTESTED_CLI_VERSION
KALEIDO_RUST_NOT_FOUND
KALEIDO_RUST_TARGET_NOT_FOUND
KALEIDO_CONTRACT_NOT_FOUND
KALEIDO_NETWORK_NOT_FOUND
KALEIDO_ARTIFACT_NOT_FOUND
KALEIDO_CONTRACT_ID_NOT_FOUND
KALEIDO_SOURCE_ACCOUNT_REQUIRED
KALEIDO_UNSAFE_SOURCE_ACCOUNT
KALEIDO_DEPLOY_FAILED
KALEIDO_BUILD_FAILED
KALEIDO_BINDINGS_FAILED
KALEIDO_INVOKE_FAILED
KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND
KALEIDO_TEMPLATE_INVALID
KALEIDO_TEMPLATE_INCOMPATIBLE
KALEIDO_XDR_BUILD_FAILED
KALEIDO_XDR_PREPARE_FAILED
KALEIDO_XDR_SIGN_FAILED
KALEIDO_XDR_SUBMIT_FAILED
KALEIDO_XDR_RESULT_FAILED
KALEIDO_BINDING_CLIENT_NOT_FOUND
KALEIDO_BINDING_METHOD_NOT_FOUND
KALEIDO_WALLET_NOT_CONNECTED
```

## Tests

Required tests:

```txt
all exported error codes start with KALEIDO_
every documented code exists in KaleidoErrorCode
every exported code appears in docs/errors.md
each public code has at least one test that triggers it
no KaleidoError is constructed with raw string codes
```

Implement static check:

```txt
grep or AST test for new KaleidoError(..., "RAW_CODE")
```

## docs/errors.md format

Each code must include:

```txt
Code
Meaning
Likely cause
Suggested fix
CI handling recommendation
Semver stability
```

## Acceptance criteria

```txt
No raw legacy error codes remain
100% of public error codes documented
All documented codes exist in implementation
Every code has at least one test
Error code semver policy documented
```
