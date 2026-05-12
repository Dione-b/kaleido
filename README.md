# Kaleido

Kaleido is a developer toolkit and CLI for building dApps on Stellar/Soroban.

The MVP focuses on a narrow local workflow:

```bash
kaleido init my-dapp
cd my-dapp
kaleido build counter
kaleido deploy counter --network testnet --source alice
kaleido generate counter --network testnet
kaleido invoke counter.increment --network testnet --source alice
```

Kaleido orchestrates Stellar CLI and Rust tooling. It does not store private keys, seed phrases, or telemetry.
