# @caatinga/cli

## Install

```bash
npm install -g @caatinga/cli
caatinga --help
```

## Requirements

- Node.js `>=20`
- Stellar CLI `>=22.0.0` and `<=25.2.0` available on `PATH`
- A Caatinga project with `caatinga.config.ts` for project commands such as `build`, `deploy`, `generate`, and `invoke`

If your local machine is on a newer Stellar CLI, `--allow-untested-stellar-cli` is the local-only escape hatch. CI and release workflows should stay on the supported range.

## Commands

- `caatinga init <projectName>` creates a project from a bundled template and writes `caatinga.artifacts.json`
- `caatinga build [contract]` builds one configured contract through Stellar CLI and defaults to `counter` when omitted
- `caatinga deploy [contract] --source <identity> [--network <network>] [--force] [--no-deps]` deploys contracts and records contract IDs in `caatinga.artifacts.json`
- `caatinga generate <contract> [--network <network>]` generates TypeScript bindings from a deployed contract ID
- `caatinga invoke <contract.method> --source <identity> [args...]` invokes a deployed contract method through the configured workflow

The supported CLI flow is `init -> build -> deploy -> generate -> invoke`.

## Supported Inputs

- `--source` accepts a Stellar CLI identity alias or public `G...` account address
- `--network <network>` selects a configured network such as `testnet`
- `invoke` expects a `<contract.method>` target and forwards extra args to the underlying Stellar contract invocation
- `deploy --no-deps` is supported only when deploying a single named contract

Unsupported input posture:

- secret keys and seed phrases are not supported CLI inputs
- undocumented private flags or internal repo file paths are not part of the package contract

## Error Behavior

`@caatinga/cli` emits documented `CAATINGA_*` error codes for automation. Consumers should match on the error code, not human-readable text.

Common codes include:

- `CAATINGA_CONFIG_NOT_FOUND`
- `CAATINGA_INVALID_CONFIG`
- `CAATINGA_STELLAR_CLI_NOT_FOUND`
- `CAATINGA_BUILD_FAILED`
- `CAATINGA_DEPLOY_FAILED`
- `CAATINGA_BINDINGS_FAILED`
- `CAATINGA_INVOKE_FAILED`
- `CAATINGA_CONTRACT_ID_NOT_FOUND`
- `CAATINGA_SOURCE_ACCOUNT_REQUIRED`
- `CAATINGA_TEMPLATE_MANIFEST_NOT_FOUND`
- `CAATINGA_TEMPLATE_INCOMPATIBLE`

## Relationship To `@caatinga/core`

`@caatinga/cli` is the supported end-user entrypoint for Caatinga's command workflow. It intentionally stays thin and delegates config loading, artifacts, command orchestration, and shared error primitives to `@caatinga/core`.

If you want the stable packaged workflow, prefer the CLI contract over importing `@caatinga/core` directly.

## Versioning And Stability

This package is the primary supported consumer surface for the Caatinga workflow. Stability applies to the documented commands, inputs, and `CAATINGA_*` error contract.

Undocumented internals, private module paths, and reserved hidden commands such as `caatinga dev` are not part of the stability promise.
