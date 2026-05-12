# Client

`@kaleido/client` is a thin browser/client-side interop layer for generated Stellar CLI TypeScript bindings. It connects:

- generated contract bindings
- `kaleido.artifacts.json`
- RPC URL and network passphrase
- a wallet adapter

It does not replace the Stellar SDK, reimplement generated bindings, serialize SCVal manually, parse XDR manually, or store secret keys.

## Install

```bash
pnpm add @kaleido/client @stellar/freighter-api
```

## Counter Example

```ts
import { createKaleidoClient } from "@kaleido/client";
import { freighterWalletAdapter } from "@kaleido/client/freighter";
import * as Counter from "./contracts/generated/counter";
import artifacts from "../kaleido.artifacts.json";

const client = createKaleidoClient({
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

const result = await client.contract("counter").invoke("increment");
```

If a contract ID is not passed explicitly, the client resolves it from:

```txt
artifacts.networks[network].contracts[contract].contractId
```

To override artifacts:

```ts
const client = createKaleidoClient({
  network,
  artifacts,
  wallet: freighterWalletAdapter,
  contracts: {
    counter: {
      binding: Counter,
      contractId: "C..."
    }
  }
});
```

## Arguments

Arguments are forwarded as one object to the generated binding method:

```ts
await client.contract("token").invoke("transfer", {
  to: receiverAddress,
  amount: 100n
});
```

## XDR Debug

XDR is omitted by default.

```ts
const result = await client.contract("counter").invoke("increment", {
  debugXdr: true
});

console.log(result.xdr?.unsigned);
console.log(result.xdr?.prepared);
console.log(result.xdr?.signed);
```

Raw binding or submit output is omitted unless `debugRaw` is enabled:

```ts
const result = await client.contract("counter").invoke("increment", {
  debugXdr: true,
  debugRaw: true
});

console.log(result.raw);
```

## Build XDR Only

```ts
const tx = await client.contract("counter").buildXdr("increment");

console.log(tx.unsignedXdr);
console.log(tx.preparedXdr);
```

`buildXdr()` does not call `wallet.signTransaction()`.

## Wallet Adapter

```ts
export interface KaleidoWalletAdapter {
  getPublicKey(): Promise<string>;

  signTransaction(input: {
    xdr: string;
    networkPassphrase: string;
  }): Promise<string>;
}
```

The Freighter adapter is exported from:

```ts
import { freighterWalletAdapter } from "@kaleido/client/freighter";
```

## Binding Contract

The default binding adapter expects generated bindings to:

1. export `Client`
2. accept `contractId`, `publicKey`, `rpcUrl`, and `networkPassphrase`
3. expose contract methods on the client instance
4. return a transaction-like object with `toXDR()`
5. expose `signAndSend()` or `send()` for signed submission

If Stellar CLI changes this generated shape, the compatibility fix belongs in the binding adapter, not in application code.
