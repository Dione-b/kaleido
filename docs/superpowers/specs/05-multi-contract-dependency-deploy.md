# Spec 05 — Multi-Contract Dependency Deploy

## Status

Required before v1, at least experimental.

## Problem

Single-contract Kaleido is mostly a convenience wrapper over Stellar CLI plus config. Multi-contract deployment with dependency ordering and contractId injection is the first feature that materially differentiates Kaleido.

## Goal

Support deploying multiple contracts with dependencies.

Example:

```txt
token -> marketplace
```

Kaleido must deploy `token` first, capture its `contractId`, then inject that ID into the deploy/init args for `marketplace`.

## Config shape

```ts
export default defineConfig({
  project: "marketplace-app",

  defaultNetwork: "testnet",

  contracts: {
    token: {
      path: "./contracts/token",
      wasm: "./target/wasm32v1-none/release/token.wasm"
    },

    marketplace: {
      path: "./contracts/marketplace",
      wasm: "./target/wasm32v1-none/release/marketplace.wasm",
      dependsOn: ["token"],
      deployArgs: {
        tokenContractId: "${contracts.token.contractId}"
      }
    }
  }
});
```

## Rules

```txt
dependsOn must reference known contracts
dependency graph must be acyclic
dependencies deploy before dependents
contractId placeholders resolve from artifacts
no arbitrary shell interpolation
no env mutation for dependency injection
```

## Placeholder syntax

Only support:

```txt
${contracts.<contractName>.contractId}
```

Example:

```txt
${contracts.token.contractId}
```

Reject:

```txt
${env.SECRET}
$(shell command)
${process.env.X}
```

## Deploy behavior

Command:

```bash
kaleido deploy --network testnet
```

Behavior:

```txt
deploy all contracts in topological order
skip already deployed contracts unless --force
write dependency graph into artifacts
resolve deployArgs placeholders before dependent deploy
```

Contract-specific deploy remains valid:

```bash
kaleido deploy marketplace --network testnet
```

Behavior:

```txt
if dependency artifacts exist, use them
if dependency artifacts do not exist, deploy dependencies first unless --no-deps
```

## Artifacts schema addition

Version remains `1` if backward-compatible:

```json
{
  "project": "marketplace-app",
  "version": 1,
  "networks": {
    "testnet": {
      "contracts": {
        "token": {
          "contractId": "C...",
          "dependencies": []
        },
        "marketplace": {
          "contractId": "C...",
          "dependencies": ["token"],
          "resolvedDeployArgs": {
            "tokenContractId": "C..."
          }
        }
      },
      "dependencyGraph": {
        "token": [],
        "marketplace": ["token"]
      }
    }
  }
}
```

If this breaks existing readers, use artifact schema `version: 2`.

## New error codes

```txt
KALEIDO_CONTRACT_DEPENDENCY_NOT_FOUND
KALEIDO_CONTRACT_DEPENDENCY_CYCLE
KALEIDO_CONTRACT_DEPENDENCY_ARTIFACT_NOT_FOUND
KALEIDO_DEPLOY_ARG_PLACEHOLDER_INVALID
KALEIDO_DEPLOY_ARG_PLACEHOLDER_UNRESOLVED
```

## Core modules

```txt
packages/core/src/contracts/dependency-graph.ts
packages/core/src/contracts/resolve-deploy-order.ts
packages/core/src/contracts/resolve-deploy-args.ts
packages/core/src/contracts/deploy-contract-graph.ts
```

## Tests

Required:

```txt
single contract deploy still works
two-contract deploy order is correct
three-contract deploy order is correct
unknown dependency fails
cycle fails
placeholder resolves from artifacts
invalid placeholder fails
missing dependency artifact fails
--no-deps fails when dependency is missing
--force redeploys and updates artifacts
```

## Official template

Create one template:

```txt
packages/templates/marketplace-with-token
```

Template must demonstrate:

```txt
token contract
marketplace contract
dependsOn
contractId injection
README with deploy steps
```

## ADR

Update:

```txt
docs/adr/0005-multi-contract-dependency-deploy.md
```

Status:

```txt
Draft -> Accepted
```

ADR must document:

```txt
why dependsOn belongs in core
why placeholders are explicit
why env mutation is rejected
artifact schema impact
experimental stability if applicable
```

## Acceptance criteria

```txt
dependsOn works in kaleido.config.ts
deploy order uses topological sort
contractId placeholders are resolved safely
dependency graph is recorded in artifacts
cycle detection works
official multi-contract template exists
ADR 0005 is Accepted
```
