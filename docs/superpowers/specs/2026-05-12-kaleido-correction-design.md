# Kaleido Correction Design

## Status

Approved for implementation planning.

## Date

2026-05-12

## Motivation

Kaleido needs a correction pass before new features. The current hardening work is mostly in place, but a few repository contracts still need to be made exact: TypeScript schema exports, public error-code usage, Stellar CLI deploy parsing, CI workflow shape, template manifest compatibility validation, and the documented Rust WASM target.

This pass deliberately excludes `kaleido doctor`.

## Non-goals

- Do not implement `kaleido doctor`.
- Do not add multi-contract deploy sequencing.
- Do not change artifact schema version.
- Do not introduce a template registry or plugin system.
- Do not add network-dependent CI checks.

## Scope

Implement P0-P5 only:

1. Make schema type exports compile correctly.
2. Standardize public `KaleidoError` codes through `KaleidoErrorCode`.
3. Ensure deploy uses the centralized Stellar CLI contract ID parser.
4. Rewrite GitHub Actions CI as valid multiline YAML.
5. Validate `kaleido.template.json` before copying templates.
6. Align docs, tests, and template config with `wasm32v1-none`.

## Architecture

### Type Contracts

`packages/core/src/config/config.schema.ts` exports inferred types with `typeof`:

```ts
export type KaleidoConfig = z.infer<typeof KaleidoConfigSchema>;
export type ContractConfig = z.infer<typeof ContractConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
```

`packages/core/src/templates/template-manifest.schema.ts` exports:

```ts
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
```

No exported type may use bare `z.infer`.

### Public Error Codes

`KaleidoErrorCode` is the single source of public error codes. Public `KaleidoError` construction uses `KaleidoErrorCode.*`, not legacy string literals.

Required mappings:

| Legacy | Public code |
| --- | --- |
| `CONFIG_NOT_FOUND` | `KALEIDO_CONFIG_NOT_FOUND` |
| `CONFIG_INVALID` | `KALEIDO_INVALID_CONFIG` |
| `COMMAND_FAILED` | `KALEIDO_COMMAND_FAILED` |
| `CONTRACT_ID_NOT_FOUND` | `KALEIDO_CONTRACT_ID_NOT_FOUND` |
| `SOURCE_ACCOUNT_REQUIRED` | `KALEIDO_SOURCE_ACCOUNT_REQUIRED` |
| `SECRET_SOURCE_REJECTED` | `KALEIDO_UNSAFE_SOURCE_ACCOUNT` |

Tests must assert that every exported code starts with `KALEIDO_`. Documentation in `docs/errors.md` must match the implemented codes.

### Stellar CLI Parsing

`deploy-contract.ts` must not define a local `parseContractId`.

Deploy parses contract IDs through:

```ts
import { parseContractId } from "../stellar-cli/parse-contract-id.js";
```

The deploy result output passed to the parser is:

```ts
const output = result.all ?? `${result.stdout}\n${result.stderr}`;
const contractId = parseContractId(output);
```

`parse-contract-id.ts` uses:

```ts
const CONTRACT_ID_REGEX = /\bC[A-Z0-9]{55}\b/;
```

Missing contract IDs throw `KALEIDO_CONTRACT_ID_NOT_FOUND`.

Fixture tests cover:

- `deploy-success.txt`
- `deploy-success-minimal.txt`
- `deploy-success-no-contract-id.txt`

### CI

`.github/workflows/ci.yml` uses multiline YAML with explicit branch entries:

```yaml
on:
  push:
    branches:
      - master
      - main
  pull_request:
```

CI runs:

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`

CI must not require Stellar testnet access.

### Template Manifest

`createProjectFromTemplate` validates `kaleido.template.json` before creating or copying into the target directory.

Flow:

1. Resolve template directory.
2. Read `kaleido.template.json`.
3. Validate with `TemplateManifestSchema`.
4. Validate `compatibleCore`.
5. Copy only if valid.

Compatibility uses:

```ts
semver.satisfies(coreVersion, manifest.kaleido.compatibleCore)
```

`@kaleido/core` owns this dependency:

- Runtime dependency: `semver`
- Dev dependency: `@types/semver`

Missing manifest error:

```ts
throw new KaleidoError(
  "Template manifest was not found.",
  KaleidoErrorCode.TEMPLATE_MANIFEST_NOT_FOUND,
  "Add a kaleido.template.json file to the template root."
);
```

Invalid or incompatible manifest error:

```ts
throw new KaleidoError(
  "Template is not compatible with this Kaleido version.",
  KaleidoErrorCode.TEMPLATE_INCOMPATIBLE,
  "Use a compatible template version or upgrade Kaleido."
);
```

The CLI prints the valid template name and version after init succeeds.

### WASM Target

Docs, tests, and official template config use `wasm32v1-none`, matching current Stellar smart contract setup guidance for Rust `1.84.0+`.

For the official template, the contract lives under `contracts/counter`, so the correct generated config path is:

```ts
wasm: "./contracts/counter/target/wasm32v1-none/release/counter.wasm"
```

Documentation must not recommend `wasm32-unknown-unknown`.

## Error Handling

- Missing config remains `KALEIDO_CONFIG_NOT_FOUND`.
- Invalid config remains `KALEIDO_INVALID_CONFIG`.
- Missing template manifest is `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND`.
- Invalid template manifest schema and incompatible core range are both `KALEIDO_TEMPLATE_INCOMPATIBLE`.
- Missing contract ID in Stellar CLI output is `KALEIDO_CONTRACT_ID_NOT_FOUND`.
- Unsafe source account input is `KALEIDO_UNSAFE_SOURCE_ACCOUNT`.

Messages and hints may change, but codes are public API.

## Testing

Required checks:

```bash
pnpm typecheck
pnpm build
pnpm test
```

Specific tests:

- Schema type exports compile.
- All public error codes start with `KALEIDO_`.
- No public `KaleidoError` construction uses raw legacy codes.
- Contract ID parser uses fixtures and throws `KALEIDO_CONTRACT_ID_NOT_FOUND` on missing ID.
- Template init fails for missing manifest.
- Template init fails for invalid manifest schema.
- Template init fails for incompatible `compatibleCore`.
- Template init succeeds and returns/prints template name and version.

## Documentation Updates

Update:

- `README.md`
- `docs/errors.md`
- `docs/templates.md`
- `docs/getting-started.md`
- `docs/config.md`

Docs must describe actual implemented behavior only. `kaleido doctor` remains out of scope.

## Acceptance Criteria

- `pnpm typecheck` passes.
- `pnpm build` passes.
- `pnpm test` passes.
- GitHub Actions workflow is valid multiline YAML.
- No exported type uses bare `z.infer`.
- No public `KaleidoError` is constructed with raw legacy error codes.
- All public error codes start with `KALEIDO_`.
- `deploy-contract.ts` has no local `parseContractId`.
- `deploy-contract.ts` passes combined command output to the centralized parser.
- Template manifest is validated before copying.
- Compatibility is checked with `semver.satisfies`.
- README and docs use `wasm32v1-none` and Rust `1.84.0+`.
