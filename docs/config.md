# Config

Kaleido projects use `kaleido.config.ts`.

```ts
import { defineConfig } from "@kaleido/core";

export default defineConfig({
  project: "my-dapp",
  defaultNetwork: "testnet",
  contracts: {
    counter: {
      path: "./contracts/counter",
      wasm: "./contracts/counter/target/wasm32-unknown-unknown/release/counter.wasm"
    }
  },
  networks: {
    testnet: {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015"
    }
  },
  frontend: {
    framework: "vite-react",
    bindingsOutput: "./src/contracts/generated"
  }
});
```

Artifacts are network-scoped so `counter` can have different contract IDs on testnet and mainnet.
