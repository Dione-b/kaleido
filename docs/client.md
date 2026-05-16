# Client (`@caatinga/client`)

`@caatinga/client` is the alpha browser/client-side interop layer for generated Stellar CLI TypeScript bindings. It connects:

- generated contract bindings
- `caatinga.artifacts.json`
- RPC URL and network passphrase
- a wallet adapter

It does not replace Stellar CLI, Stellar SDK, Soroban SDK, generated bindings, or wallet signing. It does not serialize SCVal manually, parse XDR manually, or store secret keys.

## Scope

Included in alpha:

- artifact-based `contractId` lookup
- generated binding registration
- `CaatingaWalletAdapter`
- Freighter adapter
- `invoke()`
- `buildXdr()`
- explicit `debugXdr` and `debugRaw`
- `CAATINGA_XDR_*`, binding, wallet, and artifact errors

Not included:

- React hooks
- CLI XDR commands
- `caatinga generate --interop`
- custom SCVal serialization
- multisig orchestration
- backend signing

## Install

```bash
pnpm add @caatinga/client @stellar/freighter-api
```

## Counter Example

```ts
import { createCaatingaClient } from "@caatinga/client";
import { freighterWalletAdapter } from "@caatinga/client/freighter";
import * as Counter from "./contracts/generated/counter";
import artifacts from "../caatinga.artifacts.json";

const client = createCaatingaClient({
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

Minimal successful result:

```json
{
  "status": "confirmed",
  "contract": "counter",
  "method": "increment",
  "contractId": "C...",
  "transactionHash": "..."
}
```

If a contract ID is not passed explicitly, the client resolves it from:

```txt
artifacts.networks[network].contracts[contract].contractId
```

To override artifacts:

```ts
const client = createCaatingaClient({
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

XDR is omitted by default and only returned when `debugXdr` is enabled.

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

`buildXdr()` creates the generated binding client, so it may call `wallet.getPublicKey()`. It does not call `wallet.signTransaction()`.

## Wallet Adapter

```ts
export interface CaatingaWalletAdapter {
  getPublicKey(): Promise<string>;

  signTransaction(input: {
    xdr: string;
    networkPassphrase: string;
  }): Promise<string>;
}
```

The Freighter adapter is exported from:

```ts
import { freighterWalletAdapter } from "@caatinga/client/freighter";
```

## Binding Contract

The default binding adapter expects generated bindings to:

1. export `Client`
2. accept `contractId`, `publicKey`, `rpcUrl`, and `networkPassphrase`
3. expose contract methods on the client instance
4. return a transaction-like object with `toXDR()`
5. expose `signAndSend()` or `send()` for signed submission

If Stellar CLI changes this generated shape, the compatibility fix belongs in the binding adapter, not in application code.

## Failure behavior

Client failures use public `CAATINGA_*` codes. The most common are:

- `CAATINGA_CONTRACT_ARTIFACT_NOT_FOUND`
- `CAATINGA_BINDING_CLIENT_NOT_FOUND`
- `CAATINGA_BINDING_METHOD_NOT_FOUND`
- `CAATINGA_WALLET_NOT_CONNECTED`
- `CAATINGA_XDR_BUILD_FAILED`
- `CAATINGA_XDR_PREPARE_FAILED`
- `CAATINGA_XDR_SIGN_FAILED`
- `CAATINGA_XDR_SUBMIT_FAILED`
- `CAATINGA_XDR_RESULT_FAILED`

See [`errors.md`](./errors.md) for the full table.
