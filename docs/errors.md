# Error Codes

Kaleido error codes are public API. Automation may parse the `KALEIDO_*` code, but should not parse human-readable messages.

| Error code | Meaning | Common cause | Suggested fix | CI-safe |
| --- | --- | --- | --- | --- |
| `KALEIDO_CONFIG_NOT_FOUND` | Project config was not found. | Command ran outside a Kaleido project. | Run from the project root or create `kaleido.config.ts`. | Yes |
| `KALEIDO_INVALID_CONFIG` | Project config failed validation. | Missing required config fields or invalid values. | Fix `kaleido.config.ts` schema errors. | Yes |
| `KALEIDO_COMMAND_FAILED` | An underlying command failed. | Stellar CLI, Cargo, or another tool returned non-zero. | Re-run the printed command directly for full diagnostics. | Yes |
| `KALEIDO_STELLAR_CLI_NOT_FOUND` | Kaleido could not find the `stellar` binary. | Stellar CLI is not installed or not in `PATH`. | Install Stellar CLI using the official Stellar setup guide. | Yes |
| `KALEIDO_RUST_NOT_FOUND` | Kaleido could not find Rust. | `rustc` is not installed or not in `PATH`. | Install or update Rust. | Yes |
| `KALEIDO_RUST_TARGET_NOT_FOUND` | Required Rust Wasm target is missing. | `wasm32v1-none` has not been installed. | Run `rustup target add wasm32v1-none`. | Yes |
| `KALEIDO_CONTRACT_NOT_FOUND` | Contract is not configured. | Unknown contract name. | Add the contract to `kaleido.config.ts` or pass a configured name. | Yes |
| `KALEIDO_NETWORK_NOT_FOUND` | Network is not configured. | Unknown `--network` value. | Add the network to config or use a configured network. | Yes |
| `KALEIDO_ARTIFACT_NOT_FOUND` | Required artifact is missing. | Missing artifacts file, deployed contract record, or Wasm output. | Run `kaleido init`, `kaleido build`, or `kaleido deploy` as appropriate. | Yes |
| `KALEIDO_ARTIFACT_INVALID` | Artifact file failed validation. | Malformed JSON or unsupported artifact version. | Fix or regenerate `kaleido.artifacts.json`. | Yes |
| `KALEIDO_CONTRACT_ID_NOT_FOUND` | Stellar CLI output did not include a contract ID. | CLI output format changed or deploy did not complete. | Check Stellar CLI output and update parser fixtures if needed. | Yes |
| `KALEIDO_SOURCE_ACCOUNT_REQUIRED` | Deploy/invoke needs a source account. | `--source` was omitted. | Pass a Stellar CLI identity alias or public account. | Yes |
| `KALEIDO_UNSAFE_SOURCE_ACCOUNT` | Source account looked like a secret. | Secret key or seed phrase passed as `--source`. | Use an identity alias or public account address. | Yes |
| `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND` | Template has no manifest. | Template predates manifest compatibility. | Add `kaleido.template.json`. | Yes |
| `KALEIDO_TEMPLATE_INCOMPATIBLE` | Template manifest is invalid or incompatible. | Core version range or manifest schema does not match. | Use a compatible template or update its manifest. | Yes |

Stellar installation guidance: https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup
