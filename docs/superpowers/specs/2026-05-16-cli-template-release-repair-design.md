# CLI Template Release Repair Design

## Status

Proposed.

## Date

2026-05-16

## Motivation

`npx @caatinga/cli@0.1.0 init my-app` fails for real consumers with `CAATINGA_TEMPLATE_NOT_FOUND` because the published CLI contract was not enforced strongly enough at release time. The repository already contains the template-bundling fix, but the published package and the release validation path allowed a broken consumer experience to ship.

We need a release repair that:

1. Blocks any future CLI tarball that omits bundled templates.
2. Validates `caatinga init` from a packed consumer environment without `CAATINGA_TEMPLATES_DIR`.
3. Publishes the three fixed-version packages in lockstep as `0.1.3` so the public contract matches the repository state.

## Non-goals

- Do not redesign template resolution behavior in runtime code unless fresh evidence shows the packed tarball still fails after validation hardening.
- Do not publish to npm in this workstream.
- Do not change package scope or rename public packages.
- Do not add new official templates.
- Do not promote to `latest` automatically; this work only prepares the release artifact and evidence.

## Prior Art

### Rejected: patch only `@caatinga/cli`

Rejected because [`.changeset/config.json`](/home/dionebastos/Documentos/PROJETOS/caatinga/.changeset/config.json:1) defines fixed versioning for `@caatinga/cli`, `@caatinga/core`, and `@caatinga/client`. Publishing only one package would create version drift and weaken the release contract.

### Rejected: reuse `0.1.2`

Rejected because npm already exposes `0.1.0` while the repository is on `0.1.2`. Reusing or force-fitting `0.1.2` obscures release history. `0.1.3` makes the repair explicit and monotonic.

### Rejected: keep `CAATINGA_TEMPLATES_DIR` in consumer validation

Rejected because it hides the exact failure mode experienced by users. Consumer isolation must prove the packaged CLI resolves bundled templates on its own.

## Interface Contract

### Package versions

The next prepared release bumps these packages together from `0.1.2` to `0.1.3`:

- `@caatinga/cli`
- `@caatinga/core`
- `@caatinga/client`

### CLI packaging contract

The packed CLI tarball must contain at minimum:

```txt
package/dist/index.js
package/package.json
package/templates/react-vite-counter/caatinga.template.json
```

If `package/templates/react-vite-counter/caatinga.template.json` is absent, release validation must fail before any consumer test or publish step continues.

### Consumer isolation contract

`scripts/consumer-isolation-test.sh` must validate the packed CLI exactly as a real consumer uses it:

1. Create a temp directory outside the monorepo.
2. Install packed `core`, `client`, and `cli` tarballs.
3. Run `npx caatinga --version`.
4. Run `npx caatinga init test-app --template react-vite-counter` with no `CAATINGA_TEMPLATES_DIR`.
5. Verify `test-app/caatinga.config.ts` and `test-app/caatinga.artifacts.json` exist.
6. Install generated app dependencies.
7. Run `npm run build` in the generated app.

Failure cases:

- Missing tarball: exit non-zero with explicit stderr.
- Missing bundled templates in CLI tarball: exit non-zero with explicit stderr.
- `caatinga init` failure: exit non-zero and stop release preparation.
- Generated app build failure: exit non-zero and stop release preparation.

### Release evidence contract

Before the release is considered prepared, the following commands must be run successfully against fresh artifacts:

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm ci:snapshot-pack
NPM_CONFIG_CACHE=/tmp/caatinga-npm-cache bash scripts/consumer-isolation-test.sh
```

If any command fails, release preparation is incomplete.

## Observability Plan

- `scripts/ci-snapshot-pack.sh` prints the packed tarball contents and fails early with a precise message when CLI templates are missing.
- `scripts/consumer-isolation-test.sh` fails with precise stderr for missing tarballs or missing bundled templates before entering the generated app flow.
- Release evidence is derived from command exit codes and terminal output, not inference.

Owner at 3am: release owner for the current cycle, using `docs/release/publish-checklist.md` and the command evidence above.

## Rollout + Rollback

### Rollout

1. Harden release validation scripts.
2. Add a changeset that bumps the fixed package set to `0.1.3`.
3. Run versioning/changelog generation.
4. Run the full release evidence commands.
5. Hand off a prepared branch and exact publish command, without publishing.

### Rollback

If validation fails after versioning:

1. Do not publish.
2. Keep the branch local or revert the changeset/version bump commit.
3. Fix the failing validation path.
4. Re-run the full release evidence sequence.

If a publish later ships a bad package despite this repair, rollback is operational rather than code-level:

1. Deprecate the bad npm version if necessary.
2. Cut the next patch release with corrected artifacts.
3. Preserve the failing evidence in the release notes or incident record.
