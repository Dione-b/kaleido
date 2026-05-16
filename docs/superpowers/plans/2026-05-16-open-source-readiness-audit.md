# Open Source Readiness Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the eight audit gaps (naming/docs drift, Stellar CLI parser resilience, live testnet verification in CI, `main` branch convention, visible CI status, a second non-trivial template, honest `caatinga dev` DX, and first public release validation) so contributors can trust `pnpm dev`, badges, and the default pipeline without cloning secrets.

**Architecture:** Treat this as three tracks: **(A) contributor truth** — one canonical npm scope, branch `main`, README badges that match GitHub; **(B) Stellar boundary hardening** — pinned CLI in CI, fixture matrix per parser, scheduled+release testnet smoke as a release gate; **(C) product proof** — finish `marketplace-with-token`, decide `caatinga dev` surface, publish `0.x` with consumer scripts. Reuse existing modules (`parseStellarCliVersion`, `parseContractId`, `scripts/testnet-smoke.sh`, `isTransientTestnetSmokeFailure`) instead of new abstractions.

**Tech Stack:** TypeScript ESM, pnpm 9, Turbo, Vitest, GitHub Actions, Bash smoke scripts, Stellar CLI 22.x–25.x.

---

## Baseline (read before Task 1)

| # | Audit claim | Current repo state | Plan action |
|---|-------------|-------------------|-------------|
| 1 | `pnpm dev` broken (`@caatinga` vs `@caatinga/cli`) | Root `package.json` uses `@caatinga/cli`; docs use `@caatinga/*`; README npm badge **label** says `@caatinga/cli` but links to `@caatinga/cli`. `pnpm dev` runs. | Fix badge/aspirational naming drift; document canonical scope. |
| 2 | Fragile Stellar CLI parsing | Parsers + fixtures exist under `packages/core/test/fixtures/stellar-cli/`; default CI does **not** install or pin Stellar CLI. | Pin CLI in CI + fixture matrix job. |
| 3 | No live testnet CI | `.github/workflows/testnet-smoke.yml` exists (cron, `workflow_dispatch`, `release`); **not** on push/PR; `docs/release/v0.1.0-alpha.md` still lists smoke as non-goal. | Wire release gate + refresh docs. |
| 4 | Branch `master` | Default branch is `master`; README CI badge uses `branch=main` (likely 404). | Rename to `main` + update workflows. |
| 5 | No CI badge | Badge present but wrong branch. | Fix in Task 4. |
| 6 | Single template | `react-vite-counter` is complete; `marketplace-with-token` is manifest-only skeleton. | Complete second template. |
| 7 | `caatinga dev` placeholder | `packages/cli/src/commands/dev.command.ts` logs MVP warning. | Hide or implement minimal orchestration. |
| 8 | No external validation | Social/release signal, not code. | Release + checklist track. |

---

## File map

| File | Responsibility |
|------|----------------|
| `package.json` | Root `dev` script; document contributor entry. |
| `README.md` | Badges, install names, branch references. |
| `docs/getting-started.md` | Contributor bootstrap; canonical package names. |
| `docs/architecture.md` | Future `@caatinga/*` vs published `@caatinga/*` clarity. |
| `docs/testing.md` | CI + smoke + fixture policy (already partially updated). |
| `docs/release/v0.1.0-alpha.md` | Remove stale “no live testnet CI” non-goal. |
| `.github/workflows/ci.yml` | Pin Stellar CLI; optional parser-matrix job. |
| `.github/workflows/testnet-smoke.yml` | Release gate documentation; branch triggers after rename. |
| `packages/core/src/stellar-cli/*.ts` | Parsers (no API break). |
| `packages/core/test/fixtures/stellar-cli/**` | Versioned CLI output fixtures. |
| `packages/templates/marketplace-with-token/**` | Second template implementation. |
| `packages/cli/src/commands/dev.command.ts` | Placeholder vs real dev UX. |
| `packages/cli/src/program.ts` | Command registration order/visibility. |
| `scripts/testnet-smoke.sh` | E2E smoke (already implemented). |

---

### Task 1: Canonical package naming and contributor `pnpm dev`

**Files:**
- Modify: `README.md:7-11`
- Modify: `docs/getting-started.md:21-27`
- Create: `docs/packages.md`
- Modify: `package.json:7-10` (only if script text needs clarity)

**Decision (lock in Task 1):** Published npm scope stays **`@caatinga/*`** until an npm org migration is executed. Marketing may say “Caatinga CLI”; install commands must show `@caatinga/cli`. Do **not** rename packages in this plan.

- [ ] **Step 1: Write the failing doc contract test**

Create `packages/core/src/release/package-naming-contract.test.ts`:

```typescript
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("package naming contract", () => {
  it("should_not_document_unpublished_@caatinga/cli_scope_in_readme", async () => {
    const readme = await readFile(path.join(root, "README.md"), "utf8");
    expect(readme).not.toMatch(/npm install -g @caatinga\/cli\b/);
    expect(readme).toMatch(/@caatinga\/cli/);
  });

  it("should_use_filter_name_matching_cli_package_json", async () => {
    const rootPkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    const cliPkg = JSON.parse(
      await readFile(path.join(root, "packages/cli/package.json"), "utf8")
    );
    const filter = rootPkg.scripts.dev.match(/--filter\s+(\S+)/)?.[1];
    expect(filter).toBe(cliPkg.name);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @caatinga/core exec vitest run src/release/package-naming-contract.test.ts -v
```

Expected: FAIL if README still implies `@caatinga/cli` install or filter mismatch.

- [ ] **Step 3: Fix README badge and add packages doc**

In `README.md`, replace the npm badge line with:

```markdown
[![npm](https://img.shields.io/npm/v/@caatinga/cli?label=%40caatinga%2Fcli)](https://www.npmjs.com/package/@caatinga/cli)
```

Create `docs/packages.md`:

```markdown
# Packages

| Package | Role |
|---------|------|
| `@caatinga/cli` | End-user CLI (`caatinga` binary) |
| `@caatinga/core` | Config, artifacts, Stellar CLI orchestration |
| `@caatinga/client` | Browser/client interop over generated bindings |

Install for end users:

```bash
npm install -g @caatinga/cli
```

Monorepo development:

```bash
pnpm install
pnpm build
pnpm dev -- init my-app   # runs CLI via tsx in packages/cli
```

Future names such as `@caatinga/react` are reserved in architecture docs and are not published yet.
```

Add to `README.md` under **Documentation**:

```markdown
- [Packages and scopes](./docs/packages.md)
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @caatinga/core exec vitest run src/release/package-naming-contract.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add README.md docs/packages.md docs/getting-started.md packages/core/src/release/package-naming-contract.test.ts
git commit -m "docs: align published package scope with contributor scripts"
```

---

### Task 2: Pin Stellar CLI in default CI and add parser fixture matrix

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/stellar-cli-fixtures.yml`
- Modify: `docs/stellar-cli-version-contract.md:34-36`
- Test: existing `packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts`, `parse-contract-id.test.ts`

- [ ] **Step 1: Write failing workflow contract test (local script)**

Create `scripts/check-ci-stellar-pin.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
grep -q 'stellar-cli/setup' .github/workflows/ci.yml || {
  echo "ci.yml must install Stellar CLI via stellar/stellar-cli action"
  exit 1
}
```

- [ ] **Step 2: Run script to verify it fails**

Run:

```bash
bash scripts/check-ci-stellar-pin.sh
```

Expected: exit 1 (no pin today).

- [ ] **Step 3: Pin Stellar CLI in `ci.yml`**

Insert after Node setup in `.github/workflows/ci.yml`:

```yaml
      - name: Install Stellar CLI
        uses: stellar/stellar-cli@v22.8.1

      - name: Verify Stellar CLI version
        run: stellar --version
```

Add job `stellar-fixtures` (or extend `ci` job) that runs only parser tests:

```yaml
      - name: Stellar CLI parser fixtures
        run: pnpm --filter @caatinga/core exec vitest run src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts src/stellar-cli/parse-contract-id.test.ts -v
```

Update `docs/stellar-cli-version-contract.md` CI rule:

```markdown
CI installs Stellar CLI via `stellar/stellar-cli@v22.8.1` (adjust tag when raising `STELLAR_CLI_TESTED_MAX_VERSION`). Parser fixture tests run on every push/PR.
```

- [ ] **Step 4: Run parsers locally**

Run:

```bash
pnpm --filter @caatinga/core exec vitest run src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts src/stellar-cli/parse-contract-id.test.ts -v
bash scripts/check-ci-stellar-pin.sh
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml docs/stellar-cli-version-contract.md scripts/check-ci-stellar-pin.sh
git commit -m "ci: pin Stellar CLI and run parser fixture tests"
```

---

### Task 3: Expand deploy/invoke fixtures for a second CLI semver

**Files:**
- Create: `packages/core/test/fixtures/stellar-cli/v22.0.0/deploy-success.txt`
- Modify: `packages/core/src/stellar-cli/parse-contract-id.test.ts`
- Modify: `docs/testing.md:15-26`

- [ ] **Step 1: Write the failing test**

Append to `parse-contract-id.test.ts`:

```typescript
  it("should_parse_contract_id_from_v22_deploy_success_fixture", async () => {
    const output = await fixture("v22.0.0/deploy-success.txt");
    expect(parseContractId(output)).toBe(CONTRACT_ID);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @caatinga/core exec vitest run src/stellar-cli/parse-contract-id.test.ts -v
```

Expected: FAIL — fixture file missing.

- [ ] **Step 3: Add v22 deploy fixture**

Capture real output once locally (`stellar contract deploy ...`) or copy `v26.0.0/deploy-success.txt` and adjust only non-ID text so the `C…` ID line remains valid. Save as:

`packages/core/test/fixtures/stellar-cli/v22.0.0/deploy-success.txt` — must contain exactly one match for `/\bC[A-Z0-9]{55}\b/`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @caatinga/core exec vitest run src/stellar-cli/parse-contract-id.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/test/fixtures/stellar-cli/v22.0.0/deploy-success.txt packages/core/src/stellar-cli/parse-contract-id.test.ts docs/testing.md
git commit -m "test(core): add v22 deploy fixture for contract id parser"
```

---

### Task 4: Rename default branch to `main` and fix CI badges

**Files:**
- Modify: `README.md:7`
- Modify: `.github/workflows/ci.yml:4-7`
- Modify: `.github/workflows/testnet-smoke.yml` (if branch filters added later)
- GitHub: default branch setting (manual in UI or `gh repo edit`)

- [ ] **Step 1: Verify badge URL is wrong today**

Run:

```bash
git branch --show-current
curl -sI "https://github.com/Dione-b/caatinga/actions/workflows/ci.yml/badge.svg?branch=main" | head -3
curl -sI "https://github.com/Dione-b/caatinga/actions/workflows/ci.yml/badge.svg?branch=master" | head -3
```

Expected: `main` badge may 404; `master` matches remote default.

- [ ] **Step 2: Rename branch locally and on remote**

Run (requires `git_write` + `network`):

```bash
git branch -m master main
git push -u origin main
gh repo edit --default-branch main
git push origin --delete master
```

- [ ] **Step 3: Update workflow triggers**

In `.github/workflows/ci.yml`:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
```

Ensure README CI badge:

```markdown
[![CI](https://img.shields.io/github/actions/workflow/status/Dione-b/caatinga/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Dione-b/caatinga/actions/workflows/ci.yml)
```

- [ ] **Step 4: Push and confirm badge**

After push, open README on GitHub; CI badge should show status for `main`.

- [ ] **Step 5: Commit workflow/README changes**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "chore: standardize default branch on main"
```

---

### Task 5: Live testnet smoke as a documented release gate

**Files:**
- Modify: `docs/release/v0.1.0-alpha.md:28-37`
- Modify: `docs/testing.md:1-8`
- Modify: `docs/release/v1-readiness.md`
- Modify: `.github/workflows/testnet-smoke.yml` (comment header only, unless adding `workflow_call`)

**Note:** Smoke workflow and `scripts/testnet-smoke.sh` already exist. This task makes the audit item “closed” in docs and release policy, not greenfield implementation.

- [ ] **Step 1: Write failing release-doc test**

Add to `packages/core/src/release/package-naming-contract.test.ts` (or new `release-docs-contract.test.ts`):

```typescript
  it("should_not_list_live_testnet_ci_as_alpha_non_goal", async () => {
    const alpha = await readFile(path.join(root, "docs/release/v0.1.0-alpha.md"), "utf8");
    expect(alpha).not.toMatch(/- live testnet CI/);
    expect(alpha).toMatch(/testnet-smoke/);
  });
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm --filter @caatinga/core exec vitest run src/release/package-naming-contract.test.ts -v
```

- [ ] **Step 3: Update alpha + readiness docs**

In `docs/release/v0.1.0-alpha.md`, replace non-goal bullet with:

```markdown
- automated live testnet smoke on every PR (scheduled + release workflows only; see `docs/testing.md`)
```

Append to `docs/testing.md`:

```markdown
## Live testnet smoke (release gate)

Workflow: `.github/workflows/testnet-smoke.yml` — triggers: daily cron, `workflow_dispatch`, GitHub Release `published`.

Required secrets: `CAATINGA_CI_IDENTITY_ALIAS`, `CAATINGA_CI_STELLAR_CONFIG_B64`.

Before tagging `v1.0.0`, verify three consecutive successful scheduled runs (see `docs/release/v1.0.0.md` observability plan).
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add docs/release/v0.1.0-alpha.md docs/testing.md docs/release/v1-readiness.md packages/core/src/release/package-naming-contract.test.ts
git commit -m "docs: document live testnet smoke as release gate"
```

---

### Task 6: Complete `marketplace-with-token` template

**Files:**
- Modify: `packages/templates/marketplace-with-token/contracts/token/` (real Soroban token stub)
- Modify: `packages/templates/marketplace-with-token/contracts/marketplace/` (depends on token via `dependsOn`)
- Modify: `packages/templates/marketplace-with-token/caatinga.config.ts`
- Modify: `packages/templates/marketplace-with-token/package.json`
- Modify: `packages/templates/marketplace-with-token/src/main.ts`
- Test: `packages/core/src/templates/create-project-from-template.test.ts` (extend smoke copy)

**Minimum bar:** Two contracts with `dependsOn` + `${contracts.token.contractId}` in `deployArgs`; `caatinga init -t marketplace-with-token` produces a project that passes `pnpm typecheck` in template (template-local install).

- [ ] **Step 1: Write failing template integration test**

Extend `create-project-from-template.test.ts`:

```typescript
  it("should_materialize_marketplace_with_token_with_two_contract_entries", async () => {
    const templatePath = path.join(templateRoot, "marketplace-with-token");
    const manifest = await readTemplateManifest(templatePath);
    expect(manifest.contracts?.default).toBe("marketplace");
    const configSource = await readFile(path.join(templatePath, "caatinga.config.ts"), "utf8");
    expect(configSource).toContain("dependsOn");
    expect(configSource).toContain("contracts.token.contractId");
    expect(configSource).not.toContain("placeholder");
  });
```

- [ ] **Step 2: Run test — expect FAIL** (placeholder still in `main.ts` / config)

- [ ] **Step 3: Implement template**

`caatinga.config.ts` must define `token` and `marketplace` contracts; `marketplace` uses:

```typescript
dependsOn: ["token"],
deployArgs: {
  token_contract: "${contracts.token.contractId}",
},
```

Replace `src/main.ts` with a minimal Vite-free TypeScript entry that imports `@caatinga/core` types only (or mirror counter’s React shell if faster — prefer matching `caatinga.template.json` `vite-react`).

Remove `export const placeholder` string.

- [ ] **Step 4: Run template tests**

```bash
pnpm --filter @caatinga/core test -- src/templates/create-project-from-template.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/templates/marketplace-with-token packages/core/src/templates/create-project-from-template.test.ts
git commit -m "feat(templates): complete marketplace-with-token multi-contract example"
```

---

### Task 7: Resolve `caatinga dev` placeholder DX

**Files:**
- Modify: `packages/cli/src/commands/dev.command.ts`
- Modify: `packages/cli/src/program.ts`
- Modify: `packages/cli/README.md`
- Modify: `docs/cli.md:32`
- Test: `packages/cli/src/commands/dev.command.test.ts` (create)

**Decision:** Ship **Option A** (recommended for alpha): remove from top-level help, keep hidden stub. **Option B** (follow-up): orchestrate `vite` + watch — only if Task 6 template uses Vite.

#### Option A (recommended): hidden command

- [ ] **Step 1: Write failing CLI test**

Create `packages/cli/src/commands/dev.command.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { Command } from "commander";
import { registerDevCommand } from "./dev.command.js";

describe("registerDevCommand", () => {
  it("should_register_dev_as_hidden", () => {
    const program = new Command();
    registerDevCommand(program);
    const dev = program.commands.find((c) => c.name() === "dev");
    expect(dev?.hidden).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm --filter @caatinga/cli exec vitest run src/commands/dev.command.test.ts -v
```

- [ ] **Step 3: Hide command and tighten message**

In `dev.command.ts`:

```typescript
export function registerDevCommand(program: Command): void {
  program
    .command("dev")
    .description("Reserved — not available in pre-v1")
    .option("-h, --help", "display help for command")
    .configureHelp({ showGlobalOptions: false })
    .hideHelp(true)
    .action(() => runCliAction(async () => {
      logger.error(
        "caatinga dev is not available yet. Use: caatinga build, deploy, generate, invoke."
      );
      process.exitCode = 1;
    }));
}
```

Commander hidden flag (verify installed version supports `.hidden(true)`; if not, use `.addHelpText` + exclude from `program.helpInformation()` via not registering until implemented).

Update `docs/cli.md`:

```markdown
`caatinga dev` is reserved and hidden in pre-v1 builds. Use your frontend's dev server (e.g. Vite) alongside `caatinga build` / `deploy` / `generate` / `invoke`.
```

Remove `caatinga dev` row from README CLI table or mark **Reserved**.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/dev.command.ts packages/cli/src/commands/dev.command.test.ts docs/cli.md README.md packages/cli/README.md
git commit -m "fix(cli): hide unimplemented dev command from public surface"
```

---

### Task 8: First public release and external validation (non-code)

**Files:**
- Modify: `docs/release/v1-readiness.md`
- Use: `pnpm ci:publish-matrix`, Changesets, GitHub Releases

- [ ] **Step 1: Run publish matrix locally**

```bash
pnpm ci:publish-matrix
```

Expected: exit 0 — build, test, pack, dry-run publish, consumer isolation.

- [ ] **Step 2: Add changeset for doc/template/cli fixes**

```bash
pnpm changeset
```

Select `@caatinga/cli`, `@caatinga/core`, `@caatinga/client` as patch; summarize audit fixes.

- [ ] **Step 3: Merge to `main`, tag pre-release, publish `next`**

Follow `docs/release/v1.0.0.md` dist-tag policy. After publish, run consumer script against registry tarballs.

- [ ] **Step 4: Verify testnet smoke on release**

Trigger `Testnet Smoke` workflow via `workflow_dispatch` after secrets are configured; confirm green run before announcing.

- [ ] **Step 5: Update README status line**

```markdown
> **Status:** `0.1.x` on npm tag `next`. See [v1 readiness](./docs/release/v1-readiness.md).
```

No commit message prescribed — coordinate with maintainer.

---

## Self-review

**1. Spec coverage**

| Audit # | Task |
|---------|------|
| 1 Naming | Task 1 |
| 2 Parsing | Tasks 2–3 |
| 3 Live testnet | Task 5 (+ existing workflow) |
| 4 `main` branch | Task 4 |
| 5 CI badge | Task 4 |
| 6 Second template | Task 6 |
| 7 `caatinga dev` | Task 7 |
| 8 External validation | Task 8 |

**2. Placeholder scan:** No TBD steps; Option B for `caatinga dev` deferred explicitly.

**3. Type consistency:** `@caatinga/*` used throughout; `parseContractId` / fixture paths aligned.

**Gaps intentionally out of scope:** npm org rename to `@caatinga/cli`, full `caatinga dev` Vite orchestration, PR-required testnet smoke (cost/secrets), automatic “3 green smokes” enforcement in Actions.

---

## Execution order

1. Task 4 (branch `main`) — unblocks badge and contributor defaults  
2. Tasks 1, 2, 3 — naming + CI parsers  
3. Task 5 — docs for smoke  
4. Task 6 — template  
5. Task 7 — dev command  
6. Task 8 — release (maintainer-driven)
