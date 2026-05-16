# Counter Example

This directory is a placeholder. The counter example is generated from the bundled `react-vite-counter` template via `kaleido init`.

## Generate

```bash
kaleido init counter --template react-vite-counter
cd counter
npm install
```

## Workflow

```bash
# 1. Build the Soroban counter contract
kaleido build counter

# 2. Deploy to testnet (requires a Stellar CLI identity)
kaleido deploy counter --network testnet --source <identity-or-G-address>

# 3. Generate TypeScript bindings from the deployed contract
kaleido generate counter --network testnet

# 4. Invoke the increment method
kaleido invoke counter.increment --network testnet --source <identity-or-G-address>
```

## Browser Client

After running `kaleido generate`, wire the generated bindings with `@kaleido-xlm/client`:

```ts
import { createKaleidoClient } from "@kaleido-xlm/client";
import { freighterWalletAdapter } from "@kaleido-xlm/client/freighter";
import * as Counter from "./contracts/generated/counter";
import artifacts from "../kaleido.artifacts.json";

const client = createKaleidoClient({
  network: {
    name: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  artifacts,
  wallet: freighterWalletAdapter,
  contracts: {
    counter: { binding: Counter },
  },
});

await client.contract("counter").invoke("increment");
```

## Requirements

- Node.js ≥ 20
- Rust with the `wasm32-unknown-unknown` target for the supported Stellar CLI 22.x flow
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) ≥ 22.0.0
- A Stellar CLI identity for deploy/invoke operations
