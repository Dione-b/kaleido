# @caatinga/cli

## 0.1.4

### Patch Changes

- Fix the published CLI version output and normalize absolute init paths to project directory names.
  - @caatinga/core@0.1.4

## 0.1.3

### Patch Changes

- fix release validation so packed CLI tarballs must include bundled templates and consumer init is exercised without CAATINGA_TEMPLATES_DIR
- update the generated contract build-path and Stellar CLI compatibility notes to match the supported `wasm32-unknown-unknown` flow and the current maximum tested Stellar CLI version `25.2.0`
- Updated dependencies
  - @caatinga/core@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies
  - @caatinga/core@0.1.2

## 0.1.1

### Patch Changes

- 1e7c432: fix: bundle templates inside the CLI package so npx init can resolve them correctly.
- f93527c: Initial pre-v1 release (next tag). Validates metadata, consumer isolation, and core workflow.
- cf14f20: Publish consumer-facing package documentation and release-process alignment for the first public release track.
- Updated dependencies [f93527c]
- Updated dependencies [cf14f20]
  - @caatinga/core@0.1.1
