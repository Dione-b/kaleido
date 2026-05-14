# @kaleido/cli

## Install

```bash
npm install -g @kaleido/cli
kaleido --help
```

## Requirements

- Node.js `>=20`
- Stellar CLI `>=22.0.0` and `<=22.0.1` available on `PATH`
- A Kaleido project with `kaleido.config.ts` for project commands such as `build`, `deploy`, `generate`, and `invoke`

If your local machine is on a newer Stellar CLI, `--allow-untested-stellar-cli` is the local-only escape hatch. CI and release workflows should stay on the supported range.

## Commands

- `kaleido init <projectName>` creates a project from a bundled template and writes `kaleido.artifacts.json`
- `kaleido build [contract]` builds one configured contract through Stellar CLI and defaults to `counter` when omitted
- `kaleido deploy [contract] --source <identity> [--network <network>] [--force] [--no-deps]` deploys contracts and records contract IDs in `kaleido.artifacts.json`
- `kaleido generate <contract> [--network <network>]` generates TypeScript bindings from a deployed contract ID
- `kaleido invoke <contract.method> --source <identity> [args...]` invokes a deployed contract method through the configured workflow

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

`@kaleido/cli` emits documented `KALEIDO_*` error codes for automation. Consumers should match on the error code, not human-readable text.

Common codes include:

- `KALEIDO_CONFIG_NOT_FOUND`
- `KALEIDO_INVALID_CONFIG`
- `KALEIDO_STELLAR_CLI_NOT_FOUND`
- `KALEIDO_CONTRACT_ID_NOT_FOUND`
- `KALEIDO_SOURCE_ACCOUNT_REQUIRED`
- `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND`
- `KALEIDO_TEMPLATE_INCOMPATIBLE`
- `KALEIDO_XDR_BUILD_FAILED`
- `KALEIDO_XDR_SIGN_FAILED`

## Relationship To `@kaleido/core`

`@kaleido/cli` is the supported end-user entrypoint for Kaleido's command workflow. It intentionally stays thin and delegates config loading, artifacts, command orchestration, and shared error primitives to `@kaleido/core`.

If you want the stable packaged workflow, prefer the CLI contract over importing `@kaleido/core` directly.

## Versioning And Stability

This package is the primary supported consumer surface for the Kaleido workflow. Stability applies to the documented commands, inputs, and `KALEIDO_*` error contract.

Undocumented internals, private module paths, and placeholder commands such as `kaleido dev` are not part of the stability promise.
