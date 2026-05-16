# CLI

The CLI is intentionally thin. It delegates config, artifacts, command execution, and parser behavior to `@caatinga/core`.

## `caatinga init <projectName>`

Creates a project from a bundled template and writes `caatinga.artifacts.json`.

`init` validates `caatinga.template.json` before copying files and prints the selected template name and version.

## `caatinga build [contract]`

Builds the configured contract with `stellar contract build`.

## `caatinga deploy [contract] --source <identity> [--network testnet] [--force] [--no-deps]`

Deploys one contract (or the full configured graph when `contract` is omitted) through Stellar CLI and records contract IDs per network in `caatinga.artifacts.json`. Dependencies deploy first when the selected contract lists `dependsOn`, unless `--no-deps` is passed (requires a single contract name). Use `--force` to redeploy when an artifact already stores a contract ID.

## `caatinga generate <contract> [--network testnet]`

Generates TypeScript bindings from the deployed contract ID.

## `caatinga invoke <contract.method> --source <identity> [args...]`

Invokes a deployed contract method. Extra args are forwarded to the Stellar implicit contract CLI.

Use `--allow-untested-stellar-cli` only for local experiments. CI and release workflows must run a supported Stellar CLI version. See [Stellar CLI Version Contract](./stellar-cli-version-contract.md).

## Current limits

- `--source` accepts a Stellar CLI identity alias or public account address, not a secret key.
- `caatinga dev` is reserved and hidden in pre-v1 builds. Use your frontend dev server (for example Vite) alongside `caatinga build`, `deploy`, `generate`, and `invoke`.
- `caatinga doctor`, CLI XDR commands, and `caatinga generate --interop` are not implemented yet.

## Error codes

Caatinga emits public `CAATINGA_*` error codes for automation. Common examples:

- `CAATINGA_CONFIG_NOT_FOUND`
- `CAATINGA_INVALID_CONFIG`
- `CAATINGA_STELLAR_CLI_NOT_FOUND`
- `CAATINGA_CONTRACT_ID_NOT_FOUND`
- `CAATINGA_SOURCE_ACCOUNT_REQUIRED`
- `CAATINGA_TEMPLATE_MANIFEST_NOT_FOUND`
- `CAATINGA_TEMPLATE_INCOMPATIBLE`
- `CAATINGA_XDR_BUILD_FAILED`
- `CAATINGA_XDR_SIGN_FAILED`

See `docs/errors.md` for the full table.
