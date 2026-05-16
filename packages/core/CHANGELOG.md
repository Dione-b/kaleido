# @kaleido-xlm/core

## 0.1.3

### Patch Changes

- fix release validation so packed CLI tarballs must include bundled templates and consumer init is exercised without KALEIDO_TEMPLATES_DIR
- fix the generated contract build path to match the supported Stellar CLI flow again, keeping Kaleido aligned with `wasm32-unknown-unknown` and the current maximum tested Stellar CLI version `25.2.0`

## 0.1.2

### Patch Changes

- fix: bump maximum tested Stellar CLI version to 25.2.0 to support modern installations out of the box.

## 0.1.1

### Patch Changes

- f93527c: Initial pre-v1 release (next tag). Validates metadata, consumer isolation, and core workflow.
- cf14f20: Publish consumer-facing package documentation and release-process alignment for the first public release track.
