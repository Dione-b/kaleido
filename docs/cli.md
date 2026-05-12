# CLI

## `kaleido init <projectName>`

Creates a project from a bundled template and writes `kaleido.artifacts.json`.

## `kaleido build [contract]`

Builds the configured contract with `stellar contract build`.

## `kaleido deploy <contract> --source <identity> [--network testnet]`

Deploys a built WASM through Stellar CLI and records the contract ID under the selected network in `kaleido.artifacts.json`.

## `kaleido generate <contract> [--network testnet]`

Generates TypeScript bindings from the deployed contract ID.

## `kaleido invoke <contract.method> --source <identity> [args...]`

Invokes a deployed contract method. Extra args are forwarded to the Stellar implicit contract CLI.
