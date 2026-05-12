# Stellar CLI Version Contract

Kaleido shells out to Stellar CLI for current build, deploy, bindings, and invoke commands. Future XDR or doctor commands must follow the same version contract when implemented. Unsupported CLI versions are not assumed safe.

## Supported Range

- Minimum: `22.0.0`
- Tested maximum: `22.0.1`

Runtime behavior:

- Below the minimum: fail with `KALEIDO_UNSUPPORTED_CLI_VERSION`.
- Above the tested maximum: fail with `KALEIDO_UNTESTED_CLI_VERSION`.
- Local override: pass `--allow-untested-stellar-cli`.
- CI must not use the override.

## Upgrade Process

1. Install the new Stellar CLI locally.
2. Capture `stellar --version` in a versioned fixture.
3. Add or update parser fixtures for build, deploy, bindings, and invoke output.
4. Run `pnpm test`.
5. Raise `STELLAR_CLI_TESTED_MAX_VERSION` only after fixtures and smoke validation pass.

## CI Rule

CI must use a pinned Stellar CLI version within the supported range. The override flag is for local experiments only because CI is the release boundary.
