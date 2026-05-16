# Kaleido Client Interop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@kaleido-xlm/client`, a thin interop layer that connects generated Soroban TypeScript bindings, Kaleido artifacts, and wallet signing.

**Architecture:** `@kaleido-xlm/client` owns orchestration only: artifact resolution, binding invocation, wallet signing, and normalized result shapes. It imports public types/errors from `@kaleido-xlm/core`, delegates transaction/XDR behavior to generated bindings, and exposes Freighter as a subpath adapter.

**Tech Stack:** TypeScript ESM, pnpm workspace, tsup, Vitest, `@stellar/freighter-api`, `@kaleido-xlm/core`.

---

### Task 1: Package Skeleton

**Files:**
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`
- Create: `packages/client/src/index.ts`
- Create: `packages/client/src/types.ts`

- [ ] **Step 1: Write failing package presence check**

Run: `pnpm --filter @kaleido-xlm/client typecheck`

Expected: FAIL because `@kaleido-xlm/client` does not exist.

- [ ] **Step 2: Create package manifest and base exports**

Add `@kaleido-xlm/client` with ESM build, test, typecheck scripts, root export, and `./freighter` subpath export.

- [ ] **Step 3: Verify package is discoverable**

Run: `pnpm --filter @kaleido-xlm/client typecheck`

Expected: PASS after base files exist.

### Task 2: Artifact Resolver

**Files:**
- Create: `packages/client/src/artifacts/resolve-contract-id.test.ts`
- Create: `packages/client/src/artifacts/resolve-contract-id.ts`
- Modify: `packages/client/src/index.ts`

- [ ] **Step 1: Write failing tests**

Test explicit `contractId`, artifact lookup by network/contract, and `KALEIDO_CONTRACT_ARTIFACT_NOT_FOUND` when missing.

- [ ] **Step 2: Run resolver tests**

Run: `pnpm --filter @kaleido-xlm/client test -- src/artifacts/resolve-contract-id.test.ts`

Expected: FAIL because implementation is missing.

- [ ] **Step 3: Implement resolver**

Use `explicitContractId` first, then `artifacts.networks[network].contracts[contract].contractId`, then throw `KaleidoError`.

- [ ] **Step 4: Verify resolver tests**

Run: `pnpm --filter @kaleido-xlm/client test -- src/artifacts/resolve-contract-id.test.ts`

Expected: PASS.

### Task 3: Binding Adapter

**Files:**
- Create: `packages/client/src/bindings/default-binding-adapter.test.ts`
- Create: `packages/client/src/bindings/default-binding-adapter.ts`
- Modify: `packages/client/src/index.ts`

- [ ] **Step 1: Write failing tests**

Test missing `Client`, missing method, client construction arguments, and method argument forwarding.

- [ ] **Step 2: Run binding adapter tests**

Run: `pnpm --filter @kaleido-xlm/client test -- src/bindings/default-binding-adapter.test.ts`

Expected: FAIL because implementation is missing.

- [ ] **Step 3: Implement adapter**

Instantiate `new binding.Client(...)`; call the requested method with either no args or one args object; throw `KALEIDO_BINDING_*` errors.

- [ ] **Step 4: Verify adapter tests**

Run: `pnpm --filter @kaleido-xlm/client test -- src/bindings/default-binding-adapter.test.ts`

Expected: PASS.

### Task 4: XDR Orchestration and Client API

**Files:**
- Create: `packages/client/src/client/create-kaleido-client.test.ts`
- Create: `packages/client/src/client/create-kaleido-client.ts`
- Create: `packages/client/src/client/kaleido-contract-client.ts`
- Create: `packages/client/src/xdr/build-xdr.ts`
- Modify: `packages/client/src/index.ts`

- [ ] **Step 1: Write failing tests**

Test `invoke("increment")`, `buildXdr("increment")`, `debugXdr` disabled/enabled, and wallet sign failure mapped to `KALEIDO_XDR_SIGN_FAILED`.

- [ ] **Step 2: Run client tests**

Run: `pnpm --filter @kaleido-xlm/client test -- src/client/create-kaleido-client.test.ts`

Expected: FAIL because API is missing.

- [ ] **Step 3: Implement minimal orchestration**

Resolve contract, get public key, create binding client, call method, extract unsigned/prepared XDR from returned transaction object, call wallet signer for `invoke`, and submit through `signAndSend` or `send`.

- [ ] **Step 4: Verify client tests**

Run: `pnpm --filter @kaleido-xlm/client test -- src/client/create-kaleido-client.test.ts`

Expected: PASS.

### Task 5: Freighter Adapter and Public Errors

**Files:**
- Create: `packages/client/src/adapters/freighter.ts`
- Create: `packages/client/src/freighter.ts`
- Modify: `packages/core/src/errors/KaleidoError.ts`
- Modify: `docs/errors.md`

- [ ] **Step 1: Write failing public API checks**

Run client build and existing core error documentation test.

- [ ] **Step 2: Implement Freighter adapter**

Import `getAddress` and `signTransaction` from `@stellar/freighter-api`; expose `freighterWalletAdapter`.

- [ ] **Step 3: Add public error codes**

Add the specified `KALEIDO_XDR_*`, `KALEIDO_BINDING_*`, `KALEIDO_WALLET_NOT_CONNECTED`, and `KALEIDO_CONTRACT_ARTIFACT_NOT_FOUND` codes, and document them.

- [ ] **Step 4: Verify public API**

Run: `pnpm --filter @kaleido-xlm/client build` and `pnpm --filter @kaleido-xlm/core test -- src/errors/error-codes.test.ts`.

Expected: PASS.

### Task 6: Documentation and Full Verification

**Files:**
- Create: `docs/client.md`
- Modify: `README.md`

- [ ] **Step 1: Document counter usage**

Add a concise example showing `createKaleidoClient`, Freighter adapter, generated Counter binding, artifacts, `invoke`, and `buildXdr`.

- [ ] **Step 2: Run full checks**

Run: `pnpm typecheck`, `pnpm test`, `pnpm build`.

Expected: PASS.

### Self-Review

- Spec coverage: package, types, wallet adapter, Freighter adapter, artifact resolver, binding adapter, `invoke`, `buildXdr`, debug XDR/raw gating, errors, and docs are covered.
- Explicitly out of scope: React hooks, own XDR parser, manual SCVal serialization, secret key storage, CLI XDR, and `generate --interop`.
- Main risk: generated binding transaction object shape may vary across Stellar CLI versions. MVP constrains this to adapter/extractor behavior and tests with fixture-like mocks.
