# Caatinga Operational Stability V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the operational base for Caatinga v1 by making CI/typecheck/build/test reliable, aligning the Rust WASM target with current Stellar requirements, and closing release gates before new features.

**Architecture:** Treat this as stabilization, not feature expansion. Keep existing package boundaries: GitHub workflows orchestrate gates, `@caatinga/core` owns config/artifact schemas, Stellar CLI compatibility, build/deploy behavior, and template contracts, while scripts own external consumer/release verification. Preserve existing public error codes unless a spec explicitly authorizes a major version break.

**Tech Stack:** TypeScript ESM, pnpm 9.15.4, Node 20+, Turbo, Vitest, GitHub Actions, Stellar CLI, Rust smart contracts targeting `wasm32v1-none`.

---

## File Structure

Modify these existing files only unless a task explicitly says to create a new fixture:

- `.github/workflows/ci.yml`: valid CI workflow for push and pull request gates.
- `.github/workflows/release.yml`: release gate workflow, including publish and consumer checks.
- `.github/workflows/testnet-smoke.yml`: manual/scheduled/release testnet smoke workflow.
- `README.md`, `packages/core/README.md`, `packages/cli/README.md`, `docs/errors.md`, `docs/getting-started.md`, `docs/config.md`, `docs/stellar-cli-version-contract.md`, `docs/release/v1-readiness.md`, `docs/release/v1.0.0.md`, `packages/core/CHANGELOG.md`, `packages/cli/CHANGELOG.md`: docs that must stop advertising the obsolete WASM target and must state the Stellar CLI version contract.
- `packages/core/src/templates/template-manifest.schema.ts`: template manifest Zod type exports.
- `packages/core/src/artifacts/artifact.schema.ts`: artifact Zod type exports.
- `packages/core/src/contracts/build-contract.ts`: Rust WASM target constant and missing-target hint.
- `packages/core/src/contracts/build-contract.test.ts`: build target tests and missing target heuristic tests.
- `packages/core/src/config/config.schema.test.ts`: schema examples using current target paths.
- `packages/core/src/templates/create-project-from-template.test.ts`: generated template path tests.
- `packages/templates/react-vite-counter/caatinga.config.ts`: counter template target path.
- `packages/templates/react-vite-counter/README.md`: counter template setup docs.
- `packages/templates/marketplace-with-token/caatinga.config.ts`: multi-contract template target paths.
- `packages/templates/marketplace-with-token/README.md`: multi-contract template setup docs.
- `packages/core/src/stellar-cli/version.ts`: supported/tested Stellar CLI range and error semantics.
- `packages/core/src/stellar-cli/check-stellar-cli-version.ts`: version command wrapper.
- `packages/core/src/stellar-cli/check-stellar-cli-version.test.ts`: min/max/prerelease behavior.
- `packages/core/src/stellar-cli/run-command-version.test.ts`: proof that `runCommand()` gates Stellar commands.
- `packages/core/src/stellar-cli/parse-contract-id.test.ts`: parser fixtures for deploy success and failure.
- `packages/core/test/fixtures/stellar-cli/v24.0.0/*`: create previous-supported-version fixtures if missing.
- `packages/core/test/fixtures/stellar-cli/v25.2.0/*`: create current-tested-version fixtures if missing.
- `packages/core/src/errors/error-codes.test.ts`, `packages/core/src/errors/error-surface.test.ts`, `packages/core/test/errors/caatinga-error-code.test.ts`: public error code coverage.
- `package.json`, `packages/core/package.json`, `packages/cli/package.json`, `packages/client/package.json`: release/consumer scripts and package manifest contracts.
- `scripts/consumer-isolation-test.sh`, `scripts/consumer-client-bundlers-test.sh`, `scripts/testnet-smoke.sh`, `scripts/check-ci-stellar-pin.sh`: release and smoke gate scripts.

Do not add wallets, hosted RPC, VS Code integration, template registry, branding changes, or new `@caatinga/client` feature surface.

### Task 1: Normalize GitHub Actions YAML

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/workflows/testnet-smoke.yml`

- [ ] **Step 1: Inspect current workflows for one-line YAML damage**

Run:

```bash
rtk sed -n '1,220p' .github/workflows/ci.yml
rtk sed -n '1,260p' .github/workflows/release.yml
rtk sed -n '1,260p' .github/workflows/testnet-smoke.yml
```

Expected: each file is multiline YAML with `name:`, `on:`, and `jobs:` at top-level indentation. If a file prints as one physical line, replace it in the next steps.

- [ ] **Step 2: Replace CI workflow with valid baseline plus existing Stellar pin**

Write `.github/workflows/ci.yml` as:

```yaml
name: CI

on:
  push:
    branches:
      - main
      - master
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install Stellar CLI
        uses: stellar/stellar-cli@v25.2.0

      - name: Verify Stellar CLI version
        run: stellar --version

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

- [ ] **Step 3: Validate release workflow shape**

Ensure `.github/workflows/release.yml` includes these gates in order after install/build prerequisites:

```yaml
      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test

      - name: Snapshot pack
        run: pnpm ci:snapshot-pack

      - name: Publish dry run
        run: pnpm publish:dry-run

      - name: Consumer isolation
        run: pnpm test:consumer

      - name: Client bundler consumers
        run: pnpm test:consumer:client-bundlers
```

Do not introduce npm publish credentials in this task.

- [ ] **Step 4: Validate testnet smoke workflow shape**

Ensure `.github/workflows/testnet-smoke.yml` keeps all of these triggers:

```yaml
on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:
  release:
    types:
      - published
```

Ensure it has exactly one automatic retry path for transient failures:

```yaml
      - name: Smoke attempt 1
        id: smoke1
        continue-on-error: true
        env:
          CAATINGA_CI_IDENTITY_ALIAS: ${{ secrets.CAATINGA_CI_IDENTITY_ALIAS }}
        run: bash scripts/testnet-smoke.sh smoke-app

      - name: Smoke retry
        id: smokeretry
        if: steps.smoke1.outcome == 'failure' && steps.smoke1.outputs.transient == 'true'
        env:
          CAATINGA_CI_IDENTITY_ALIAS: ${{ secrets.CAATINGA_CI_IDENTITY_ALIAS }}
        run: bash scripts/testnet-smoke.sh smoke-app-retry
```

- [ ] **Step 5: Verify workflow syntax locally**

Run:

```bash
rtk pnpm exec prettier --check .github/workflows/ci.yml .github/workflows/release.yml .github/workflows/testnet-smoke.yml
```

Expected: PASS if Prettier is available. If the command fails because Prettier is not installed, run this structural fallback:

```bash
rtk ruby -e 'ARGV.each { |f| abort("#{f} is one line") if File.read(f).lines.length < 5 }; puts "workflow files are multiline"' .github/workflows/ci.yml .github/workflows/release.yml .github/workflows/testnet-smoke.yml
```

Expected: `workflow files are multiline`.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/release.yml .github/workflows/testnet-smoke.yml
git commit -m "fix(ci): normalize workflow yaml"
```

### Task 2: Fix Invalid Zod Type Exports

**Files:**
- Modify: `packages/core/src/templates/template-manifest.schema.ts`
- Modify: `packages/core/src/artifacts/artifact.schema.ts`
- Test: `packages/core/src/config/schema-type-exports.test.ts`

- [ ] **Step 1: Prove the current invalid pattern exists or is already absent**

Run:

```bash
rtk rg -n "z\\.infer;" packages/core/src/templates/template-manifest.schema.ts packages/core/src/artifacts/artifact.schema.ts packages
```

Expected before the fix, if broken: at least one `export type ... = z.infer;`. Expected after the fix: no matches.

- [ ] **Step 2: Fix template manifest type export**

In `packages/core/src/templates/template-manifest.schema.ts`, ensure the bottom of the file exports this exact type:

```ts
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
```

Keep the existing `TemplateManifestSchema` definition unchanged unless it is malformed.

- [ ] **Step 3: Fix artifact type exports**

In `packages/core/src/artifacts/artifact.schema.ts`, ensure the schema type exports are:

```ts
export type ContractArtifact = z.infer<typeof ContractArtifactSchema>;
export type CaatingaArtifacts = z.infer<typeof CaatingaArtifactsSchema>;
```

Keep existing schema fields and compatibility behavior unchanged.

- [ ] **Step 4: Verify no invalid `z.infer` remains**

Run:

```bash
rtk rg -n "z\\.infer;" packages
```

Expected: command exits with no matches.

- [ ] **Step 5: Verify type exports compile**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- schema-type-exports.test.ts
rtk pnpm typecheck
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/templates/template-manifest.schema.ts packages/core/src/artifacts/artifact.schema.ts packages/core/src/config/schema-type-exports.test.ts
git commit -m "fix(core): restore zod inferred schema exports"
```

### Task 3: Align Rust WASM Target With Stellar Current Target

**Files:**
- Modify: `README.md`
- Modify: `packages/core/README.md`
- Modify: `packages/cli/README.md`
- Modify: `docs/errors.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/config.md`
- Modify: `packages/core/CHANGELOG.md`
- Modify: `packages/cli/CHANGELOG.md`
- Modify: `packages/core/src/contracts/build-contract.ts`
- Modify: `packages/core/src/contracts/build-contract.test.ts`
- Modify: `packages/core/src/config/config.schema.test.ts`
- Modify: `packages/core/src/templates/create-project-from-template.test.ts`
- Modify: `packages/templates/react-vite-counter/caatinga.config.ts`
- Modify: `packages/templates/react-vite-counter/README.md`
- Modify: `packages/templates/marketplace-with-token/caatinga.config.ts`
- Modify: `packages/templates/marketplace-with-token/README.md`
- Modify as needed: `packages/client/src/**/*.test.ts`

- [ ] **Step 1: Write the failing source scan**

Run:

```bash
rtk rg -n "wasm32-unknown-unknown" README.md docs packages scripts .github
```

Expected before the fix: matches in docs, package readmes, template configs, tests, and `build-contract.ts`.

- [ ] **Step 2: Update the core target constant**

In `packages/core/src/contracts/build-contract.ts`, set:

```ts
const RUST_WASM_TARGET = "wasm32v1-none";
```

Ensure any missing-target hint says:

```ts
"Run `rustup target add wasm32v1-none` and retry."
```

- [ ] **Step 3: Update template config paths**

In `packages/templates/react-vite-counter/caatinga.config.ts`, set:

```ts
wasm: "./contracts/counter/target/wasm32v1-none/release/counter.wasm"
```

In `packages/templates/marketplace-with-token/caatinga.config.ts`, set:

```ts
wasm: "./contracts/token/target/wasm32v1-none/release/token.wasm"
```

and:

```ts
wasm: "./contracts/marketplace/target/wasm32v1-none/release/marketplace.wasm"
```

- [ ] **Step 4: Update tests that assert target paths**

Replace test literals in `packages/core/src/contracts/build-contract.test.ts`, `packages/core/src/config/config.schema.test.ts`, `packages/core/src/templates/create-project-from-template.test.ts`, and client artifact tests so expected paths use `wasm32v1-none`.

The missing-target test cause should use:

```ts
new Error("error: the wasm32v1-none target is not installed. run `rustup target add wasm32v1-none`")
```

The generated template test should assert:

```ts
expect(config).toContain("target/wasm32v1-none/release/counter.wasm");
```

- [ ] **Step 5: Update docs**

Replace every user-facing setup command:

```bash
rustup target add wasm32-unknown-unknown
```

with:

```bash
rustup target add wasm32v1-none
```

Replace every template/config path segment:

```txt
target/wasm32-unknown-unknown/release
```

with:

```txt
target/wasm32v1-none/release
```

In `README.md` and `docs/getting-started.md`, state the prerequisite as:

```txt
Rust 1.84.0 or newer with the wasm32v1-none target.
```

In `docs/errors.md`, update `CAATINGA_RUST_TARGET_NOT_FOUND` recovery to:

```txt
Run `rustup target add wasm32v1-none` and retry; if the heuristic misclassifies, inspect the underlying `CAATINGA_BUILD_FAILED` output.
```

- [ ] **Step 6: Verify no relevant obsolete target remains**

Run:

```bash
rtk rg -n "wasm32-unknown-unknown" README.md docs packages scripts .github
```

Expected: no matches, except historical archived release notes only if the release note explicitly describes a past version. If historical matches remain, add a comment in the commit message body explaining why they are intentionally historical.

- [ ] **Step 7: Run focused tests**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- build-contract.test.ts config.schema.test.ts create-project-from-template.test.ts
rtk pnpm --filter @caatinga/client test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add README.md packages/core/README.md packages/cli/README.md docs/errors.md docs/getting-started.md docs/config.md packages/core/CHANGELOG.md packages/cli/CHANGELOG.md packages/core/src/contracts/build-contract.ts packages/core/src/contracts/build-contract.test.ts packages/core/src/config/config.schema.test.ts packages/core/src/templates/create-project-from-template.test.ts packages/templates/react-vite-counter/caatinga.config.ts packages/templates/react-vite-counter/README.md packages/templates/marketplace-with-token/caatinga.config.ts packages/templates/marketplace-with-token/README.md packages/client/src
git commit -m "fix(core): target wasm32v1-none for stellar contracts"
```

### Task 4: Lock Stellar CLI Version Contract

**Files:**
- Modify: `packages/core/src/stellar-cli/version.ts`
- Modify: `packages/core/src/stellar-cli/check-stellar-cli-version.test.ts`
- Modify: `packages/core/src/stellar-cli/run-command-version.test.ts`
- Modify: `docs/stellar-cli-version-contract.md`
- Modify: `README.md`
- Modify: `docs/release/v1-readiness.md`
- Modify: `docs/release/v1.0.0.md`
- Modify: `scripts/check-ci-stellar-pin.sh`

- [ ] **Step 1: Confirm policy before edits**

Use this policy unless the product owner explicitly chooses to support 26.x:

```ts
export const STELLAR_CLI_MIN_VERSION = "23.0.0";
export const STELLAR_CLI_TESTED_MAX_VERSION = "25.2.0";
```

Rationale: existing code documents that 22.x fails signed invokes, and fixtures/tests do not yet prove 26.x compatibility across release gates.

- [ ] **Step 2: Keep old-version error semantics**

In `packages/core/src/stellar-cli/version.ts`, versions below minimum must throw:

```ts
CaatingaErrorCode.UNSUPPORTED_CLI_VERSION
```

The message must include:

```txt
below the supported minimum 23.0.0
```

- [ ] **Step 3: Keep newer-than-tested error semantics**

In `packages/core/src/stellar-cli/version.ts`, versions above tested max must throw:

```ts
CaatingaErrorCode.UNTESTED_CLI_VERSION
```

The message must include:

```txt
newer than the tested maximum 25.2.0
```

Do not collapse this into `CAATINGA_UNSUPPORTED_CLI_VERSION`; callers need to distinguish old unsupported tooling from new unverified tooling.

- [ ] **Step 4: Test range boundaries**

Ensure `packages/core/src/stellar-cli/check-stellar-cli-version.test.ts` includes cases equivalent to:

```ts
await expect(check("22.0.1")).rejects.toMatchObject({
  code: CaatingaErrorCode.UNSUPPORTED_CLI_VERSION
});

await expect(check("23.0.0")).resolves.toBe("23.0.0");
await expect(check("25.2.0")).resolves.toBe("25.2.0");

await expect(check("26.0.0")).rejects.toMatchObject({
  code: CaatingaErrorCode.UNTESTED_CLI_VERSION
});
```

Use the existing helper names in the test file rather than introducing a new helper if one already exists.

- [ ] **Step 5: Test `runCommand()` gates Stellar commands**

Ensure `packages/core/src/stellar-cli/run-command-version.test.ts` proves:

```ts
await expect(runCommand("stellar", ["contract", "deploy"])).rejects.toMatchObject({
  code: CaatingaErrorCode.UNTESTED_CLI_VERSION
});
```

for a mocked `stellar --version` returning `stellar 26.0.0`, and that the actual deploy command is not executed after the version check fails.

- [ ] **Step 6: Document pinned install**

In `docs/stellar-cli-version-contract.md` and README, add:

```bash
cargo install --locked stellar-cli --version 25.2.0
stellar --version
```

State:

```txt
Caatinga supports Stellar CLI 23.0.0 through 25.2.0. Versions below 23.0.0 fail with CAATINGA_UNSUPPORTED_CLI_VERSION. Versions above 25.2.0 fail with CAATINGA_UNTESTED_CLI_VERSION unless --allow-untested-stellar-cli is explicitly used for local experiments. Release and CI gates must not use that override.
```

- [ ] **Step 7: Verify focused contract**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- check-stellar-cli-version.test.ts run-command-version.test.ts
rtk bash scripts/check-ci-stellar-pin.sh
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/stellar-cli/version.ts packages/core/src/stellar-cli/check-stellar-cli-version.test.ts packages/core/src/stellar-cli/run-command-version.test.ts docs/stellar-cli-version-contract.md README.md docs/release/v1-readiness.md docs/release/v1.0.0.md scripts/check-ci-stellar-pin.sh
git commit -m "fix(core): lock stellar cli compatibility contract"
```

### Task 5: Normalize Stellar CLI Fixtures and Parser Coverage

**Files:**
- Create if missing: `packages/core/test/fixtures/stellar-cli/v24.0.0/deploy.v24.0.0.success.fixture.txt`
- Create if missing: `packages/core/test/fixtures/stellar-cli/v24.0.0/version.v24.0.0.fixture.txt`
- Create if missing: `packages/core/test/fixtures/stellar-cli/v25.2.0/deploy.v25.2.0.success.fixture.txt`
- Create if missing: `packages/core/test/fixtures/stellar-cli/v25.2.0/deploy.v25.2.0.no-contract-id.fixture.txt`
- Create if missing: `packages/core/test/fixtures/stellar-cli/v25.2.0/version.v25.2.0.fixture.txt`
- Modify: `packages/core/src/stellar-cli/parse-contract-id.test.ts`
- Modify: `packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts`

- [ ] **Step 1: Inspect existing fixtures**

Run:

```bash
rtk rg --files packages/core/test/fixtures/stellar-cli | sort
```

Expected: fixtures are grouped by version directory. If current fixture names are generic, add versioned fixture names without deleting old fixtures unless tests no longer use them.

- [ ] **Step 2: Add v24 success deploy fixture**

Create `packages/core/test/fixtures/stellar-cli/v24.0.0/deploy.v24.0.0.success.fixture.txt`:

```txt
stellar contract deploy --wasm target/wasm32v1-none/release/token.wasm
ℹ️  Signing transaction: 6f9d...
ℹ️  Submitting transaction...
ℹ️  Transaction successful.
Contract ID: CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB
```

- [ ] **Step 3: Add v24 version fixture**

Create `packages/core/test/fixtures/stellar-cli/v24.0.0/version.v24.0.0.fixture.txt`:

```txt
stellar 24.0.0
```

- [ ] **Step 4: Add v25.2 deploy success fixture**

Create `packages/core/test/fixtures/stellar-cli/v25.2.0/deploy.v25.2.0.success.fixture.txt`:

```txt
stellar contract deploy --wasm target/wasm32v1-none/release/counter.wasm --network testnet
ℹ️  Signing transaction: 7a0d...
ℹ️  Submitting transaction...
ℹ️  Transaction successful.
Contract ID: CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
```

- [ ] **Step 5: Add v25.2 deploy no-contract-id fixture**

Create `packages/core/test/fixtures/stellar-cli/v25.2.0/deploy.v25.2.0.no-contract-id.fixture.txt`:

```txt
stellar contract deploy --wasm target/wasm32v1-none/release/counter.wasm --network testnet
ℹ️  Signing transaction: 7a0d...
ℹ️  Submitting transaction...
error: transaction failed before contract id was emitted
```

- [ ] **Step 6: Add v25.2 version fixture**

Create `packages/core/test/fixtures/stellar-cli/v25.2.0/version.v25.2.0.fixture.txt`:

```txt
stellar 25.2.0
```

- [ ] **Step 7: Test deploy parser against real fixtures**

In `packages/core/src/stellar-cli/parse-contract-id.test.ts`, add or preserve tests that read fixtures from disk and assert:

```ts
expect(parseContractId(v24Success)).toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB");
expect(parseContractId(v25Success)).toBe("CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
expect(() => parseContractId(v25NoContractId)).toThrow(
  expect.objectContaining({ code: CaatingaErrorCode.CONTRACT_ID_NOT_FOUND })
);
```

Use the existing fixture-loading helper if present.

- [ ] **Step 8: Test version parser against version fixtures**

In `packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts`, include:

```ts
expect(parseStellarCliVersion(v24Version)).toBe("24.0.0");
expect(parseStellarCliVersion(v25Version)).toBe("25.2.0");
```

- [ ] **Step 9: Verify parser coverage**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- parse-contract-id.test.ts parse-stellar-cli-version.fixtures.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add packages/core/test/fixtures/stellar-cli packages/core/src/stellar-cli/parse-contract-id.test.ts packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts
git commit -m "test(core): cover stellar cli parser fixtures"
```

### Task 6: Validate Package Manifests and Consumer Gates

**Files:**
- Modify if tests fail: `package.json`
- Modify if tests fail: `packages/core/package.json`
- Modify if tests fail: `packages/cli/package.json`
- Modify if tests fail: `packages/client/package.json`
- Modify if tests fail: `scripts/consumer-isolation-test.sh`
- Modify if tests fail: `scripts/consumer-client-bundlers-test.sh`
- Test: `packages/core/src/release/package-manifest.test.ts`

- [ ] **Step 1: Verify package manifest contracts**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- package-manifest.test.ts
```

Expected: PASS. If it fails, fix each package manifest to use:

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist"
  ]
}
```

For `packages/cli/package.json`, also preserve:

```json
{
  "bin": {
    "caatinga": "./dist/index.js"
  }
}
```

- [ ] **Step 2: Build and pack snapshots**

Run:

```bash
rtk pnpm build
rtk pnpm ci:snapshot-pack
```

Expected: `packed/` contains tarballs for `@caatinga/core`, `@caatinga/client`, and `@caatinga/cli`.

- [ ] **Step 3: Run consumer isolation**

Run:

```bash
rtk pnpm test:consumer
```

Expected:

```txt
npx caatinga --version
npx caatinga init test-app --template react-vite-counter
generated app build succeeds outside the workspace
```

If `caatinga init` generates old target paths, return to Task 3 and fix template packaging.

- [ ] **Step 4: Run client bundler consumers**

Run:

```bash
rtk pnpm test:consumer:client-bundlers
```

Expected: both Vite and webpack sample consumers install tarballs and build.

- [ ] **Step 5: Run publish matrix**

Run:

```bash
rtk pnpm ci:publish-matrix
```

Expected: build, tests, snapshot pack, dry-run publish, consumer isolation, and client bundler checks all pass.

- [ ] **Step 6: Commit fixes only if files changed**

```bash
git add package.json packages/core/package.json packages/cli/package.json packages/client/package.json scripts/consumer-isolation-test.sh scripts/consumer-client-bundlers-test.sh packages/core/src/release/package-manifest.test.ts
git commit -m "fix(release): validate consumer publish gates"
```

If no files changed, do not create an empty commit.

### Task 7: Validate Testnet Smoke Gate

**Files:**
- Modify: `.github/workflows/testnet-smoke.yml`
- Modify: `scripts/testnet-smoke.sh`
- Modify: `packages/core/src/ci/is-transient-testnet-smoke-failure.ts`
- Modify: `packages/core/src/ci/is-transient-testnet-smoke-failure.test.ts`
- Modify: `docs/release/v1-readiness.md`
- Modify: `docs/release/v1.0.0.md`

- [ ] **Step 1: Inspect smoke script**

Run:

```bash
rtk sed -n '1,260p' scripts/testnet-smoke.sh
```

Expected: script runs `caatinga init`, `caatinga build counter`, `caatinga deploy counter --network testnet --source "$CI_IDENTITY"`, `caatinga generate counter --network testnet`, and `caatinga invoke counter.increment --network testnet --source "$CI_IDENTITY"` or their current equivalent using `CAATINGA_CI_IDENTITY_ALIAS`.

- [ ] **Step 2: Ensure identity handling is explicit**

In `scripts/testnet-smoke.sh`, ensure this guard exists near the top:

```bash
: "${CAATINGA_CI_IDENTITY_ALIAS:?Set CAATINGA_CI_IDENTITY_ALIAS to a Stellar CLI identity alias provisioned in the runner config.}"
CI_IDENTITY="$CAATINGA_CI_IDENTITY_ALIAS"
```

Do not write or echo secret keys.

- [ ] **Step 3: Ensure command sequence validates exit codes**

Use normal shell strict mode:

```bash
set -euo pipefail
```

Ensure commands are not hidden behind `|| true` except around the top-level transient classifier.

- [ ] **Step 4: Ensure artifacts validate contract id**

After deploy, verify `caatinga.artifacts.json` contains a contract id:

```bash
node -e 'const fs=require("fs"); const a=JSON.parse(fs.readFileSync("caatinga.artifacts.json","utf8")); const id=a.contracts?.counter?.networks?.testnet?.contractId ?? a.contracts?.counter?.contractId; if (!id || typeof id !== "string") { throw new Error("Missing counter contractId in caatinga.artifacts.json"); } console.log(id);'
```

If the artifact schema uses a different stable path, update this check to that exact schema path and add a comment naming the schema file.

- [ ] **Step 5: Test transient classifier**

In `packages/core/src/ci/is-transient-testnet-smoke-failure.test.ts`, ensure these cases return `true`:

```ts
expect(isTransientTestnetSmokeFailure("timeout while connecting to horizon")).toBe(true);
expect(isTransientTestnetSmokeFailure("503 Service Unavailable")).toBe(true);
expect(isTransientTestnetSmokeFailure("ECONNRESET")).toBe(true);
```

and these return `false`:

```ts
expect(isTransientTestnetSmokeFailure("CAATINGA_UNSUPPORTED_CLI_VERSION")).toBe(false);
expect(isTransientTestnetSmokeFailure("CAATINGA_INVALID_CONFIG")).toBe(false);
```

- [ ] **Step 6: Document CI identity provisioning**

In release docs, add:

```txt
Testnet smoke CI expects CAATINGA_CI_IDENTITY_ALIAS to name a Stellar CLI identity alias available in the restored Stellar CLI config. The workflow restores that config from the CAATINGA_CI_STELLAR_CONFIG_B64 GitHub secret into $HOME/.config/stellar/config.toml. Do not commit secret keys. Rotate the identity if the secret is exposed.
```

- [ ] **Step 7: Verify local tests**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- is-transient-testnet-smoke-failure.test.ts
rtk bash -n scripts/testnet-smoke.sh
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/testnet-smoke.yml scripts/testnet-smoke.sh packages/core/src/ci/is-transient-testnet-smoke-failure.ts packages/core/src/ci/is-transient-testnet-smoke-failure.test.ts docs/release/v1-readiness.md docs/release/v1.0.0.md
git commit -m "fix(ci): harden testnet smoke gate"
```

### Task 8: Close Multi-Contract Demonstration Gate

**Files:**
- Modify: `packages/templates/marketplace-with-token/caatinga.config.ts`
- Modify: `packages/templates/marketplace-with-token/README.md`
- Modify: `packages/templates/marketplace-with-token/caatinga.template.json`
- Modify: `packages/core/src/templates/official-templates-manifest.test.ts`
- Modify: `packages/core/src/contracts/deploy-contract-graph.test.ts`
- Modify: `packages/core/src/contracts/resolve-deploy-args.test.ts`

- [ ] **Step 1: Preserve existing template instead of creating a duplicate**

Use `packages/templates/marketplace-with-token/` as the official multi-contract template unless the owner explicitly asks for the new directory name `multi-contract-token-marketplace`.

- [ ] **Step 2: Ensure config demonstrates dependency injection**

In `packages/templates/marketplace-with-token/caatinga.config.ts`, ensure:

```ts
marketplace: {
  path: "./contracts/marketplace",
  wasm: "./contracts/marketplace/target/wasm32v1-none/release/marketplace.wasm",
  dependsOn: ["token"],
  deployArgs: {
    tokenContractId: "${contracts.token.contractId}"
  }
}
```

- [ ] **Step 3: Ensure deploy graph test proves order**

In `packages/core/src/contracts/deploy-contract-graph.test.ts`, keep or add an assertion that deploying the graph calls token before marketplace:

```ts
expect(deployCalls.map((call) => call.contractName)).toEqual(["token", "marketplace"]);
```

Use the existing mock shape in the file.

- [ ] **Step 4: Ensure deploy arg resolver test proves placeholder replacement**

In `packages/core/src/contracts/resolve-deploy-args.test.ts`, assert:

```ts
expect(result).toEqual({
  tokenContractId: "CTOKENCONTRACTID"
});
```

for a marketplace config containing:

```ts
deployArgs: {
  tokenContractId: "${contracts.token.contractId}"
}
```

- [ ] **Step 5: Ensure artifact graph is saved**

In `packages/core/src/contracts/deploy-contract-graph.test.ts`, assert the resulting artifact contains dependency metadata equivalent to:

```ts
expect(artifacts.contracts.marketplace.dependsOn).toEqual(["token"]);
```

Use the actual artifact property names from `packages/core/src/artifacts/artifact.schema.ts`.

- [ ] **Step 6: Verify template registration**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- official-templates-manifest.test.ts deploy-contract-graph.test.ts resolve-deploy-args.test.ts
```

Expected: PASS and the official templates manifest includes `marketplace-with-token`.

- [ ] **Step 7: Commit**

```bash
git add packages/templates/marketplace-with-token packages/core/src/templates/official-templates-manifest.test.ts packages/core/src/contracts/deploy-contract-graph.test.ts packages/core/src/contracts/resolve-deploy-args.test.ts
git commit -m "test(core): close multi-contract template gate"
```

### Task 9: Complete Public Error Surface Audit

**Files:**
- Modify: `packages/core/src/errors/CaatingaErrorCode.ts`
- Modify: `docs/errors.md`
- Modify: `packages/core/src/errors/error-codes.test.ts`
- Modify: `packages/core/src/errors/error-surface.test.ts`
- Modify: `packages/core/test/errors/caatinga-error-code.test.ts`
- Modify as needed: `packages/core/src/**/*.test.ts`
- Modify as needed: `packages/cli/src/**/*.test.ts`

- [ ] **Step 1: List public error codes**

Run:

```bash
rtk sed -n '1,220p' packages/core/src/errors/CaatingaErrorCode.ts
rtk rg -n "CAATINGA_[A-Z0-9_]+" docs/errors.md packages/core/src packages/cli/src
```

Expected: every public code starts with `CAATINGA_`.

- [ ] **Step 2: Ensure docs cover every code**

In `docs/errors.md`, include one table row per value in `CaatingaErrorCode`. Each row must include:

```txt
Code | Meaning | Common cause | User action | CI/release action | Versioning note
```

For versioning, use:

```txt
Public code; adding a new code is minor, removal/rename/meaning change is major.
```

- [ ] **Step 3: Ensure every documented code exists**

In `packages/core/src/errors/error-codes.test.ts`, preserve or add:

```ts
const documentedCodes = readFileSync("docs/errors.md", "utf8").match(/CAATINGA_[A-Z0-9_]+/g) ?? [];
const codeValues = new Set(Object.values(CaatingaErrorCode));

for (const documentedCode of documentedCodes) {
  expect(codeValues.has(documentedCode as CaatingaErrorCodeValue)).toBe(true);
}
```

Adapt imports to existing file style.

- [ ] **Step 4: Ensure every enum code is documented**

In the same test file, preserve or add:

```ts
const docs = readFileSync("docs/errors.md", "utf8");

for (const code of Object.values(CaatingaErrorCode)) {
  expect(docs).toContain(code);
}
```

- [ ] **Step 5: Ensure every code prefix is valid**

In `packages/core/test/errors/caatinga-error-code.test.ts`, preserve or add:

```ts
for (const code of Object.values(CaatingaErrorCode)) {
  expect(code.startsWith("CAATINGA_")).toBe(true);
}
```

- [ ] **Step 6: Ensure every code has a trigger test**

Use existing test names where possible. If a code lacks any test that triggers it, add the smallest focused test in the owning module. Example for `CAATINGA_CONTRACT_ID_NOT_FOUND`:

```ts
expect(() => parseContractId("deploy finished without id")).toThrow(
  expect.objectContaining({ code: CaatingaErrorCode.CONTRACT_ID_NOT_FOUND })
);
```

Do not create artificial tests that only instantiate `new CaatingaError(...)`; trigger the actual production path.

- [ ] **Step 7: Verify error surface**

Run:

```bash
rtk pnpm --filter @caatinga/core test -- error-codes.test.ts error-surface.test.ts caatinga-error-code.test.ts
rtk pnpm test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/errors/CaatingaErrorCode.ts docs/errors.md packages/core/src/errors/error-codes.test.ts packages/core/src/errors/error-surface.test.ts packages/core/test/errors/caatinga-error-code.test.ts packages/core/src packages/cli/src
git commit -m "test(core): audit public error surface"
```

### Task 10: Full P0-P3 Verification Gate

**Files:**
- No planned edits.

- [ ] **Step 1: Verify no invalid Zod inference remains**

Run:

```bash
rtk rg -n "z\\.infer;" packages
```

Expected: no matches.

- [ ] **Step 2: Verify no obsolete target remains in relevant files**

Run:

```bash
rtk rg -n "wasm32-unknown-unknown" README.md docs packages scripts .github
```

Expected: no matches except intentionally historical changelog lines. If any active docs/code/template/test match, return to Task 3.

- [ ] **Step 3: Run typecheck**

Run:

```bash
rtk pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
rtk pnpm build
```

Expected: PASS.

- [ ] **Step 5: Run tests**

Run:

```bash
rtk pnpm test
```

Expected: PASS.

- [ ] **Step 6: Run consumer gates**

Run:

```bash
rtk pnpm test:consumer
rtk pnpm test:consumer:client-bundlers
```

Expected: PASS.

- [ ] **Step 7: Run full publish matrix**

Run:

```bash
rtk pnpm ci:publish-matrix
```

Expected: PASS.

- [ ] **Step 8: Record verification result**

Add a dated note to `docs/release/v1-readiness.md`:

```txt
YYYY-MM-DD operational stability gate:
- pnpm typecheck: pass
- pnpm build: pass
- pnpm test: pass
- pnpm test:consumer: pass
- pnpm test:consumer:client-bundlers: pass
- pnpm ci:publish-matrix: pass
```

Use the real date and only mark a command `pass` after seeing it pass.

- [ ] **Step 9: Commit verification note**

```bash
git add docs/release/v1-readiness.md
git commit -m "docs(release): record operational stability gate"
```

## Rollout and Rollback

- Rollout: merge after Task 10 passes locally and GitHub Actions lists CI, release, and testnet smoke workflows correctly.
- Rollback: revert the smallest failing commit. Reverting Task 3 requires also reverting any templates generated or docs changed for `wasm32v1-none`; do not partially roll back the target constant without tests/docs.
- Production owner: release owner for npm publishing and CI owner for GitHub Actions secrets.
- Observability: GitHub Actions status, smoke artifact upload, consumer isolation logs, and explicit `CAATINGA_*` error codes.

## Self-Review

- Spec coverage: P0 is covered by Tasks 1-3 and 10; P1 by Task 3; P2 by Tasks 4-6; P3 by Task 6; P4 by Task 7; P5 by Task 8; P6 by Task 9.
- Intentional policy call: newer-than-tested Stellar CLI versions use `CAATINGA_UNTESTED_CLI_VERSION`, not `CAATINGA_UNSUPPORTED_CLI_VERSION`, because the codebase already exposes separate public codes for old unsupported and new unverified versions.
- Existing asset call: use `packages/templates/marketplace-with-token/` instead of creating a duplicate template because the repo already contains the multi-contract template requested by the spec.
- Placeholder scan: no `TBD`, `TODO`, `implement later`, or prose-only test instructions remain.
- Non-goals preserved: no wallets, VS Code extension, hosted RPC, template registry, branding, or new client feature work.
