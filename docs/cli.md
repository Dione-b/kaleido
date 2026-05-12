# CLI

The CLI is intentionally thin. It delegates config, artifacts, command execution, and parser behavior to `@kaleido/core`.

## `kaleido init <projectName>`

Creates a project from a bundled template and writes `kaleido.artifacts.json`.

`init` validates `kaleido.template.json` before copying files and prints the selected template name and version.

## `kaleido build [contract]`

Builds the configured contract with `stellar contract build`.

## `kaleido deploy <contract> --source <identity> [--network testnet]`

Deploys a built WASM through Stellar CLI and records the contract ID under the selected network in `kaleido.artifacts.json`.

## `kaleido generate <contract> [--network testnet]`

Generates TypeScript bindings from the deployed contract ID.

## `kaleido invoke <contract.method> --source <identity> [args...]`

Invokes a deployed contract method. Extra args are forwarded to the Stellar implicit contract CLI.

Use `--allow-untested-stellar-cli` only for local experiments. CI and release workflows must run a supported Stellar CLI version. See [Stellar CLI Version Contract](./stellar-cli-version-contract.md).

## Current limits

- `--source` accepts a Stellar CLI identity alias or public account address, not a secret key.
- `kaleido dev` is present as a placeholder, not a full dev server.
- `kaleido doctor`, CLI XDR commands, `generate --interop`, and multi-contract dependency deploy are not part of the alpha CLI.

## Error codes

Kaleido emits public `KALEIDO_*` error codes for automation. Common examples:

- `KALEIDO_CONFIG_NOT_FOUND`
- `KALEIDO_INVALID_CONFIG`
- `KALEIDO_STELLAR_CLI_NOT_FOUND`
- `KALEIDO_CONTRACT_ID_NOT_FOUND`
- `KALEIDO_SOURCE_ACCOUNT_REQUIRED`
- `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND`
- `KALEIDO_TEMPLATE_INCOMPATIBLE`
- `KALEIDO_XDR_BUILD_FAILED`
- `KALEIDO_XDR_SIGN_FAILED`

See `docs/errors.md` for the full table.
