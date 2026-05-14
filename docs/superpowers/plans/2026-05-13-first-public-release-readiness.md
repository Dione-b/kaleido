# Kaleido First Public Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define and complete the remaining work to publish Kaleido safely under `next`/`0.x`, then promote to `v1.0.0`/`latest` only after the public release contract and operational evidence are complete.

**Architecture:** Split release work into two tracks with different risk boundaries. Track A closes public-consumer documentation, package contract clarity, and publish workflow alignment for pre-v1 distribution. Track B adds the stronger release-management contract and live operational evidence required before `latest`.

**Tech Stack:** Markdown docs, Changesets, pnpm workspace scripts, GitHub Actions workflows, npm dist-tags, Kaleido CLI/core/client packages.

---

## Scope Boundaries

This plan covers release readiness artifacts and release-process alignment only. It does not introduce new product features, change Soroban workflow behavior, or redesign package internals unless a documentation contract cannot be made true without code changes.

Out of scope for this plan:

- new CLI features such as `doctor`, CLI XDR commands, or `generate --interop`
- React hooks or new frontend packages
- template registry or plugin system
- changes to stable public behavior that would require a new design spec first

## File Structure

- Create `docs/release/v1.0.0.md`: canonical public release spec for the first stable release.
- Modify `docs/release/v1-readiness.md`: reduce ambiguity by separating `next` gates from `latest` gates and linking the canonical v1 release doc.
- Modify `README.md`: link the public release contract and clarify current publish status.
- Modify `packages/cli/README.md`: turn the placeholder into a real consumer README for the published CLI package.
- Modify `packages/client/README.md`: turn the placeholder into a real consumer README for the published client package.
- Modify `packages/core/README.md`: either document direct-consumer expectations or explicitly mark it as an internal/advanced package with supported use cases.
- Modify `.github/workflows/release.yml`: align the workflow with the documented dist-tag policy instead of hard-coding `next`.
- Create `docs/release/publish-checklist.md`: operator-facing checklist for `next` versus `latest`.
- Optionally create `.changeset/*.md`: capture version intent once package-facing docs/workflow changes are finalized.

---

### Task 1: Write The Canonical Public v1 Release Spec

**Files:**
- Create: `docs/release/v1.0.0.md`
- Verify: `docs/release/v1-readiness.md`
- Verify: `docs/superpowers/specs/00-v1-viability-index.md`

- [ ] **Step 1: Draft the release-spec skeleton from the existing requirements**

Create `docs/release/v1.0.0.md` with these top-level sections:

```md
# v1.0.0 Release Spec

## Motivation
## Non-goals
## Prior Art
## Interface Contract
## Compatibility Contract
## Observability Plan
## Rollout
## Rollback
## Release Owner
## Evidence Required
```

- [ ] **Step 2: Fill the interface contract with the actual public surface**

Populate `## Interface Contract` with the published packages and supported surfaces:

```md
### Published Packages

- `@kaleido/cli`
- `@kaleido/core`
- `@kaleido/client`

### Supported CLI Flow

`init -> build -> deploy -> generate -> invoke`

### Supported Client Surface

- `createKaleidoClient`
- `client.contract(name).invoke(method)`
- `client.contract(name).buildXdr(method)`
- `freighterWalletAdapter`

### Public Error Contract

Automation may parse `KALEIDO_*` codes and must not parse human-readable messages.
```

- [ ] **Step 3: Make `next` versus `latest` explicit in the release spec**

Add this decision block under `## Rollout`:

```md
### Dist-tag policy

- `next`: allowed once publish workflow, package READMEs, and consumer-isolation docs are complete.
- `latest`: blocked until all v1 readiness requirements and scheduled smoke evidence are complete.
```

- [ ] **Step 4: Verify the new spec covers the missing non-negotiable fields**

Run:

```bash
sed -n '1,260p' docs/release/v1.0.0.md
```

Expected: the document contains concrete content for motivation, non-goals, interface contract, observability, rollout, rollback, owner, and evidence. No `TODO`, `TBD`, or empty sections.

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/release/v1.0.0.md
git commit -m "docs: add canonical v1 release spec"
```

Expected: commit succeeds with only the new spec file staged.

---

### Task 2: Split `next` Gates From `latest` Gates

**Files:**
- Modify: `docs/release/v1-readiness.md`
- Modify: `README.md`

- [ ] **Step 1: Rewrite `v1-readiness.md` into two explicit release tracks**

Replace the body structure with:

```md
# v1 Readiness

## Track A — Pre-v1 Public Publish (`0.x` / `next`)

- package metadata valid
- package READMEs complete
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm test:consumer`
- release workflow aligned with chosen dist-tag

## Track B — Stable Release (`v1.0.0` / `latest`)

- all five v1 specs implemented and accepted
- three consecutive successful scheduled smoke runs
- no unretried smoke failure in the last 7 days
- release evidence captured in `docs/release/v1.0.0.md`
```

- [ ] **Step 2: Add a README link to the stable release contract**

Add one line near the current status block in `README.md`:

```md
See [v1 release spec](./docs/release/v1.0.0.md) for the public contract required before `latest`.
```

- [ ] **Step 3: Inspect the docs side by side**

Run:

```bash
sed -n '1,220p' docs/release/v1-readiness.md
sed -n '1,80p' README.md
```

Expected: `README.md` points readers to both readiness and release contract, and `v1-readiness.md` no longer mixes `next` and `latest` requirements in one ambiguous list.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/release/v1-readiness.md README.md
git commit -m "docs: separate next and latest release gates"
```

Expected: commit succeeds with only the readiness and README changes staged.

---

### Task 3: Replace Placeholder Package READMEs With Consumer Contracts

**Files:**
- Modify: `packages/cli/README.md`
- Modify: `packages/client/README.md`
- Modify: `packages/core/README.md`

- [ ] **Step 1: Expand the CLI package README**

Replace `packages/cli/README.md` with sections matching this structure:

```md
# @kaleido/cli

## Install
## Requirements
## Commands
## Supported Inputs
## Error Behavior
## Relationship To `@kaleido/core`
## Versioning And Stability
```

Include this install and smoke block:

```bash
npm install -g @kaleido/cli
kaleido --help
```

- [ ] **Step 2: Expand the client package README**

Replace `packages/client/README.md` with sections matching this structure:

```md
# @kaleido/client

## Install
## What It Solves
## Supported Surface
## Counter Example
## Wallet Adapter Contract
## Debug Output Rules
## Errors
## Limitations
```

Include this import example:

```ts
import { createKaleidoClient } from "@kaleido/client";
import { freighterWalletAdapter } from "@kaleido/client/freighter";
```

- [ ] **Step 3: Clarify whether `@kaleido/core` is a direct-consumer package**

Update `packages/core/README.md` to explicitly choose one of these positions:

```md
## Supported Use

`@kaleido/core` is supported for advanced programmatic integration.
```

or

```md
## Supported Use

`@kaleido/core` is primarily an internal package for the Kaleido CLI and templates; direct use is advanced and less stable than the CLI contract.
```

Do not leave this ambiguous.

- [ ] **Step 4: Inspect all three package READMEs**

Run:

```bash
sed -n '1,220p' packages/cli/README.md
sed -n '1,260p' packages/client/README.md
sed -n '1,220p' packages/core/README.md
```

Expected: each package README now stands on its own for an npm consumer without requiring the repository README for basic understanding.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/cli/README.md packages/client/README.md packages/core/README.md
git commit -m "docs: define package-level consumer contracts"
```

Expected: commit succeeds with only the package README changes staged.

---

### Task 4: Align The Release Workflow With The Documented Dist-tag Policy

**Files:**
- Modify: `.github/workflows/release.yml`
- Verify: `docs/superpowers/specs/03-npm-publish-consumer-isolation.md`

- [ ] **Step 1: Replace the hard-coded publish tag with the workflow input**

Change the publish step in `.github/workflows/release.yml` from:

```yaml
run: pnpm publish -r --access public --provenance --tag next
```

to:

```yaml
run: pnpm publish -r --access public --provenance --tag ${{ github.event.inputs.tag || 'next' }}
```

- [ ] **Step 2: Guard `latest` with an explicit operator note**

Add this comment above the publish step:

```yaml
# `latest` is allowed only after the requirements in docs/release/v1-readiness.md
# and docs/release/v1.0.0.md are satisfied and verified by the release owner.
```

- [ ] **Step 3: Inspect the workflow after the edit**

Run:

```bash
sed -n '1,220p' .github/workflows/release.yml
```

Expected: the workflow still runs install, typecheck, build, test, pack, and consumer-isolation steps before publish, and the published dist-tag is no longer hard-coded to `next`.

- [ ] **Step 4: Commit**

Run:

```bash
git add .github/workflows/release.yml
git commit -m "ci: align release workflow with dist-tag policy"
```

Expected: commit succeeds with only the workflow change staged.

---

### Task 5: Add An Operator-Facing Publish Checklist

**Files:**
- Create: `docs/release/publish-checklist.md`
- Verify: `package.json`

- [ ] **Step 1: Create the checklist document**

Create `docs/release/publish-checklist.md` with this structure:

```md
# Publish Checklist

## Before `next`
- verify package READMEs
- run `pnpm typecheck`
- run `pnpm build`
- run `pnpm test`
- run `pnpm test:consumer`
- run `pnpm test:consumer:client-bundlers`
- run `pnpm ci:publish-matrix`

## Before `latest`
- all `next` checks
- verify three scheduled smoke runs
- verify no unretried smoke failure in 7 days
- verify `docs/release/v1.0.0.md` evidence section is complete
- verify release owner approval
```

- [ ] **Step 2: Include exact commands from the repo scripts**

Mirror the workspace scripts from `package.json` in the checklist:

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm test:consumer
pnpm test:consumer:client-bundlers
pnpm ci:publish-matrix
```

- [ ] **Step 3: Inspect the checklist**

Run:

```bash
sed -n '1,220p' docs/release/publish-checklist.md
```

Expected: the checklist is operator-facing, distinguishes `next` from `latest`, and references only commands that actually exist in `package.json`.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/release/publish-checklist.md
git commit -m "docs: add publish operator checklist"
```

Expected: commit succeeds with only the checklist file staged.

---

### Task 6: Capture Release Notes And Version Intent

**Files:**
- Modify: `.changeset/config.json`
- Create: `.changeset/<slug>.md` if package versions should move
- Verify: `docs/release/v0.1.0-alpha.md`

- [ ] **Step 1: Verify whether doc-only changes should ship with a package version**

Run:

```bash
sed -n '1,200p' .changeset/config.json
git status --short
```

Expected: you can decide whether these release-readiness docs are documentation-only or whether package README changes justify a changeset for the published packages.

- [ ] **Step 2: If package READMEs changed and you want npm consumers to receive them, add a changeset**

Create `.changeset/release-readiness-docs.md` with:

```md
---
'@kaleido/cli': patch
'@kaleido/client': patch
'@kaleido/core': patch
---

Publish consumer-facing package documentation and release-process alignment for the first public release track.
```

- [ ] **Step 3: Inspect the changeset if created**

Run:

```bash
sed -n '1,120p' .changeset/release-readiness-docs.md
```

Expected: the changeset references only packages whose published tarballs actually changed.

- [ ] **Step 4: Commit**

Run:

```bash
git add .changeset/config.json .changeset/release-readiness-docs.md
git commit -m "docs: record release-readiness package version intent"
```

Expected: if no changeset was needed, skip this commit. Do not create an empty commit.

---

### Task 7: Collect Operational Evidence Before Any `latest` Publish

**Files:**
- Modify: `docs/release/v1.0.0.md`
- Verify: `docs/release/v1-readiness.md`

- [ ] **Step 1: Add an evidence section to the v1 release spec**

Append this structure to `docs/release/v1.0.0.md`:

```md
## Evidence Required

### Local Verification
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm test:consumer`

### Scheduled Smoke Evidence
- date of newest successful scheduled run
- date of second newest successful scheduled run
- date of third newest successful scheduled run
- confirmation that no unretried smoke failure occurred in the previous 7 days

### Release Owner Sign-off
- owner
- date
- dist-tag approved
```

- [ ] **Step 2: Leave placeholders only where external evidence must be inserted later**

Use explicit operator fill-in markers only for live evidence, for example:

```md
- newest successful scheduled run: `<fill during release>`
```

Do not use placeholders in normative sections such as interface contract or rollout rules.

- [ ] **Step 3: Inspect the final spec**

Run:

```bash
sed -n '1,320p' docs/release/v1.0.0.md
```

Expected: the document now separates stable release rules from live release evidence and gives the operator a precise place to record verification.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/release/v1.0.0.md
git commit -m "docs: add v1 release evidence template"
```

Expected: commit succeeds with only the evidence-template changes staged.

---

## Self-Review

- Spec coverage: this plan covers the previously identified gaps in release spec completeness, package-level consumer docs, release workflow alignment, publish checklists, and `latest` operational evidence.
- Placeholder scan: placeholders are permitted only in Task 7 for future live release evidence that cannot be generated during documentation work.
- Type consistency: `next` means pre-v1 public publishing; `latest` means stable v1 publishing. The same distinction is used in all tasks.
