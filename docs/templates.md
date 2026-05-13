# Templates

The MVP ships official templates:

- `react-vite-counter` — single Soroban counter dApp.
- `marketplace-with-token` — **experimental** two-contract layout demonstrating `dependsOn` and `${contracts.token.contractId}` deploy args.

Every template must include `kaleido.template.json`:

```json
{
  "name": "react-vite-counter",
  "version": "0.1.0",
  "description": "Minimal Vite + React + Soroban counter dApp.",
  "kaleido": {
    "compatibleCore": "^0.1.0",
    "templateVersion": 1
  },
  "frontend": {
    "framework": "vite-react",
    "packageManager": "npm"
  },
  "contracts": {
    "path": "contracts",
    "default": "counter"
  },
  "files": {
    "config": "kaleido.config.ts",
    "artifacts": "kaleido.artifacts.json"
  }
}
```

`compatibleCore` is checked against the current `@kaleido/core` version before files are copied. Missing manifests fail with `KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND`; invalid or incompatible manifests fail with `KALEIDO_TEMPLATE_INCOMPATIBLE`.

Official templates are maintained in this repository. Community templates should be treated as executable source code: inspect the files before running install scripts or connecting wallets.

Generated projects include:

- `contracts/counter`
- `src`
- `kaleido.config.ts`
- `kaleido.artifacts.json`
- Vite and TypeScript config
- dependencies for generated bindings, `@kaleido/client`, and Freighter smoke wiring

Set `KALEIDO_TEMPLATES_DIR` during local development to point the CLI at a custom templates directory.

## Alpha smoke path

The official template documents both paths:

1. CLI: `build -> deploy -> generate -> invoke`
2. Browser/client: generated bindings + `kaleido.artifacts.json` + `@kaleido/client` + Freighter adapter

The template does not generate React hooks or `kaleido generate --interop` output in alpha.
