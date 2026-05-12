# Architecture

This document is the **canonical product and architecture stance** for Kaleido. It complements package-level code and the CLI reference in `docs/cli.md`. Detailed rationale for selected decisions lives in [Architecture Decision Records](./adr/) under `docs/adr/`.

## One-sentence promise

**Kaleido keeps a predictable, reproducible workflow to create, compile, deploy, generate bindings, and invoke Soroban contracts—even when the Stellar CLI changes operational details.**

That does not mean hiding Stellar reality. Users keep a **stable Kaleido surface** (`kaleido build`, `kaleido deploy`, `kaleido generate`, `kaleido invoke`). Changes in flags, stdout, paths, and subprocess composition are absorbed inside `@kaleido/core`, not scattered across user scripts.

## What Kaleido is (and is not)

| Kaleido is | Kaleido is not |
|------------|----------------|
| Convention + orchestration + artifacts + frontend integration | A second Soroban/Stellar SDK |
| A thin CLI over `@kaleido/core` | A place to store private keys or run silent signing |
| Template-driven project scaffolding | A hosted registry required for core workflows (future registries are optional) |

**Primary competitor today:** ad-hoc `package.json` scripts. **Possible later overlap:** meta-frameworks in other ecosystems (e.g. Scaffold-ETH-style), only if the workflow and template story mature.

**What Kaleido should do unusually well:** standardize Stellar/Soroban steps, persist **per-network** deployment facts, generate frontend integration from deployed contracts, avoid manual `contractId` wiring in the app, support **multi-contract** reproducible deploys, and lower friction for JS/TS teams.

## Validation roadmap (flows)

1. **MVP flow (proven):** `init → build → deploy → generate → invoke` (e.g. counter).
2. **Next architectural proof:** **multi-contract deploy with dependencies** (e.g. deploy token, then marketplace that depends on token’s `contractId`, then generate bindings for both, then invoke across that dependency).
3. **After that:** upgrade / redeploy with **artifacts history** and clear migration story.

Until (2) is real in the product, treat single-contract demos as necessary but not sufficient.

## Package boundaries (monorepo)

- **`@kaleido/cli`:** argument parsing, terminal UX, delegation to core—no subprocess orchestration except through core APIs.
- **`@kaleido/core`:** load `kaleido.config.ts`, validate schemas, resolve networks/contracts, read/write `kaleido.artifacts.json`, run Stellar CLI and related tools via a **single shell layer** (`run-command.ts`). **All `execa` usage stays here.**
- **`packages/templates`:** official templates consumed by `kaleido init` and validated through `kaleido.template.json` before copy.

Deferred unless explicitly rescoped: full `@kaleido/react` SDK surface, plugin system, RWA-only templates, visual dashboard, custom test runner as **required** core dependencies.

## Meta-framework boundary: orchestrate workflow, not mental model

**May abstract:** build/deploy/bindings flow, artifact lookup, network config from the project, template layout, command composition, and stable CLI commands.

**Should not hide** (users and docs should keep these visible): `contractId`, network passphrase, RPC choice, accounts, signing, XDR, fees, simulation, Soroban data model as understood via official SDKs and generated bindings.

**Red flags (avoid):** Kaleido-owned contract models, hand-rolled Soroban serialization, replacing generated bindings as the primary API, custom signing runtimes parallel to the Stellar ecosystem, or “smart” behavior that obscures what actually hit the network.

Rule of thumb: if Stellar CLI, `stellar-sdk`, Soroban SDK, or generated bindings already own it, Kaleido **composes, validates, or organizes**—it does not reimplement.

## Source of truth (MVP)

Local project state is authoritative:

- `contracts/`
- Generated bindings (path from `kaleido.config.ts`)
- `kaleido.config.ts`
- `kaleido.artifacts.json`

No central cache or remote artifact registry is assumed in the core MVP. Optional remote services may exist later but must not be **hard dependencies** of core.

## `kaleido dev`

**MVP direction:** opinionated proxy around **Vite + Kaleido validation** (not a plugin marketplace). Future adapters (`vite`, `next`, `astro`, custom) are conceivable only after the core workflow and multi-contract story prove value.

## Extensibility

- **Templates:** start as **opinionated snapshots** (`react-vite-counter`, etc.). Parameterized generators (`--tailwind`, wallet flavor, i18n) come later—they expand the test matrix quickly.
- **Template contract:** every template includes a **`kaleido.template.json` manifest** (name, version, `compatibleCore`, paths) so templates and core semver are validated at `init`—see [ADR 0003](./adr/0003-template-manifest-compatibility.md).
- **Plugins:** defer until a concrete need templates cannot cover (e.g. **post-deploy hooks**, CI presets, indexer hooks). First strong candidate is often `postDeploy`; still wait until multi-contract flow is validated.

## Ecosystem: official vs community templates

- **Official:** live in the Kaleido repo, reviewed, CI-tested, semver-matrices documented.
- **Community:** installable via Git URL or npm-style packages, **never implicitly trusted**—treat as untrusted code; warn users; avoid auto-running post-install scripts from external templates in MVP-class flows.

**Distribution:** MVP+1 favors **Git + URL** (e.g. `kaleido init my-app --template github:org/repo`). A dedicated template registry is explicitly later—moderation, security, and availability cost.

Suggested naming: `@kaleido/template-*` for official; `@scope/kaleido-template-*` for community.

## Networks vs environments

**Today:** artifacts keyed by **network** (same logical contract may differ per network—correct).

**Future (MVP+1):** **environment** (e.g. `staging` vs `production`) can share a network but differ in deployed `contractId`s. Expect either a new artifacts shape version or an explicit `environments` model—design TBD with migration (`kaleido migrate`) when introduced.

## Multi-contract

Deploy order **should** be supported in core for declared dependencies (DAG / topological sort), starting simple—see [ADR 0005](./adr/0005-multi-contract-dependency-deploy.md) when designing **how** dependent contracts receive upstream `contractId` (the sensitive part is injection, not sorting).

## CI and secrets

Kaleido does **not** manage long-lived private keys. CI provides identities (`--source ci-deployer`), secrets via the platform, and a configured Stellar CLI on the runner. Kaleido validates config, runs deploy/generate/invoke, updates artifacts, and fails with **clear, stable error codes** (see below).

## Frontend SDK (`@kaleido/react`)

Start as **thin hooks** over **generated bindings** and artifacts: wallet wiring, loading/error helpers, network context. Avoid a parallel generic Soroban client that bypasses generated types.

## DX beyond CLI

Prefer **`kaleido doctor`** (bins, config/artifact sanity, optional staleness hints) before investing in VS Code/LSP. LSP remains a future option for config/autocomplete diagnostics.

## Errors as public API

Stable **`KALEIDO_*` codes** are part of the contract for CI, support, and docs. New public errors must be added through the central `KaleidoErrorCode` object and documented in [`errors.md`](./errors.md)—see [ADR 0004](./adr/0004-error-codes-as-public-api.md).

## Testing strategy vs Stellar CLI drift

Layered approach:

1. Unit tests in `@kaleido/core`.
2. **Fixtures** of Stellar CLI stdout/stderr per supported CLI generation (parsing is the fragile boundary).
3. Contract tests with **pinned** Stellar CLI versions in CI.
4. Optional scheduled smoke against testnet.

## Versioning and migrations

Semver applies to monorepo packages **and** to serialized formats (`kaleido.artifacts.json` already has a `version` field). Breaking format or command behavior should eventually ship with **`kaleido migrate`**—not required on day one, but fields and ADRs should assume migrations will exist.

## Performance responsibilities

- **Rust / Stellar toolchain:** real compile and WASM output.
- **Kaleido:** detect stale WASM vs sources when feasible, avoid redundant `generate`, compare WASM hashes, emit clear “run build first” guidance. MVP: basic checks; later: stronger staleness and caching policies.

## Business stance for the core

**Core stays open-source and neutral** (CLI, core, baseline templates, artifacts, config workflow). Revenue-bearing or hosted offerings, if any, stay **outside** the neutrality of the core dependency graph.

---

## Architecture Decision Records

| ADR | Status | Topic |
|-----|--------|--------|
| [0001](./adr/0001-stable-workflow-over-stellar-cli.md) | Accepted | Stable Kaleido workflow while encapsulating Stellar CLI churn |
| [0002](./adr/0002-local-artifacts-as-source-of-truth.md) | Accepted | Local artifacts and config as source of truth; no central registry in MVP |
| [0003](./adr/0003-template-manifest-compatibility.md) | Accepted | Template manifest and core compatibility |
| [0004](./adr/0004-error-codes-as-public-api.md) | Accepted | Stable `KALEIDO_*` error codes and migration |
| [0005](./adr/0005-multi-contract-dependency-deploy.md) | Draft | Multi-contract `dependsOn` and contractId injection |

**0001–0004** are ratified. **0005** remains a draft until dependency deploy sequencing is implemented.

## Related docs

- [`getting-started.md`](./getting-started.md)
- [`cli.md`](./cli.md)
- [`config.md`](./config.md)
- [`templates.md`](./templates.md)
- [`errors.md`](./errors.md)
- [`testing.md`](./testing.md)
