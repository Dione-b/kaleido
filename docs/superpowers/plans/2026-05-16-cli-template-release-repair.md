# CLI Template Release Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare a `0.1.3` lockstep release for `@caatinga/cli`, `@caatinga/core`, and `@caatinga/client` that proves `caatinga init` works from packed consumer artifacts without `CAATINGA_TEMPLATES_DIR`.

**Architecture:** Harden the release gates instead of changing runtime behavior first: fail fast when the CLI tarball omits bundled templates, run the consumer-isolation flow exactly as a real consumer would, then generate a fixed-version patch release through Changesets. Verification is the product here, so the plan ends only after fresh pack and consumer evidence succeeds.

**Tech Stack:** Bash, pnpm, Changesets, npm tarballs, Vitest/Turbo workspace scripts

---

### Task 1: Lock the release gates to the real consumer contract

**Files:**
- Modify: `scripts/consumer-isolation-test.sh`
- Modify: `scripts/ci-snapshot-pack.sh`

- [ ] **Step 1: Write the failing verification target**

Document the contract to prove with shell checks:

```bash
bash -n scripts/consumer-isolation-test.sh
bash -n scripts/ci-snapshot-pack.sh
bash scripts/ci-snapshot-pack.sh
```

Expected before the fix: snapshot-pack would not fail if the CLI tarball omitted `package/templates/react-vite-counter/caatinga.template.json`, and consumer isolation would still bypass the failure through `CAATINGA_TEMPLATES_DIR`.

- [ ] **Step 2: Run the current checks to verify the gap exists**

Run:

```bash
bash -n scripts/consumer-isolation-test.sh
bash -n scripts/ci-snapshot-pack.sh
bash scripts/ci-snapshot-pack.sh
```

Expected: shell syntax passes; the script behavior still needs to be hardened to enforce bundled templates and a no-bypass consumer flow.

- [ ] **Step 3: Implement the minimal gate hardening**

Keep these exact behaviors in the scripts:

```bash
# scripts/consumer-isolation-test.sh
_kcore=( "$PACKED_DIR"/caatinga-core-*.tgz )
_kclient=( "$PACKED_DIR"/caatinga-client-*.tgz )
_kcli=( "$PACKED_DIR"/caatinga-cli-*.tgz )
if [[ ${#_kcore[@]} -eq 0 || ${#_kclient[@]} -eq 0 || ${#_kcli[@]} -eq 0 ]]; then
  echo "Missing packed tarballs in $PACKED_DIR" >&2
  exit 1
fi

if ! tar -tzf "${_kcli[0]}" | grep -q '^package/templates/react-vite-counter/caatinga.template.json$'; then
  echo "CLI tarball is missing bundled templates: ${_kcli[0]}" >&2
  exit 1
fi

npm install "${_kcore[0]}" "${_kclient[0]}" "${_kcli[0]}"
```

```bash
# scripts/ci-snapshot-pack.sh
shopt -s nullglob
cli_tarball=( "$PACKED_DIR"/caatinga-cli-*.tgz )
if [[ ${#cli_tarball[@]} -eq 0 ]]; then
  echo "Missing CLI tarball in $PACKED_DIR" >&2
  exit 1
fi

if ! tar -tzf "${cli_tarball[0]}" | grep -q '^package/templates/react-vite-counter/caatinga.template.json$'; then
  echo "CLI tarball is missing bundled templates: ${cli_tarball[0]}" >&2
  exit 1
fi
```

- [ ] **Step 4: Run the gate checks again**

Run:

```bash
bash -n scripts/consumer-isolation-test.sh
bash -n scripts/ci-snapshot-pack.sh
bash scripts/ci-snapshot-pack.sh
```

Expected: all commands pass, and `ci-snapshot-pack` prints the CLI tarball contents including `templates/react-vite-counter/caatinga.template.json`.

- [ ] **Step 5: Commit**

```bash
git add scripts/consumer-isolation-test.sh scripts/ci-snapshot-pack.sh
git commit -m "fix: harden CLI release template validation"
```

### Task 2: Create the `0.1.3` fixed-version release bump

**Files:**
- Create: `.changeset/cli-template-release-repair.md`
- Modify: `packages/cli/package.json`
- Modify: `packages/core/package.json`
- Modify: `packages/client/package.json`
- Modify: `packages/cli/CHANGELOG.md`
- Modify: `packages/core/CHANGELOG.md`
- Modify: `packages/client/CHANGELOG.md`

- [ ] **Step 1: Write the failing release-prep target**

Run:

```bash
pnpm exec changeset status
```

Expected before the new changeset: no pending release note exists for the `0.1.3` repair, so the repository cannot produce the intended lockstep bump.

- [ ] **Step 2: Add the patch changeset**

Create `.changeset/cli-template-release-repair.md` with:

```md
---
"@caatinga/cli": patch
"@caatinga/core": patch
"@caatinga/client": patch
---

fix release validation so packed CLI tarballs must include bundled templates and consumer init is exercised without CAATINGA_TEMPLATES_DIR
```

- [ ] **Step 3: Generate the version bump and changelogs**

Run:

```bash
pnpm exec changeset version
```

Expected: the fixed package set advances together to `0.1.3`, and changelogs receive the new patch entry.

- [ ] **Step 4: Verify the version bump landed consistently**

Run:

```bash
rg -n '"version": "0.1.3"' packages/cli/package.json packages/core/package.json packages/client/package.json
sed -n '1,80p' packages/cli/CHANGELOG.md
sed -n '1,80p' packages/core/CHANGELOG.md
sed -n '1,80p' packages/client/CHANGELOG.md
```

Expected: all three package manifests report `0.1.3`, and each changelog contains the release note for this repair.

- [ ] **Step 5: Commit**

```bash
git add .changeset packages/cli/package.json packages/core/package.json packages/client/package.json packages/cli/CHANGELOG.md packages/core/CHANGELOG.md packages/client/CHANGELOG.md
git commit -m "chore: version packages for 0.1.3 release repair"
```

### Task 3: Prove the release evidence on fresh artifacts

**Files:**
- Verify only: repository root scripts and package artifacts

- [ ] **Step 1: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: exit code `0`.

- [ ] **Step 2: Run build**

Run:

```bash
pnpm build
```

Expected: exit code `0`.

- [ ] **Step 3: Run test suite**

Run:

```bash
pnpm test
```

Expected: exit code `0`.

- [ ] **Step 4: Run packed artifact validation**

Run:

```bash
pnpm ci:snapshot-pack
```

Expected: exit code `0` and explicit tarball evidence that the CLI package includes `templates/react-vite-counter/caatinga.template.json`.

- [ ] **Step 5: Run the real consumer-isolation flow**

Run:

```bash
NPM_CONFIG_CACHE=/tmp/caatinga-npm-cache bash scripts/consumer-isolation-test.sh
```

Expected: exit code `0`; `npx caatinga init test-app --template react-vite-counter` succeeds without `CAATINGA_TEMPLATES_DIR`; generated app builds successfully.

- [ ] **Step 6: Record the handoff commands**

Prepare the exact non-executed publish command for the release owner:

```bash
pnpm publish -r --access public --no-git-checks --tag next
```

Expected: command is documented for handoff only; do not run it in this workstream.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: prepare 0.1.3 release evidence"
```
