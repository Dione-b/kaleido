# @kaleido/client

## Install

```bash
pnpm add @kaleido/client @stellar/freighter-api
```

```ts
import { createKaleidoClient } from "@kaleido/client";
import { freighterWalletAdapter } from "@kaleido/client/freighter";
```

## What It Solves

`@kaleido/client` is the supported browser and Node integration layer for invoking generated Soroban bindings with Kaleido artifacts, network configuration, and a wallet adapter.

It connects:

- generated contract bindings
- `kaleido.artifacts.json`
- RPC URL and network passphrase
- wallet-backed signing for invocation and XDR preparation flows

## Supported Surface

Supported root exports:

- `createKaleidoClient`
- `resolveContractId`
- `createDefaultBindingAdapter`
- `KaleidoContractClient`
- `buildXdr`
- `KaleidoBindingAdapter`
- `KaleidoClientConfig`
- `KaleidoContractRegistration`
- `KaleidoInvokeOptions`
- `KaleidoInvokeResult`
- `KaleidoInvokeStatus`
- `KaleidoNetwork`
- `KaleidoWalletAdapter`
- `KaleidoXdrBuildResult`

Supported subpath export:

- `@kaleido/client/freighter` -> `freighterWalletAdapter`

Primary flow:

- `createKaleidoClient(...)`
- `client.contract(name).invoke(method, args?)`
- `client.contract(name).buildXdr(method, args?)`

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

## Wallet Adapter Contract

```ts
export interface KaleidoWalletAdapter {
  getPublicKey(): Promise<string>;

  signTransaction(input: {
    xdr: string;
    networkPassphrase: string;
  }): Promise<string>;
}
```

The default Freighter adapter is exported from `@kaleido/client/freighter`.

## Debug Output Rules

- XDR data is omitted by default
- `debugXdr: true` includes XDR snapshots such as unsigned, prepared, and signed values
- raw binding or submission output is omitted by default
- `debugRaw: true` includes raw binding or submission output

Consumers should treat debug fields as opt-in diagnostics, not part of the default happy-path payload.

## Errors

`@kaleido/client` emits documented `KALEIDO_*` codes for public failures. Consumers should key automation on the code, not the message text.

Common codes include:

- `KALEIDO_CONTRACT_ARTIFACT_NOT_FOUND`
- `KALEIDO_BINDING_CLIENT_NOT_FOUND`
- `KALEIDO_BINDING_METHOD_NOT_FOUND`
- `KALEIDO_WALLET_NOT_CONNECTED`
- `KALEIDO_XDR_BUILD_FAILED`
- `KALEIDO_XDR_PREPARE_FAILED`
- `KALEIDO_XDR_SIGN_FAILED`
- `KALEIDO_XDR_SUBMIT_FAILED`
- `KALEIDO_XDR_RESULT_FAILED`

## Limitations

- this package does not replace Stellar CLI, Stellar SDK, Soroban SDK, or generated bindings
- manual SCVal serialization and manual XDR parsing are out of scope
- React hooks, multisig orchestration, backend signing, and non-documented wallet integrations are not part of the supported contract
- private module paths and undocumented helpers are less stable than the exports listed above
