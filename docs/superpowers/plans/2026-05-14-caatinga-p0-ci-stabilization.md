# Caatinga P0 CI Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Caatinga repository compile, run CI, use the current Wasm target, expose only `CAATINGA_*` public error codes, validate template manifests during `init`, centralize the core version, and keep an initial Stellar CLI version parser contract.

**Architecture:** Keep changes inside the existing packages and public contracts. Treat `CaatingaErrorCode` values as the public API, keep template validation in `@caatinga/core` before filesystem copy, and keep CLI command registration thin. Do not introduce B1 features beyond the initial parser/version-check foundation already present.

**Tech Stack:** pnpm 9, Node.js 20, TypeScript, Zod, Vitest, Turbo, GitHub Actions YAML, semver.

---

## Scope Boundaries

The spec is supplied in the user request. Code may be read because the spec exists.

Out of scope for this plan: `@caatinga/client`, `@caatinga/react`, `caatinga doctor`, multi-contract `dependsOn` expansion, testnet smoke CI, npm publish pipeline expansion, CLI XDR commands, and template registry.

Current-state observations to preserve:

- `packages/core/src/config/config.schema.ts` already exports `z.infer<typeof ...>` types.
- `packages/core/src/templates/template-manifest.schema.ts` already exports `TemplateManifest = z.infer<typeof TemplateManifestSchema>`.
- `.github/workflows/ci.yml` is multiline YAML, but it includes extra release/consumer steps beyond the requested minimum.
- Documentation already uses `wasm32v1-none` in the requested files.
- Template manifest validation already happens in `packages/core/src/templates/create-project-from-template.ts` before copying files.
- Stellar CLI parser and version checking already exist in `packages/core/src/stellar-cli/version.ts` and related tests.
- The main contract mismatch found during planning is `TEMPLATE_INVALID`/`CAATINGA_TEMPLATE_INVALID` versus the requested `INVALID_TEMPLATE_MANIFEST`/`CAATINGA_INVALID_TEMPLATE_MANIFEST`.

## File Structure

- Modify `.github/workflows/ci.yml`: keep CI YAML valid and reduce to the requested P0 minimum unless the project owner explicitly chooses to preserve release/consumer checks here.
- Verify `packages/core/src/config/config.schema.ts`: maintain inferred config type exports.
- Verify `packages/core/src/templates/template-manifest.schema.ts`: maintain manifest type export and move the hardcoded core version into `version.ts`.
- Create `packages/core/src/version.ts`: central owner for `CAATINGA_CORE_VERSION`.
- Modify `packages/core/src/templates/template-manifest.schema.test.ts`: assert default compatibility uses the centralized core version.
- Modify `packages/core/src/errors/CaatingaErrorCode.ts`: rename public invalid-template-manifest code.
- Modify `packages/core/src/templates/create-project-from-template.ts`: throw `CaatingaErrorCode.INVALID_TEMPLATE_MANIFEST` for invalid manifest JSON/schema.
- Modify `packages/core/src/templates/create-project-from-template.test.ts`: expect `INVALID_TEMPLATE_MANIFEST`.
- Modify `packages/core/src/errors/error-surface.test.ts`: require `CAATINGA_INVALID_TEMPLATE_MANIFEST`.
- Modify `docs/errors.md`: document `CAATINGA_INVALID_TEMPLATE_MANIFEST` and remove `CAATINGA_TEMPLATE_INVALID`.
- Add `packages/core/test/errors/caatinga-error-code.test.ts`: spec-requested prefix test path.
- Verify `packages/core/src/stellar-cli/version.ts`: preserve parser and error behavior.
- Verify `packages/core/src/stellar-cli/check-stellar-cli-version.ts`: preserve current foundation without adding command blocking beyond existing wiring.
- Verify `packages/core/src/stellar-cli/check-stellar-cli-version.test.ts` and `packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts`: ensure examples cover current `stellar --version` outputs.

---

### Task 1: Verify And Lock `z.infer` Type Exports

**Files:**
- Verify: `packages/core/src/config/config.schema.ts`
- Verify: `packages/core/src/templates/template-manifest.schema.ts`
- Verify: `packages/core/src/config/schema-type-exports.test.ts`

- [ ] **Step 1: Inspect current schema type exports**

Run:

```bash
sed -n '1,220p' packages/core/src/config/config.schema.ts
sed -n '1,220p' packages/core/src/templates/template-manifest.schema.ts
```

Expected: the files contain these exact type exports:

```ts
export type CaatingaConfig = z.infer<typeof CaatingaConfigSchema>;
export type ContractConfig = z.infer<typeof ContractConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
```

```ts
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
```

- [ ] **Step 2: If a bare `z.infer` export exists, replace it with the exact inferred exports**

Use this block at the bottom of `packages/core/src/config/config.schema.ts`:

```ts
export type CaatingaConfig = z.infer<typeof CaatingaConfigSchema>;
export type ContractConfig = z.infer<typeof ContractConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
```

Use this block at the bottom of `packages/core/src/templates/template-manifest.schema.ts`:

```ts
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
```

- [ ] **Step 3: Run the existing guard test**

Run:

```bash
pnpm --filter @caatinga/core test -- src/config/schema-type-exports.test.ts
```

Expected: PASS. If it fails, the output lists the schema file and invalid export.

- [ ] **Step 4: Commit only if files changed**

Run:

```bash
git status --short
git add packages/core/src/config/config.schema.ts packages/core/src/templates/template-manifest.schema.ts packages/core/src/config/schema-type-exports.test.ts
git commit -m "fix(core): use inferred zod schema types"
```

Expected: commit succeeds only when the working tree has changes from this task. If `git status --short` is empty, do not create an empty commit.

---

### Task 2: Normalize CI Workflow YAML To P0 Minimum

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace `.github/workflows/ci.yml` with the P0 workflow**

Use this exact file content:

```yaml
name: CI

on:
  push:
    branches:
      - master
      - main
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

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

- [ ] **Step 2: Validate YAML is multiline and GitHub Actions compatible by inspection**

Run:

```bash
sed -n '1,120p' .github/workflows/ci.yml
```

Expected: output starts with `name: CI`, contains multiline `on.push.branches`, and contains `pull_request:`.

- [ ] **Step 3: Commit**

Run:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: restore minimal CI workflow"
```

Expected: commit succeeds. If project ownership requires preserving release/consumer checks, stop and escalate because that contradicts the requested P0-minimum workflow.

---

### Task 3: Verify Wasm Target Documentation

**Files:**
- Verify: `README.md`
- Verify: `docs/getting-started.md`
- Verify: `docs/config.md`
- Verify: `packages/templates/react-vite-counter/README.md`
- Verify: `packages/templates/react-vite-counter/caatinga.config.ts`

- [ ] **Step 1: Search for the old Wasm target**

Run:

```bash
grep -R "wasm32-unknown-unknown" README.md docs packages/templates/react-vite-counter
```

Expected: no output and exit code `1`.

- [ ] **Step 2: If the old target appears, replace it with the current target**

Use these exact replacements:

```txt
wasm32-unknown-unknown -> wasm32v1-none
rustup target add wasm32-unknown-unknown -> rustup target add wasm32v1-none
target/wasm32-unknown-unknown/release -> target/wasm32v1-none/release
```

Required path example:

```ts
wasm: "./contracts/counter/target/wasm32v1-none/release/counter.wasm"
```

- [ ] **Step 3: Verify the expected current target appears**

Run:

```bash
grep -R "wasm32v1-none" README.md docs/getting-started.md docs/config.md packages/templates/react-vite-counter/README.md packages/templates/react-vite-counter/caatinga.config.ts
```

Expected: output includes `rustup target add wasm32v1-none` and Wasm paths under `target/wasm32v1-none/release`.

- [ ] **Step 4: Commit only if files changed**

Run:

```bash
git status --short
git add README.md docs/getting-started.md docs/config.md packages/templates/react-vite-counter/README.md packages/templates/react-vite-counter/caatinga.config.ts
git commit -m "docs: use wasm32v1-none target"
```

Expected: commit succeeds only when the working tree has changes from this task.

---

### Task 4: Run Typecheck

**Files:**
- Verify: repository TypeScript project references and package builds

- [ ] **Step 1: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS. No TypeScript errors.

- [ ] **Step 2: If typecheck fails from `z.infer`, return to Task 1**

Expected failure shape:

```txt
error TS2314: Generic type 'infer' requires 1 type argument(s).
```

Required fix remains:

```ts
export type CaatingaConfig = z.infer<typeof CaatingaConfigSchema>;
export type ContractConfig = z.infer<typeof ContractConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
```

---

### Task 5: Run Build

**Files:**
- Verify: all package build outputs

- [ ] **Step 1: Run build**

Run:

```bash
pnpm build
```

Expected: PASS. Turbo completes package builds without TypeScript or bundling failures.

---

### Task 6: Run Tests

**Files:**
- Verify: all Vitest suites

- [ ] **Step 1: Run test suite**

Run:

```bash
pnpm test
```

Expected: PASS. Existing template, error, config, Stellar CLI, contract, and client tests pass.

---

### Task 7: Rename Invalid Template Manifest Public Error Code

**Files:**
- Modify: `packages/core/src/errors/CaatingaErrorCode.ts`
- Modify: `packages/core/src/templates/create-project-from-template.ts`
- Modify: `packages/core/src/templates/create-project-from-template.test.ts`
- Modify: `packages/core/src/errors/error-surface.test.ts`
- Modify: `docs/errors.md`

- [ ] **Step 1: Update the public error enum**

In `packages/core/src/errors/CaatingaErrorCode.ts`, replace:

```ts
  TEMPLATE_INVALID: "CAATINGA_TEMPLATE_INVALID",
```

with:

```ts
  INVALID_TEMPLATE_MANIFEST: "CAATINGA_INVALID_TEMPLATE_MANIFEST",
```

- [ ] **Step 2: Update invalid manifest throws**

In `packages/core/src/templates/create-project-from-template.ts`, replace:

```ts
        CaatingaErrorCode.TEMPLATE_INVALID,
```

with:

```ts
        CaatingaErrorCode.INVALID_TEMPLATE_MANIFEST,
```

There are two invalid-manifest branches covered by one catch block: JSON syntax errors and Zod schema errors.

- [ ] **Step 3: Update template manifest tests**

In `packages/core/src/templates/create-project-from-template.test.ts`, replace both expected codes:

```ts
      code: CaatingaErrorCode.TEMPLATE_INVALID,
      message: "Template manifest is invalid."
```

with:

```ts
      code: CaatingaErrorCode.INVALID_TEMPLATE_MANIFEST,
      message: "Template manifest is invalid."
```

- [ ] **Step 4: Update required error surface test**

In `packages/core/src/errors/error-surface.test.ts`, replace:

```ts
  "CAATINGA_TEMPLATE_INVALID",
```

with:

```ts
  "CAATINGA_INVALID_TEMPLATE_MANIFEST",
```

- [ ] **Step 5: Update error docs**

In `docs/errors.md`, replace the table row for `CAATINGA_TEMPLATE_INVALID` with:

```md
| `CAATINGA_INVALID_TEMPLATE_MANIFEST` | Template manifest exists but cannot be parsed or validated. | `JSON.parse` threw (`SyntaxError`) or `TemplateManifestSchema` rejected the document (`ZodError`) — not version/compatibility mismatches after a successful parse. | Fix `caatinga.template.json` so it is valid JSON and matches the template manifest schema. | Fail CI and block publishing the template package. | Public code; rename/removal is major. |
```

- [ ] **Step 6: Search for old and raw error codes**

Run:

```bash
rg -n "TEMPLATE_INVALID|CAATINGA_TEMPLATE_INVALID|CONFIG_NOT_FOUND|CONFIG_INVALID|COMMAND_FAILED|CONTRACT_ID_NOT_FOUND|SOURCE_ACCOUNT_REQUIRED|SECRET_SOURCE_REJECTED" packages docs README.md
```

Expected: no `TEMPLATE_INVALID` or `CAATINGA_TEMPLATE_INVALID` occurrences. Other strings may appear as enum member names, docs text, or spec docs; no `new CaatingaError(...)` call may use a raw string code.

- [ ] **Step 7: Run focused error tests**

Run:

```bash
pnpm --filter @caatinga/core test -- src/errors/error-surface.test.ts src/errors/error-codes.test.ts src/templates/create-project-from-template.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/src/errors/CaatingaErrorCode.ts packages/core/src/templates/create-project-from-template.ts packages/core/src/templates/create-project-from-template.test.ts packages/core/src/errors/error-surface.test.ts docs/errors.md
git commit -m "fix(core): expose invalid template manifest error code"
```

Expected: commit succeeds.

---

### Task 8: Add Spec-Requested `CAATINGA_*` Prefix Test Path

**Files:**
- Create: `packages/core/test/errors/caatinga-error-code.test.ts`

- [ ] **Step 1: Create test directory**

Run:

```bash
mkdir -p packages/core/test/errors
```

- [ ] **Step 2: Add prefix test file**

Create `packages/core/test/errors/caatinga-error-code.test.ts` with this exact content:

```ts
import { describe, expect, it } from "vitest";
import { CaatingaErrorCode } from "../../src/errors/CaatingaError.js";

describe("CaatingaErrorCode", () => {
  it("all public error codes use CAATINGA_ prefix", () => {
    for (const code of Object.values(CaatingaErrorCode)) {
      expect(code.startsWith("CAATINGA_")).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run the new test**

Run:

```bash
pnpm --filter @caatinga/core test -- test/errors/caatinga-error-code.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/test/errors/caatinga-error-code.test.ts
git commit -m "test(core): assert public error code prefix"
```

Expected: commit succeeds.

---

### Task 9: Verify `init` Validates `caatinga.template.json` Before Copy

**Files:**
- Verify: `packages/core/src/templates/create-project-from-template.ts`
- Verify: `packages/core/src/templates/create-project-from-template.test.ts`
- Verify: `packages/templates/react-vite-counter/caatinga.template.json`
- Verify: `packages/templates/marketplace-with-token/caatinga.template.json`

- [ ] **Step 1: Confirm validation order in core**

Run:

```bash
sed -n '1,130p' packages/core/src/templates/create-project-from-template.ts
```

Expected order in `createProjectFromTemplate`:

```ts
  const targetDir = path.resolve(options.targetDir);
  const templateDir = path.resolve(options.templateDir);
```

then template directory `stat`, then:

```ts
  const manifest = await readTemplateManifest(templateDir);
```

then:

```ts
  await mkdir(targetDir, { recursive: true });
  await cp(templateDir, targetDir, {
    recursive: true,
    force: false,
    errorOnExist: true
  });
```

- [ ] **Step 2: Confirm required error codes**

The same file must throw these codes:

```ts
CaatingaErrorCode.TEMPLATE_MANIFEST_NOT_FOUND
CaatingaErrorCode.TEMPLATE_INCOMPATIBLE
CaatingaErrorCode.INVALID_TEMPLATE_MANIFEST
```

- [ ] **Step 3: If validation is after copy, move it before copy**

Use this ordering in `createProjectFromTemplate`:

```ts
  const manifest = await readTemplateManifest(templateDir);

  await mkdir(targetDir, { recursive: true });
  await cp(templateDir, targetDir, {
    recursive: true,
    force: false,
    errorOnExist: true
  });
```

- [ ] **Step 4: Verify missing manifest test**

`packages/core/src/templates/create-project-from-template.test.ts` must include:

```ts
  it("should_fail_when_template_manifest_is_missing", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "caatinga-init-"));
    const templateDir = path.join(tmpDir, "template");
    await mkdir(templateDir);

    await expect(createProjectFromTemplate({
      projectName: "my-dapp",
      targetDir: path.join(tmpDir, "my-dapp"),
      templateDir
    })).rejects.toMatchObject({
      code: CaatingaErrorCode.TEMPLATE_MANIFEST_NOT_FOUND
    });
  });
```

- [ ] **Step 5: Verify incompatible core test**

The same test file must include:

```ts
  it("should_fail_when_template_requires_incompatible_core", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "caatinga-init-"));
    const templateDir = path.join(tmpDir, "template");
    await mkdir(templateDir);
    await writeFile(path.join(templateDir, "caatinga.template.json"), JSON.stringify({
      name: "future-template",
      version: "1.0.0",
      caatinga: {
        compatibleCore: "^99.0.0",
        templateVersion: 1
      },
      frontend: {
        framework: "vite-react",
        packageManager: "npm"
      },
      contracts: {
        path: "contracts"
      },
      files: {
        config: "caatinga.config.ts",
        artifacts: "caatinga.artifacts.json"
      }
    }), "utf8");

    await expect(createProjectFromTemplate({
      projectName: "my-dapp",
      targetDir: path.join(tmpDir, "my-dapp"),
      templateDir
    })).rejects.toMatchObject({
      code: CaatingaErrorCode.TEMPLATE_INCOMPATIBLE
    });
  });
```

- [ ] **Step 6: Verify invalid manifest tests use the renamed code**

Both JSON syntax and schema invalid tests must expect:

```ts
{
  code: CaatingaErrorCode.INVALID_TEMPLATE_MANIFEST,
  message: "Template manifest is invalid."
}
```

- [ ] **Step 7: Run focused template tests**

Run:

```bash
pnpm --filter @caatinga/core test -- src/templates/create-project-from-template.test.ts src/templates/template-manifest.schema.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit only if files changed**

Run:

```bash
git status --short
git add packages/core/src/templates/create-project-from-template.ts packages/core/src/templates/create-project-from-template.test.ts packages/templates/react-vite-counter/caatinga.template.json packages/templates/marketplace-with-token/caatinga.template.json
git commit -m "fix(core): validate template manifests before init copy"
```

Expected: commit succeeds only when this task changed files.

---

### Task 10: Centralize Core Version

**Files:**
- Create: `packages/core/src/version.ts`
- Modify: `packages/core/src/templates/template-manifest.schema.ts`
- Modify: `packages/core/src/templates/template-manifest.schema.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Create the centralized version file**

Create `packages/core/src/version.ts` with this exact content:

```ts
export const CAATINGA_CORE_VERSION = "0.1.0";
```

- [ ] **Step 2: Use the centralized version in template compatibility**

In `packages/core/src/templates/template-manifest.schema.ts`, remove:

```ts
const CURRENT_CORE_VERSION = "0.1.0";
```

Add this import below the existing imports:

```ts
import { CAATINGA_CORE_VERSION } from "../version.js";
```

Change:

```ts
export function isCoreVersionCompatible(range: string, coreVersion = CURRENT_CORE_VERSION): boolean {
  return semver.satisfies(coreVersion, range);
}
```

to:

```ts
export function isCoreVersionCompatible(range: string, coreVersion = CAATINGA_CORE_VERSION): boolean {
  return semver.satisfies(coreVersion, range);
}
```

- [ ] **Step 3: Export the core version from the package entrypoint**

In `packages/core/src/index.ts`, add:

```ts
export { CAATINGA_CORE_VERSION } from "./version.js";
```

Place it near the top-level exports after the error export.

- [ ] **Step 4: Update compatibility tests to assert the default uses the centralized version**

Replace `packages/core/src/templates/template-manifest.schema.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { CAATINGA_CORE_VERSION } from "../version.js";
import { isCoreVersionCompatible } from "./template-manifest.schema.js";

describe("isCoreVersionCompatible", () => {
  it("should_accept_semver_ranges_that_match_core_version", () => {
    expect(isCoreVersionCompatible("^0.1.0", "0.1.0")).toBe(true);
  });

  it("should_reject_semver_ranges_that_do_not_match_core_version", () => {
    expect(isCoreVersionCompatible("^99.0.0", "0.1.0")).toBe(false);
  });

  it("uses the centralized core version by default", () => {
    expect(CAATINGA_CORE_VERSION).toBe("0.1.0");
    expect(isCoreVersionCompatible("^0.1.0")).toBe(true);
  });
});
```

- [ ] **Step 5: Verify there is no hardcoded core runtime version left**

Run:

```bash
rg -n 'CURRENT_CORE_VERSION|CAATINGA_CORE_VERSION|= "0\\.1\\.0"' packages/core/src
```

Expected: only `packages/core/src/version.ts` contains `= "0.1.0"` for the runtime core version. Tests may still contain `"0.1.0"` as fixtures and expected values.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @caatinga/core test -- src/templates/template-manifest.schema.test.ts src/templates/create-project-from-template.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/src/version.ts packages/core/src/templates/template-manifest.schema.ts packages/core/src/templates/template-manifest.schema.test.ts packages/core/src/index.ts
git commit -m "refactor(core): centralize core version"
```

Expected: commit succeeds.

---

### Task 11: Verify Stellar CLI Version Parser Foundation

**Files:**
- Verify: `packages/core/src/stellar-cli/version.ts`
- Verify: `packages/core/src/stellar-cli/check-stellar-cli-version.ts`
- Verify: `packages/core/src/stellar-cli/check-stellar-cli-version.test.ts`
- Verify: `packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts`
- Verify: `packages/core/src/errors/CaatingaErrorCode.ts`
- Optional create only if absent: `packages/core/src/stellar-cli/parse-stellar-version.ts`
- Optional create only if absent: `packages/core/src/stellar-cli/parse-stellar-version.test.ts`

- [ ] **Step 1: Confirm required public error codes exist**

`packages/core/src/errors/CaatingaErrorCode.ts` must include:

```ts
  STELLAR_CLI_VERSION_PARSE_FAILED: "CAATINGA_STELLAR_CLI_VERSION_PARSE_FAILED",
  UNSUPPORTED_CLI_VERSION: "CAATINGA_UNSUPPORTED_CLI_VERSION",
```

- [ ] **Step 2: Confirm parser throws the requested parse-failure code**

`packages/core/src/stellar-cli/version.ts` must include a parser equivalent to:

```ts
export function parseStellarCliVersion(output: string): string {
  const match = output.match(/\d+\.\d+\.\d+/);

  if (!match) {
    throw new CaatingaError(
      "Could not parse Stellar CLI version.",
      CaatingaErrorCode.STELLAR_CLI_VERSION_PARSE_FAILED,
      "Run stellar --version manually and check the output."
    );
  }

  return match[0];
}
```

The current implementation may support prerelease/build metadata with a stricter semver regex. Keep that stronger behavior if tests pass.

- [ ] **Step 3: Confirm parser examples are tested**

`packages/core/src/stellar-cli/check-stellar-cli-version.test.ts` must include:

```ts
  it("parses semver from known Stellar CLI outputs", () => {
    expect(parseStellarCliVersion("stellar 22.0.1")).toBe("22.0.1");
    expect(parseStellarCliVersion("stellar-cli 21.3.0 (build abc123)")).toBe("21.3.0");
    expect(parseStellarCliVersion("Stellar CLI version 22.1.0")).toBe("22.1.0");
  });
```

- [ ] **Step 4: Confirm fixture tests cover checked-in Stellar outputs**

`packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts` must read from:

```ts
const fixturesDir = path.resolve(__dirname, "../../test/fixtures/stellar-cli");
```

and assert:

```ts
expect(parseStellarCliVersion(output)).toBe("22.0.0");
expect(parseStellarCliVersion(output)).toBe("26.0.0");
```

- [ ] **Step 5: Do not add new B1 command blocking**

No new CLI command should be blocked in this task. The acceptable foundation is parser, parse-failure error code, unsupported-version code, and tests. If existing `runCommand` already gates Stellar commands, preserve it; do not expand it.

- [ ] **Step 6: Run focused Stellar CLI tests**

Run:

```bash
pnpm --filter @caatinga/core test -- src/stellar-cli/check-stellar-cli-version.test.ts src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts src/stellar-cli/run-command-version.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit only if files changed**

Run:

```bash
git status --short
git add packages/core/src/stellar-cli/version.ts packages/core/src/stellar-cli/check-stellar-cli-version.ts packages/core/src/stellar-cli/check-stellar-cli-version.test.ts packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts packages/core/src/errors/CaatingaErrorCode.ts
git commit -m "test(core): lock stellar cli version parser"
```

Expected: commit succeeds only when this task changed files.

---

### Task 12: Full Acceptance Verification

**Files:**
- Verify: repository

- [ ] **Step 1: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Run tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Verify old Wasm target is gone from relevant project files**

Run:

```bash
grep -R "wasm32-unknown-unknown" README.md docs packages/templates/react-vite-counter
```

Expected: no output and exit code `1`.

- [ ] **Step 5: Verify no public errors are constructed with raw string codes**

Run:

```bash
rg -n 'new CaatingaError\([\s\S]*,\s*["'\''][A-Z][A-Z0-9_]*["'\'']' packages/core/src packages/cli/src packages/client/src
```

Expected: no output.

- [ ] **Step 6: Verify invalid template manifest code is the public code**

Run:

```bash
rg -n "CAATINGA_TEMPLATE_INVALID|TEMPLATE_INVALID" packages docs README.md
rg -n "CAATINGA_INVALID_TEMPLATE_MANIFEST|INVALID_TEMPLATE_MANIFEST" packages/core/src docs/errors.md
```

Expected: first command has no output. Second command shows enum, throws/tests, and docs.

- [ ] **Step 7: Verify core version centralization**

Run:

```bash
rg -n 'CURRENT_CORE_VERSION|const .*CORE.*VERSION = "0\\.1\\.0"|CAATINGA_CORE_VERSION' packages/core/src
```

Expected: `CAATINGA_CORE_VERSION` is defined in `packages/core/src/version.ts`, imported by `template-manifest.schema.ts`, and exported from `index.ts`. No `CURRENT_CORE_VERSION` remains.

- [ ] **Step 8: Inspect CI workflow**

Run:

```bash
sed -n '1,120p' .github/workflows/ci.yml
```

Expected: workflow triggers on push to `master` and `main`, triggers on `pull_request`, and runs install, typecheck, build, and test.

---

## Self-Review

Spec coverage:

- P0 z.infer: Task 1 verifies and fixes the exact type exports, then Task 4 proves typecheck.
- P0 CI YAML: Task 2 replaces the workflow with valid multiline YAML matching the supplied minimum.
- P0 Wasm target docs: Task 3 verifies and fixes `wasm32v1-none` references.
- P1 CAATINGA errors: Task 7 removes the old invalid template manifest public code, Task 8 adds the requested prefix test, Task 12 verifies no raw string error construction.
- P2 template validation: Task 9 verifies manifest read, schema validation, compatibility validation, and copy order.
- P2 core version: Task 10 creates `CAATINGA_CORE_VERSION` and removes `CURRENT_CORE_VERSION`.
- P3 Stellar CLI parser: Task 11 verifies parser, error codes, and tests without expanding B1 scope.
- Definition of done: Task 12 runs `pnpm typecheck`, `pnpm build`, `pnpm test`, grep checks, raw error checks, version centralization checks, and CI inspection.

Placeholder scan:

- No task asks for undefined error handling or unspecified tests.
- Every code-changing step includes concrete code or exact replacements.
- Conditional commits are explicit: commit only when task files changed.

Type consistency:

- `CaatingaErrorCode.INVALID_TEMPLATE_MANIFEST` maps to `CAATINGA_INVALID_TEMPLATE_MANIFEST`.
- `CAATINGA_CORE_VERSION` is the single runtime constant and is imported by `template-manifest.schema.ts`.
- Parser tests continue to use `parseStellarCliVersion` from the existing `version.ts` module.
