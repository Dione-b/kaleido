# __PROJECT_NAME__

Kaleido counter dApp for Stellar/Soroban.

## CLI Flow

```bash
npm install
npx kaleido build counter
npx kaleido deploy counter --network testnet --source alice
npx kaleido generate counter --network testnet
npx kaleido invoke counter.increment --network testnet --source alice
npm run dev
```

Use a Stellar CLI identity alias or public account address for `--source`; do not pass seed phrases or secret keys.

## Client Smoke Path

After `kaleido generate`, wire generated bindings to the client:

```ts
import { createKaleidoClient } from "@kaleido/client";
import { freighterWalletAdapter } from "@kaleido/client/freighter";
import * as Counter from "./contracts/generated/counter";
import artifacts from "../kaleido.artifacts.json";

export const kaleidoClient = createKaleidoClient({
  network: {
    name: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015"
  },
  artifacts,
  wallet: freighterWalletAdapter,
  contracts: {
    counter: {
      binding: Counter
    }
  }
});
```

Build XDR without wallet signing:

```ts
const tx = await kaleidoClient.contract("counter").buildXdr("increment");
console.log(tx.preparedXdr);
```

Invoke through Freighter:

```ts
const result = await kaleidoClient.contract("counter").invoke("increment", {
  debugXdr: true
});
console.log(result.transactionHash);
```
