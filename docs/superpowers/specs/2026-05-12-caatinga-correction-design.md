# Caatinga Correction Design

## Status

Approved for implementation planning.

## Date

2026-05-12

## Motivation

Caatinga needs a correction pass before new features. The current hardening work is mostly in place, but a few repository contracts still need to be made exact: TypeScript schema exports, public error-code usage, Stellar CLI deploy parsing, CI workflow shape, template manifest compatibility validation, and the documented Rust WASM target.

This pass deliberately excludes `caatinga doctor`.

## Non-goals

- Do not implement `caatinga doctor`.
- Do not add multi-contract deploy sequencing.
- Do not change artifact schema version.
- Do not introduce a template registry or plugin system.
- Do not add network-dependent CI checks.

## Scope

Implement P0-P5 only:

1. Make schema type exports compile correctly.
2. Standardize public `CaatingaError` codes through `CaatingaErrorCode`.
3. Ensure deploy uses the centralized Stellar CLI contract ID parser.
4. Rewrite GitHub Actions CI as valid multiline YAML.
5. Validate `caatinga.template.json` before copying templates.
6. Align docs, tests, and template config with `wasm32v1-none`.

## Architecture

### Type Contracts

`packages/core/src/config/config.schema.ts` exports inferred types with `typeof`:

```ts
export type CaatingaConfig = z.infer<typeof CaatingaConfigSchema>;
export type ContractConfig = z.infer<typeof ContractConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
```

`packages/core/src/templates/template-manifest.schema.ts` exports:

```ts
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
```

No exported type may use bare `z.infer`.

### Public Error Codes

`CaatingaErrorCode` is the single source of public error codes. Public `CaatingaError` construction uses `CaatingaErrorCode.*`, not legacy string literals.

Required mappings:

| Legacy | Public code |
| --- | --- |
| `CONFIG_NOT_FOUND` | `CAATINGA_CONFIG_NOT_FOUND` |
| `CONFIG_INVALID` | `CAATINGA_INVALID_CONFIG` |
| `COMMAND_FAILED` | `CAATINGA_COMMAND_FAILED` |
| `CONTRACT_ID_NOT_FOUND` | `CAATINGA_CONTRACT_ID_NOT_FOUND` |
| `SOURCE_ACCOUNT_REQUIRED` | `CAATINGA_SOURCE_ACCOUNT_REQUIRED` |
| `SECRET_SOURCE_REJECTED` | `CAATINGA_UNSAFE_SOURCE_ACCOUNT` |

Tests must assert that every exported code starts with `CAATINGA_`. Documentation in `docs/errors.md` must match the implemented codes.

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

Missing contract IDs throw `CAATINGA_CONTRACT_ID_NOT_FOUND`.

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

`createProjectFromTemplate` validates `caatinga.template.json` before creating or copying into the target directory.

Flow:

1. Resolve template directory.
2. Read `caatinga.template.json`.
3. Validate with `TemplateManifestSchema`.
4. Validate `compatibleCore`.
5. Copy only if valid.

Compatibility uses:

```ts
semver.satisfies(coreVersion, manifest.caatinga.compatibleCore)
```

`@caatinga/core` owns this dependency:

- Runtime dependency: `semver`
- Dev dependency: `@types/semver`

Missing manifest error:

```ts
throw new CaatingaError(
  "Template manifest was not found.",
  CaatingaErrorCode.TEMPLATE_MANIFEST_NOT_FOUND,
  "Add a caatinga.template.json file to the template root."
);
```

Invalid or incompatible manifest error:

```ts
throw new CaatingaError(
  "Template is not compatible with this Caatinga version.",
  CaatingaErrorCode.TEMPLATE_INCOMPATIBLE,
  "Use a compatible template version or upgrade Caatinga."
);
```

The CLI prints the valid template name and version after init succeeds.

### WASM Target

Docs, tests, and official template config use `wasm32v1-none`, matching current Stellar smart contract setup guidance for Rust `1.84.0+`.

For the official template, the contract lives under `contracts/counter`, so the correct generated config path is:

```ts
wasm: "./contracts/counter/target/wasm32v1-none/release/counter.wasm"
```

Documentation must not recommend the deprecated pre-Stellar smart contract Wasm target.

## Error Handling

- Missing config remains `CAATINGA_CONFIG_NOT_FOUND`.
- Invalid config remains `CAATINGA_INVALID_CONFIG`.
- Missing template manifest is `CAATINGA_TEMPLATE_MANIFEST_NOT_FOUND`.
- Invalid template manifest schema is `CAATINGA_INVALID_TEMPLATE_MANIFEST`; incompatible core range is `CAATINGA_TEMPLATE_INCOMPATIBLE`.
- Missing contract ID in Stellar CLI output is `CAATINGA_CONTRACT_ID_NOT_FOUND`.
- Unsafe source account input is `CAATINGA_UNSAFE_SOURCE_ACCOUNT`.

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
- All public error codes start with `CAATINGA_`.
- No public `CaatingaError` construction uses raw legacy codes.
- Contract ID parser uses fixtures and throws `CAATINGA_CONTRACT_ID_NOT_FOUND` on missing ID.
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

Docs must describe actual implemented behavior only. `caatinga doctor` remains out of scope.

## Acceptance Criteria

- `pnpm typecheck` passes.
- `pnpm build` passes.
- `pnpm test` passes.
- GitHub Actions workflow is valid multiline YAML.
- No exported type uses bare `z.infer`.
- No public `CaatingaError` is constructed with raw legacy error codes.
- All public error codes start with `CAATINGA_`.
- `deploy-contract.ts` has no local `parseContractId`.
- `deploy-contract.ts` passes combined command output to the centralized parser.
- Template manifest is validated before copying.
- Compatibility is checked with `semver.satisfies`.
- README and docs use `wasm32v1-none` and Rust `1.84.0+`.
