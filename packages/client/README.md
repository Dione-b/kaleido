# @kaleido-xlm/client

## Install

```bash
pnpm add @kaleido-xlm/client
```

If you are using Freighter, add the optional adapter dependency:

```bash
pnpm add @stellar/freighter-api
```

```ts
import { createKaleidoClient } from "@kaleido-xlm/client";
import { freighterWalletAdapter } from "@kaleido-xlm/client/freighter";
```

The `@kaleido-xlm/client/freighter` subpath is optional and only needed when you want the bundled Freighter adapter.

## What It Solves

`@kaleido-xlm/client` is the supported browser and Node integration layer for invoking generated Soroban bindings with Kaleido artifacts, network configuration, and a wallet adapter.

It connects:

- generated contract bindings
- `kaleido.artifacts.json`
- RPC URL and network passphrase
- wallet-backed signing for invocation and XDR preparation flows

## Supported Surface

Supported runtime root exports:

- `createKaleidoClient`
- `resolveContractId`
- `createDefaultBindingAdapter`
- `KaleidoContractClient`
- `buildXdr`

Supported type-only root exports:

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

- `@kaleido-xlm/client/freighter` -> `freighterWalletAdapter` (optional)

Primary flow:

- `createKaleidoClient(...)`
- `client.contract(name).invoke(method, args?)`
- `client.contract(name).buildXdr(method, args?)`

## Counter Example

```ts
import { createKaleidoClient } from "@kaleido-xlm/client";
import { freighterWalletAdapter } from "@kaleido-xlm/client/freighter";
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

The default Freighter adapter is exported from `@kaleido-xlm/client/freighter`.

## Debug Output Rules

- XDR data is omitted by default
- `debugXdr: true` includes XDR snapshots such as unsigned, prepared, and signed values
- raw binding or submission output is omitted by default
- `debugRaw: true` includes raw binding or submission output

Consumers should treat debug fields as opt-in diagnostics, not part of the default happy-path payload.

## Errors

`@kaleido-xlm/client` emits documented `KALEIDO_*` codes for public failures. Consumers should key automation on the code, not the message text.

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
