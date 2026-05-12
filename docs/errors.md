# Error Codes

Kaleido error codes are public API. Automation may parse the `KALEIDO_*` code, but should not parse human-readable messages.

| Error code | Meaning | Common cause | Suggested fix | CI-safe |
| --- | --- | --- | --- | --- |
| `KALEIDO_CONFIG_NOT_FOUND` | Project config was not found. | Command ran outside a Kaleido project. | Run from the project root or create `kaleido.config.ts`. | Yes |
| `KALEIDO_INVALID_CONFIG` | Project config failed validation. | Missing required config fields or invalid values. | Fix `kaleido.config.ts` schema errors. | Yes |
| `KALEIDO_COMMAND_FAILED` | An underlying command failed. | Stellar CLI, Cargo, or another tool returned non-zero. | Re-run the printed command directly for full diagnostics. | Yes |
| `KALEIDO_UNEXPECTED_ERROR` | An unexpected non-Kaleido error was normalized. | A dependency or internal path threw an unknown error. | Re-run with the latest output and report the underlying message. | Yes |
| `KALEIDO_STELLAR_CLI_NOT_FOUND` | Kaleido could not find the `stellar` binary. | Stellar CLI is not installed or not in `PATH`. | Install Stellar CLI using the official Stellar setup guide. | Yes |
| `KALEIDO_STELLAR_CLI_VERSION_PARSE_FAILED` | Stellar CLI version output could not be parsed. | `stellar --version` omitted a valid semantic version. | Check the installed Stellar CLI and report the unexpected version output. | Yes |
| `KALEIDO_UNSUPPORTED_CLI_VERSION` | Stellar CLI version is below Kaleido's supported minimum. | Installed Stellar CLI is too old or is a prerelease below the supported range. | Install a supported Stellar CLI version. | Yes |
| `KALEIDO_UNTESTED_CLI_VERSION` | Stellar CLI version is newer than Kaleido's tested maximum. | Installed Stellar CLI may be compatible but has not been validated with this Kaleido release. | Install a tested Stellar CLI version or pass `--allow-untested-stellar-cli` locally. | Yes |
| `KALEIDO_RUST_NOT_FOUND` | Kaleido could not find Rust. | `rustc` is not installed or not in `PATH`. | Install or update Rust. | Yes |
| `KALEIDO_RUST_TARGET_NOT_FOUND` | Required Rust Wasm target is missing. | `wasm32v1-none` has not been installed. | Run `rustup target add wasm32v1-none`. | Yes |
| `KALEIDO_CONTRACT_NOT_FOUND` | Contract is not configured. | Unknown contract name. | Add the contract to `kaleido.config.ts` or pass a configured name. | Yes |
| `KALEIDO_NETWORK_NOT_FOUND` | Network is not configured. | Unknown `--network` value. | Add the network to config or use a configured network. | Yes |
| `KALEIDO_ARTIFACT_NOT_FOUND` | Required artifact is missing. | Missing artifacts file, deployed contract record, or Wasm output. | Run `kaleido init`, `kaleido build`, or `kaleido deploy` as appropriate. | Yes |
| `KALEIDO_ARTIFACT_INVALID` | Artifact file failed validation. | Malformed JSON or unsupported artifact version. | Fix or regenerate `kaleido.artifacts.json`. | Yes |
| `KALEIDO_CONTRACT_ID_NOT_FOUND` | Stellar CLI output did not include a contract ID. | CLI output format changed or deploy did not complete. | Check Stellar CLI output and update parser fixtures if needed. | Yes |
| `KALEIDO_CONTRACT_ARTIFACT_NOT_FOUND` | Client could not resolve a deployed contract artifact. | Contract was not deployed on the selected network, or no explicit `contractId` was passed. | Deploy the contract first or pass `contractId` in the client registration. | Yes |
| `KALEIDO_BINDING_CLIENT_NOT_FOUND` | Generated binding did not export `Client`. | Binding output is missing, stale, or incompatible. | Regenerate bindings with Stellar CLI. | Yes |
| `KALEIDO_BINDING_METHOD_NOT_FOUND` | Requested binding method was not found. | Contract method name is wrong or bindings are stale. | Check the method name or regenerate bindings. | Yes |
| `KALEIDO_XDR_BUILD_FAILED` | Client could not build or read transaction XDR. | Binding transaction object is incompatible or lacks `toXDR()`. | Regenerate bindings or provide a compatible binding adapter. | Yes |
| `KALEIDO_XDR_PREPARE_FAILED` | Client could not prepare or simulate transaction XDR. | RPC simulation failed or binding preparation failed. | Check RPC connectivity and binding compatibility. | Yes |
| `KALEIDO_XDR_SIGN_FAILED` | Wallet failed to sign the prepared XDR. | Wallet is disconnected, rejected, or on the wrong network. | Connect the wallet and approve the transaction. | No |
| `KALEIDO_XDR_SUBMIT_FAILED` | Client could not submit signed XDR. | RPC rejected the transaction or binding submit method failed. | Check signature, RPC URL, network passphrase, and account state. | No |
| `KALEIDO_XDR_RESULT_FAILED` | Client could not obtain or normalize the transaction result. | RPC result polling failed or response shape was incompatible. | Inspect raw debug output and update the adapter. | No |
| `KALEIDO_WALLET_NOT_CONNECTED` | Wallet public key could not be obtained. | Browser wallet is unavailable or disconnected. | Install/connect the wallet and retry. | No |
| `KALEIDO_SOURCE_ACCOUNT_REQUIRED` | Deploy/invoke needs a source account. | `--source` was omitted. | Pass a Stellar CLI identity alias or public account. | Yes |
| `KALEIDO_UNSAFE_SOURCE_ACCOUNT` | Source account looked like a secret. | Secret key or seed phrase passed as `--source`. | Use an identity alias or public account address. | Yes |
| `KALEIDO_INVOKE_TARGET_INVALID` | Invoke target did not use `contract.method`. | The invoke target had missing or extra segments. | Use a target such as `counter.increment`. | Yes |
| `KALEIDO_TEMPLATE_NOT_FOUND` | Requested template directory was not found. | Template name is wrong or templates directory is unavailable. | Use a bundled template or set `KALEIDO_TEMPLATES_DIR`. | Yes |
| `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND` | Template has no manifest. | Template predates manifest compatibility. | Add `kaleido.template.json`. | Yes |
| `KALEIDO_TEMPLATE_INCOMPATIBLE` | Template manifest is invalid or incompatible. | Core version range or manifest schema does not match. | Use a compatible template or update its manifest. | Yes |

Stellar installation guidance: https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup
