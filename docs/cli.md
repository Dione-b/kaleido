# CLI

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

## Error codes

Kaleido emits public `KALEIDO_*` error codes for automation. Common examples:

- `KALEIDO_CONFIG_NOT_FOUND`
- `KALEIDO_INVALID_CONFIG`
- `KALEIDO_STELLAR_CLI_NOT_FOUND`
- `KALEIDO_CONTRACT_ID_NOT_FOUND`
- `KALEIDO_SOURCE_ACCOUNT_REQUIRED`
- `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND`
- `KALEIDO_TEMPLATE_INCOMPATIBLE`

See `docs/errors.md` for the full table.
