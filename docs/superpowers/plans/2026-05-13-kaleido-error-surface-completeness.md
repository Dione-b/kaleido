# KALEIDO_* Error Surface Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que todo caminho de falha voltado ao usuário em `@kaleido/cli`, `@kaleido/core` e `@kaleido/client` exponha um código `KALEIDO_*` estável via `KaleidoError`, com enum centralizado, documentação completa, política de semver publicada e testes que disparem cada código exportado.

**Architecture:** Manter `KaleidoError` como tipo único de falha pública; centralizar strings de código em `KaleidoErrorCode` (arquivo dedicado); estender `runCommand` (e pontos do client) com códigos de falha específicos onde hoje só existe `COMMAND_FAILED` ou erro genérico; reforçar invariantes com testes estáticos (árvore de fontes) e testes de comportamento por código.

**Tech Stack:** TypeScript, pnpm, Vitest, turbo, execa (via `runCommand`), workspaces `@kaleido/core` / `@kaleido/client` / `@kaleido/cli`.

---

## File map (criar / modificar / testar)

| Caminho | Responsabilidade |
| --- | --- |
| `packages/core/src/errors/KaleidoErrorCode.ts` | Objeto `KaleidoErrorCode` + tipo `KaleidoErrorCodeValue` (extraído de `KaleidoError.ts`). |
| `packages/core/src/errors/KaleidoError.ts` | Classe `KaleidoError`, `toKaleidoError`; reexporta `KaleidoErrorCode` e `KaleidoErrorCodeValue` para imports existentes `../errors/KaleidoError.js`. |
| `packages/core/src/index.ts` | Export explícito de `KaleidoErrorCode` / tipo a partir de `./errors/KaleidoErrorCode.js` se quiser API pública direta do módulo de códigos (opcional; pode reexportar só via `KaleidoError.ts` conforme já ocorre). |
| `packages/core/src/shell/run-command.ts` | Opção opcional `failureCode` (ou nome equivalente) para mapear falhas de subprocesso a `DEPLOY_FAILED` / `BUILD_FAILED` / `BINDINGS_FAILED` / `INVOKE_FAILED` sem string literal de código. |
| `packages/core/src/contracts/build-contract.ts` | Passar código de falha do build; detectar saída/`stderr` típico de alvo Wasm ausente e lançar `RUST_TARGET_NOT_FOUND` antes ou depois do `stellar contract build`. |
| `packages/core/src/contracts/deploy-contract.ts` | Passar `DEPLOY_FAILED` em falha do deploy; manter `DEPLOY_ARG_PLACEHOLDER_UNRESOLVED` no loop existente. |
| `packages/core/src/contracts/generate-bindings.ts` | Passar `BINDINGS_FAILED` em falha do `stellar contract bindings`. |
| `packages/core/src/contracts/invoke-contract.ts` | Passar `INVOKE_FAILED` em falha do `stellar contract invoke`. |
| `packages/core/src/templates/create-project-from-template.ts` | Usar `TEMPLATE_INVALID` para `SyntaxError` / `z.ZodError` no manifest; manter `TEMPLATE_INCOMPATIBLE` para incompatibilidade de versão. |
| `packages/client/src/xdr/build-xdr.ts` | Separar falha de `prepare()` em `XDR_PREPARE_FAILED`; manter `XDR_BUILD_FAILED` para `toXDR` / resto. |
| `packages/client/src/client/kaleido-contract-client.ts` | Envolver `getPublicKey()` com `WALLET_NOT_CONNECTED`; opcionalmente validar resultado bruto do submit e lançar `XDR_RESULT_FAILED` quando a forma for incompatível. |
| `docs/errors.md` | Linhas por código com colunas: Meaning, Likely cause, Suggested fix, CI handling recommendation, Semver stability (alinhado à spec). |
| `docs/release/error-code-policy.md` | Já contém regras de semver; revisar se está explícito como na spec (minor/major/patch). |
| `packages/core/src/errors/error-surface.test.ts` | Ampliar regex proibindo segundo argumento string não namespaced; manter simetria docs ↔ enum. |
| `packages/core/src/errors/error-codes.test.ts` | Remover lista fixa de arquivos; reutilizar walker de `error-surface` ou importar função compartilhada para varrer `packages/*/src` e proibir `new KaleidoError(..., "FOO")` sem `KALEIDO_` prefix quando for string legacy. |
| `packages/core/src/errors/to-kaleido-error.test.ts` | Novo: dispara `UNEXPECTED_ERROR` via `toKaleidoError(new Error("x"))`. |
| Testes por domínio | Ver tabela na Task 8 — arquivos `*.test.ts` listados com asserts `code: KaleidoErrorCode.*`. |

---

### Task 1: Extrair `KaleidoErrorCode` para `KaleidoErrorCode.ts`

**Files:**

- Create: `packages/core/src/errors/KaleidoErrorCode.ts`
- Modify: `packages/core/src/errors/KaleidoError.ts` (remover objeto `KaleidoErrorCode`; importar tipo/const; reexportar)
- Test: `pnpm --filter @kaleido/core exec vitest run packages/core/src/errors/error-surface.test.ts` (ajustar path relativo ao cwd do pacote)

- [ ] **Step 1: Criar `KaleidoErrorCode.ts` com o conteúdo completo abaixo**

```typescript
export const KaleidoErrorCode = {
  CONFIG_NOT_FOUND: "KALEIDO_CONFIG_NOT_FOUND",
  INVALID_CONFIG: "KALEIDO_INVALID_CONFIG",
  COMMAND_FAILED: "KALEIDO_COMMAND_FAILED",
  UNEXPECTED_ERROR: "KALEIDO_UNEXPECTED_ERROR",
  STELLAR_CLI_NOT_FOUND: "KALEIDO_STELLAR_CLI_NOT_FOUND",
  STELLAR_CLI_VERSION_PARSE_FAILED: "KALEIDO_STELLAR_CLI_VERSION_PARSE_FAILED",
  UNSUPPORTED_CLI_VERSION: "KALEIDO_UNSUPPORTED_CLI_VERSION",
  UNTESTED_CLI_VERSION: "KALEIDO_UNTESTED_CLI_VERSION",
  RUST_NOT_FOUND: "KALEIDO_RUST_NOT_FOUND",
  RUST_TARGET_NOT_FOUND: "KALEIDO_RUST_TARGET_NOT_FOUND",
  DEPLOY_FAILED: "KALEIDO_DEPLOY_FAILED",
  BUILD_FAILED: "KALEIDO_BUILD_FAILED",
  BINDINGS_FAILED: "KALEIDO_BINDINGS_FAILED",
  INVOKE_FAILED: "KALEIDO_INVOKE_FAILED",
  CONTRACT_NOT_FOUND: "KALEIDO_CONTRACT_NOT_FOUND",
  NETWORK_NOT_FOUND: "KALEIDO_NETWORK_NOT_FOUND",
  ARTIFACT_NOT_FOUND: "KALEIDO_ARTIFACT_NOT_FOUND",
  ARTIFACT_INVALID: "KALEIDO_ARTIFACT_INVALID",
  CONTRACT_ID_NOT_FOUND: "KALEIDO_CONTRACT_ID_NOT_FOUND",
  CONTRACT_ARTIFACT_NOT_FOUND: "KALEIDO_CONTRACT_ARTIFACT_NOT_FOUND",
  CONTRACT_DEPENDENCY_NOT_FOUND: "KALEIDO_CONTRACT_DEPENDENCY_NOT_FOUND",
  CONTRACT_DEPENDENCY_CYCLE: "KALEIDO_CONTRACT_DEPENDENCY_CYCLE",
  CONTRACT_DEPENDENCY_ARTIFACT_NOT_FOUND: "KALEIDO_CONTRACT_DEPENDENCY_ARTIFACT_NOT_FOUND",
  DEPLOY_ARG_PLACEHOLDER_INVALID: "KALEIDO_DEPLOY_ARG_PLACEHOLDER_INVALID",
  DEPLOY_ARG_PLACEHOLDER_UNRESOLVED: "KALEIDO_DEPLOY_ARG_PLACEHOLDER_UNRESOLVED",
  BINDING_CLIENT_NOT_FOUND: "KALEIDO_BINDING_CLIENT_NOT_FOUND",
  BINDING_METHOD_NOT_FOUND: "KALEIDO_BINDING_METHOD_NOT_FOUND",
  XDR_BUILD_FAILED: "KALEIDO_XDR_BUILD_FAILED",
  XDR_PREPARE_FAILED: "KALEIDO_XDR_PREPARE_FAILED",
  XDR_SIGN_FAILED: "KALEIDO_XDR_SIGN_FAILED",
  XDR_SUBMIT_FAILED: "KALEIDO_XDR_SUBMIT_FAILED",
  XDR_RESULT_FAILED: "KALEIDO_XDR_RESULT_FAILED",
  WALLET_NOT_CONNECTED: "KALEIDO_WALLET_NOT_CONNECTED",
  SOURCE_ACCOUNT_REQUIRED: "KALEIDO_SOURCE_ACCOUNT_REQUIRED",
  UNSAFE_SOURCE_ACCOUNT: "KALEIDO_UNSAFE_SOURCE_ACCOUNT",
  INVOKE_TARGET_INVALID: "KALEIDO_INVOKE_TARGET_INVALID",
  TEMPLATE_NOT_FOUND: "KALEIDO_TEMPLATE_NOT_FOUND",
  TEMPLATE_INVALID: "KALEIDO_TEMPLATE_INVALID",
  TEMPLATE_MANIFEST_NOT_FOUND: "KALEIDO_TEMPLATE_MANIFEST_NOT_FOUND",
  TEMPLATE_INCOMPATIBLE: "KALEIDO_TEMPLATE_INCOMPATIBLE"
} as const;

export type KaleidoErrorCodeValue = (typeof KaleidoErrorCode)[keyof typeof KaleidoErrorCode];
```

- [ ] **Step 2: Substituir o conteúdo de `KaleidoError.ts` pelo bloco abaixo (remove duplicação do objeto)**

```typescript
import { KaleidoErrorCode, type KaleidoErrorCodeValue } from "./KaleidoErrorCode.js";

export { KaleidoErrorCode, type KaleidoErrorCodeValue } from "./KaleidoErrorCode.js";

export class KaleidoError extends Error {
  constructor(
    message: string,
    public readonly code: KaleidoErrorCodeValue,
    public readonly hint?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "KaleidoError";
  }
}

export function toKaleidoError(error: unknown): KaleidoError {
  if (error instanceof KaleidoError) {
    return error;
  }

  if (error instanceof Error) {
    return new KaleidoError(error.message, KaleidoErrorCode.UNEXPECTED_ERROR, undefined, error);
  }

  return new KaleidoError("An unexpected error occurred.", KaleidoErrorCode.UNEXPECTED_ERROR);
}
```

- [ ] **Step 3: Rodar typecheck e testes do core**

Run (a partir da raiz do monorepo):

```bash
pnpm --filter @kaleido/core run typecheck
pnpm --filter @kaleido/core run test
```

Expected: PASS (imports `../errors/KaleidoError.js` continuam recebendo `KaleidoErrorCode` via reexport).

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/errors/KaleidoError.ts packages/core/src/errors/KaleidoErrorCode.ts
git commit -m "refactor: extract KaleidoErrorCode to dedicated module"
```

---

### Task 2: `runCommand` — código de falha por contexto (`failureCode`)

**Files:**

- Modify: `packages/core/src/shell/run-command.ts`
- Modify: `packages/core/src/contracts/build-contract.ts`
- Modify: `packages/core/src/contracts/deploy-contract.ts`
- Modify: `packages/core/src/contracts/generate-bindings.ts`
- Modify: `packages/core/src/contracts/invoke-contract.ts`
- Test: novo `packages/core/src/shell/run-command.test.ts`

- [ ] **Step 1: Escrever teste falhando para `failureCode`**

Criar `packages/core/src/shell/run-command.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { execa } from "execa";
import { KaleidoErrorCode } from "../errors/KaleidoErrorCode.js";
import { runCommand } from "./run-command.js";

vi.mock("execa", () => ({
  execa: vi.fn()
}));

describe("runCommand", () => {
  it("should_map_subprocess_failure_to_failureCode_when_provided", async () => {
    const { execa: execaMock } = await import("execa");
    vi.mocked(execaMock).mockRejectedValue({
      all: "boom",
      code: 1
    });

    await expect(
      runCommand("false", [], {
        skipStellarVersionCheck: true,
        failureCode: KaleidoErrorCode.BUILD_FAILED
      })
    ).rejects.toMatchObject({
      code: KaleidoErrorCode.BUILD_FAILED
    });
  });
});
```

Run:

```bash
pnpm --filter @kaleido/core exec vitest run src/shell/run-command.test.ts -v
```

Expected: FAIL (propriedade `failureCode` ainda não existe).

- [ ] **Step 2: Implementar `failureCode` em `run-command.ts`**

No tipo `RunCommandOptions`, adicionar:

```typescript
failureCode?: KaleidoErrorCodeValue;
```

No `catch`, após tratar `ENOENT` do `stellar`, ao montar o `KaleidoError` genérico de falha de comando, usar:

```typescript
const failureCode = options.failureCode ?? KaleidoErrorCode.COMMAND_FAILED;
throw new KaleidoError(
  `Command failed: ${command} ${args.join(" ")}`,
  failureCode,
  output || "Re-run the command with the underlying tool directly for full diagnostics.",
  error
);
```

Importar `KaleidoErrorCodeValue` de `../errors/KaleidoErrorCode.js` se necessário.

- [ ] **Step 3: Passar códigos nos call sites**

Em `build-contract.ts`, na chamada `runCommand("stellar", ["contract", "build"], { ... })`:

```typescript
failureCode: KaleidoErrorCode.BUILD_FAILED
```

Em `deploy-contract.ts`, na chamada `runCommand` do deploy:

```typescript
failureCode: KaleidoErrorCode.DEPLOY_FAILED
```

Em `generate-bindings.ts`, na chamada `runCommand` de bindings:

```typescript
failureCode: KaleidoErrorCode.BINDINGS_FAILED
```

Em `invoke-contract.ts`, na chamada `runCommand` de invoke:

```typescript
failureCode: KaleidoErrorCode.INVOKE_FAILED
```

- [ ] **Step 4: Rodar testes**

```bash
pnpm --filter @kaleido/core exec vitest run src/shell/run-command.test.ts -v
pnpm --filter @kaleido/core run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/shell/run-command.ts packages/core/src/shell/run-command.test.ts packages/core/src/contracts/build-contract.ts packages/core/src/contracts/deploy-contract.ts packages/core/src/contracts/generate-bindings.ts packages/core/src/contracts/invoke-contract.ts
git commit -m "feat: map stellar command failures to domain Kaleido error codes"
```

---

### Task 3: `RUST_TARGET_NOT_FOUND` no fluxo de build

**Files:**

- Modify: `packages/core/src/contracts/build-contract.ts`
- Test: `packages/core/src/contracts/build-contract.test.ts`

- [ ] **Step 1: Teste que força `stellar contract build` a falhar com mensagem de alvo ausente**

No `build-contract.test.ts`, mockar `runCommand` para rejeitar com `all` contendo `wasm32v1-none` (ou substring documentada na sua versão do Stellar CLI real usada nos fixtures). Assert:

```typescript
await expect(
  buildContract({
    config: baseConfig,
    contractName: "counter",
    cwd: tmpDir,
    allowUntestedStellarCli: true
  })
).rejects.toMatchObject({ code: KaleidoErrorCode.RUST_TARGET_NOT_FOUND });
```

Ajustar `baseConfig` / `tmpDir` / wasm existente como nos testes atuais do arquivo.

Run:

```bash
pnpm --filter @kaleido/core exec vitest run src/contracts/build-contract.test.ts -v
```

Expected: FAIL até a implementação existir.

- [ ] **Step 2: Implementação mínima em `build-contract.ts`**

Após `runCommand` falhar, capturar erro (ou inspecionar `cause` / mensagem) e, se texto contiver indicador de alvo Wasm ausente (ex.: `wasm32v1-none` e `not installed` / `rustup target`), relançar:

```typescript
throw new KaleidoError(
  "Required Rust wasm32v1-none target is missing.",
  KaleidoErrorCode.RUST_TARGET_NOT_FOUND,
  "Run `rustup target add wasm32v1-none`.",
  error
);
```

Preferir checagem determinística: se o projeto já tiver helper, reutilizar; senão, função local `isMissingWasmTargetError(output: string): boolean` com constantes nomeadas para substrings.

- [ ] **Step 3: Rodar testes e commit**

```bash
pnpm --filter @kaleido/core exec vitest run src/contracts/build-contract.test.ts -v
git add packages/core/src/contracts/build-contract.ts packages/core/src/contracts/build-contract.test.ts
git commit -m "feat: surface missing wasm target as KALEIDO_RUST_TARGET_NOT_FOUND"
```

---

### Task 4: Templates — `TEMPLATE_INVALID` vs `TEMPLATE_INCOMPATIBLE`

**Files:**

- Modify: `packages/core/src/templates/create-project-from-template.ts` (`readTemplateManifest` catch)
- Test: `packages/core/src/templates/create-project-from-template.test.ts`

- [ ] **Step 1: Teste falhando — manifest JSON inválido deve usar `TEMPLATE_INVALID`**

Adicionar fixture em memória: escrever `kaleido.template.json` com JSON inválido no `templateDir` temporário; chamar `createProjectFromTemplate`; esperar `KaleidoErrorCode.TEMPLATE_INVALID` (não `TEMPLATE_INCOMPATIBLE`).

- [ ] **Step 2: Implementar — no `catch` de `readTemplateManifest`**

Para `SyntaxError` ou `z.ZodError`:

```typescript
throw new KaleidoError(
  "Template manifest is invalid.",
  KaleidoErrorCode.TEMPLATE_INVALID,
  "Fix kaleido.template.json to match the published schema."
);
```

Manter `TEMPLATE_INCOMPATIBLE` apenas para versão de template / core incompatível.

- [ ] **Step 3: Atualizar `docs/errors.md`** — garantir linha para `KALEIDO_TEMPLATE_INVALID` com Meaning distinto de `TEMPLATE_INCOMPATIBLE` (manifest malformado vs versão incompatível).

- [ ] **Step 4: Testes + commit**

```bash
pnpm --filter @kaleido/core exec vitest run src/templates/create-project-from-template.test.ts -v
git add packages/core/src/templates/create-project-from-template.ts packages/core/src/templates/create-project-from-template.test.ts docs/errors.md
git commit -m "fix: classify invalid template manifests as KALEIDO_TEMPLATE_INVALID"
```

---

### Task 5: Client — `XDR_PREPARE_FAILED`, `WALLET_NOT_CONNECTED`, `XDR_RESULT_FAILED`

**Files:**

- Modify: `packages/client/src/xdr/build-xdr.ts`
- Modify: `packages/client/src/client/kaleido-contract-client.ts`
- Test: novo ou estendido `packages/client/src/xdr/build-xdr.test.ts` e `packages/client/src/client/kaleido-contract-client.test.ts` (criar segundo se não existir)

- [ ] **Step 1: Teste `build-xdr` — `prepare()` rejeita → `XDR_PREPARE_FAILED`**

```typescript
import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "@kaleido/core";
import { buildXdr } from "./build-xdr.js";

describe("buildXdr", () => {
  it("should_map_prepare_rejection_to_XDR_PREPARE_FAILED", async () => {
    const transaction = {
      toXDR: () => "unsigned",
      prepare: async () => {
        throw new Error("simulate failed");
      }
    };

    await expect(
      buildXdr({
        contractName: "c",
        method: "m",
        contractId: "C".padEnd(56, "A"),
        transaction
      })
    ).rejects.toMatchObject({ code: KaleidoErrorCode.XDR_PREPARE_FAILED });
  });
});
```

- [ ] **Step 2: Implementar em `build-xdr.ts`**

Envolver chamada `prepare()` em `try/catch`; em falha não-`KaleidoError`, lançar `KaleidoError` com `KaleidoErrorCode.XDR_PREPARE_FAILED`.

- [ ] **Step 3: `getPublicKey` — `WALLET_NOT_CONNECTED`**

Em `kaleido-contract-client.ts`, método `createTransaction`:

```typescript
let publicKey: string;
try {
  publicKey = await this.config.wallet.getPublicKey();
} catch (error) {
  throw new KaleidoError(
    "Wallet is not connected or did not return a public key.",
    KaleidoErrorCode.WALLET_NOT_CONNECTED,
    "Connect the wallet and retry.",
    error
  );
}
```

Teste com wallet mock que rejeita `getPublicKey`; assert `WALLET_NOT_CONNECTED`.

- [ ] **Step 4: `XDR_RESULT_FAILED` (mínimo)**

Após `submit.call`, se o valor retornado não contiver nenhum de `txHash` / `transactionHash` / `hash` **e** não contiver `result` quando o binding exige hash (definir critério documentado em `docs/errors.md`), lançar:

```typescript
throw new KaleidoError(
  "Transaction result could not be normalized from binding output.",
  KaleidoErrorCode.XDR_RESULT_FAILED,
  "Regenerate bindings or inspect raw submit output with debugRaw."
);
```

Manter teste com objeto de retorno vazio `{}` que deve disparar o código (ajustar regra para ser determinística e não quebrar bindings reais existentes — inspecionar `create-kaleido-client.test.ts` e fixtures antes de fixar a condição).

- [ ] **Step 5: Rodar testes do client**

```bash
pnpm --filter @kaleido/client run test
```

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/xdr/build-xdr.ts packages/client/src/xdr/build-xdr.test.ts packages/client/src/client/kaleido-contract-client.ts packages/client/src/client/kaleido-contract-client.test.ts docs/errors.md
git commit -m "feat: add client error codes for prepare, wallet, and submit result"
```

---

### Task 6: `DEPLOY_ARG_PLACEHOLDER_UNRESOLVED` + `RUST_NOT_FOUND` + `COMMAND_FAILED` + `toKaleidoError`

**Files:**

- Modify: `packages/core/src/contracts/deploy-contract.test.ts`
- Create: `packages/core/src/errors/to-kaleido-error.test.ts`
- Modify: `packages/core/src/shell/check-binary.test.ts` (criar se não existir) ou estender teste existente que cubra `checkBinary("rustc", ...)` com mock de `runCommand`

- [ ] **Step 1: `deploy-contract.test.ts` — placeholders não resolvidos**

Config com `deployArgs` contendo string literal ainda com `${` após `resolveDeployArgs` (simular passando `resolvedDeployArgs` com valor `"${contracts.x}"` sem resolução); esperar `KaleidoErrorCode.DEPLOY_ARG_PLACEHOLDER_UNRESOLVED`.

- [ ] **Step 2: `to-kaleido-error.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import { KaleidoErrorCode } from "../errors/KaleidoErrorCode.js";
import { toKaleidoError } from "../errors/KaleidoError.js";

describe("toKaleidoError", () => {
  it("should_normalize_Error_instances_to_UNEXPECTED_ERROR", () => {
    const normalized = toKaleidoError(new Error("boom"));
    expect(normalized.code).toBe(KaleidoErrorCode.UNEXPECTED_ERROR);
  });
});
```

- [ ] **Step 3: `RUST_NOT_FOUND` via `checkBinary`**

Mock `run-command` para falhar ao rodar `rustc --version`; chamar `checkBinary("rustc", "...")`; assert `KaleidoErrorCode.RUST_NOT_FOUND`.

- [ ] **Step 4: `COMMAND_FAILED`**

Com `failureCode` já implementado, um teste em `run-command.test.ts` **sem** `failureCode` deve continuar retornando `COMMAND_FAILED` para binário genérico que falha (ex.: `false`).

Run:

```bash
pnpm --filter @kaleido/core run test
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/contracts/deploy-contract.test.ts packages/core/src/errors/to-kaleido-error.test.ts packages/core/src/shell/check-binary.test.ts
git commit -m "test: cover placeholder, unexpected, rust, and command failure codes"
```

---

### Task 7: CLI + invoke + bindings + XDR build/submit — asserts de código

**Files:**

- Modify: `packages/core/src/contracts/invoke-contract.test.ts` — assert `INVOKE_TARGET_INVALID` nos rejects de `parseInvokeTarget`
- Modify: `packages/core/src/contracts/generate-bindings.test.ts` — trocar `code: "KALEIDO_ARTIFACT_NOT_FOUND"` por `KaleidoErrorCode.ARTIFACT_NOT_FOUND`; adicionar caso em que `runCommand` falha e expect `BINDINGS_FAILED`
- Create: `packages/cli/src/utils/template-path.test.ts` — `resolveTemplateDir` dispara `TEMPLATE_NOT_FOUND`
- Modify: `packages/client/src/client/create-kaleido-client.test.ts` — adicionar casos para `XDR_BUILD_FAILED` (transação sem `toXDR`) e `XDR_SUBMIT_FAILED` (sem `send`/`signAndSend` ou throw no submit)

Cada sub-step: escrever teste falhando → implementar mínimo se necessário → `pnpm --filter ... test` → commit atômico por área se preferir (invoke, generate, cli, client).

Exemplo invoke (`invoke-contract.test.ts`):

```typescript
import { KaleidoErrorCode } from "../errors/KaleidoErrorCode.js";

it("rejects invalid target shapes", () => {
  expect(() => parseInvokeTarget("counter")).toThrowError(
    expect.objectContaining({ code: KaleidoErrorCode.INVOKE_TARGET_INVALID })
  );
});
```

---

### Task 8: Matriz de aceitação — todo `KaleidoErrorCode` com pelo menos um teste que **dispare** o código

Após Tasks 1–7, conferir manualmente cada entrada de `KaleidoErrorCode` contra esta tabela (marcar com teste existente ou novo). Se faltar, adicionar o teste mínimo indicado.

| Código | Onde dispara | Arquivo de teste sugerido |
| --- | --- | --- |
| `CONFIG_NOT_FOUND` | `loadConfig` | `config/load-config.test.ts` (já existe) |
| `INVALID_CONFIG` | schema | `load-config.test.ts` |
| `COMMAND_FAILED` | `runCommand` genérico | `shell/run-command.test.ts` |
| `UNEXPECTED_ERROR` | `toKaleidoError` | `errors/to-kaleido-error.test.ts` |
| `STELLAR_CLI_NOT_FOUND` | `runCommand` / version | `stellar-cli/run-command-version.test.ts` |
| `STELLAR_CLI_VERSION_PARSE_FAILED` | version parse | `check-stellar-cli-version.test.ts` |
| `UNSUPPORTED_CLI_VERSION` | check version | idem |
| `UNTESTED_CLI_VERSION` | check version / build | `check-stellar-cli-version.test.ts`, `build-contract.test.ts` |
| `RUST_NOT_FOUND` | `checkBinary("rustc")` | `shell/check-binary.test.ts` |
| `RUST_TARGET_NOT_FOUND` | build wasm target | `build-contract.test.ts` |
| `DEPLOY_FAILED` | deploy stellar fail | `deploy-contract.test.ts` (mock `runCommand` reject) |
| `BUILD_FAILED` | build stellar fail | `build-contract.test.ts` |
| `BINDINGS_FAILED` | bindings stellar fail | `generate-bindings.test.ts` |
| `INVOKE_FAILED` | invoke stellar fail | `invoke-contract.test.ts` |
| `CONTRACT_NOT_FOUND` | resolve / client | `resolve-contract.test.ts`, `create-kaleido-client` |
| `NETWORK_NOT_FOUND` | resolve | `resolve-network.test.ts` |
| `ARTIFACT_NOT_FOUND` | vários | `read-write-artifacts`, `invoke-contract`, `generate-bindings` |
| `ARTIFACT_INVALID` | artifacts IO | `read-write-artifacts.test.ts` |
| `CONTRACT_ID_NOT_FOUND` | parse | `parse-contract-id.test.ts` |
| `CONTRACT_ARTIFACT_NOT_FOUND` | client resolve | `resolve-contract-id.test.ts` |
| `CONTRACT_DEPENDENCY_*` | graph / args | `resolve-deploy-order.test.ts`, `resolve-deploy-args.test.ts`, `deploy-contract-graph.test.ts` |
| `DEPLOY_ARG_PLACEHOLDER_INVALID` | resolve args | `resolve-deploy-args.test.ts` |
| `DEPLOY_ARG_PLACEHOLDER_UNRESOLVED` | deploy loop | `deploy-contract.test.ts` |
| `BINDING_CLIENT_NOT_FOUND` / `BINDING_METHOD_NOT_FOUND` | adapter | `default-binding-adapter.test.ts` |
| `XDR_BUILD_FAILED` | `build-xdr` | `build-xdr.test.ts` |
| `XDR_PREPARE_FAILED` | `build-xdr` | `build-xdr.test.ts` |
| `XDR_SIGN_FAILED` | wallet sign | `create-kaleido-client.test.ts` |
| `XDR_SUBMIT_FAILED` | submit | `create-kaleido-client.test.ts` ou `kaleido-contract-client.test.ts` |
| `XDR_RESULT_FAILED` | normalize | `kaleido-contract-client.test.ts` |
| `WALLET_NOT_CONNECTED` | `getPublicKey` | `kaleido-contract-client.test.ts` |
| `SOURCE_ACCOUNT_REQUIRED` / `UNSAFE_SOURCE_ACCOUNT` | source | `source-account.test.ts` |
| `INVOKE_TARGET_INVALID` | parse target | `invoke-contract.test.ts` |
| `TEMPLATE_NOT_FOUND` | CLI path / core | `template-path.test.ts`, `create-project-from-template` (diretório inexistente) |
| `TEMPLATE_INVALID` | manifest JSON/zod | `create-project-from-template.test.ts` |
| `TEMPLATE_MANIFEST_NOT_FOUND` / `TEMPLATE_INCOMPATIBLE` | template | `create-project-from-template.test.ts` |

- [ ] **Step final da Task 8**

```bash
pnpm test
```

Expected: todos os pacotes verdes.

```bash
git add -A
git commit -m "test: complete per-code trigger coverage for public Kaleido errors"
```

---

### Task 9: Testes estáticos — proibir strings legacy no segundo argumento de `KaleidoError`

**Files:**

- Modify: `packages/core/src/errors/error-surface.test.ts`
- Modify: `packages/core/src/errors/error-codes.test.ts` (reduzir duplicação: extrair `listSourceFiles` para `packages/core/src/errors/source-tree.ts` se necessário, ou importar função local duplicada — preferir um único módulo `source-tree.ts` com `listRepoSourceFiles()` usado por ambos)

- [ ] **Step 1: Adicionar regex para `new KaleidoError(..., "LEGACY_UNPREFIXED")`**

Walker igual ao de `error-surface.test.ts` sobre `packages/cli/src`, `packages/core/src`, `packages/client/src`. Para cada `new KaleidoError`, se o segundo argumento for literal string matching `[A-Z0-9_]+` e **não** começar com `KALEIDO_`, falhar o teste (capturar linha).

Manter teste existente que proíbe `,"KALEIDO_` literal (força `KaleidoErrorCode.`).

- [ ] **Step 2: Corrigir violações** (ex.: `generate-bindings.test.ts` com `"KALEIDO_ARTIFACT_NOT_FOUND"` → `KaleidoErrorCode`).

- [ ] **Step 3: Rodar**

```bash
pnpm --filter @kaleido/core run test
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/errors/error-surface.test.ts packages/core/src/errors/error-codes.test.ts packages/core/src/errors/source-tree.ts
git commit -m "test: enforce KaleidoError code enum usage across packages"
```

---

### Task 10: Documentação e política de semver

**Files:**

- Modify: `docs/errors.md` (alinhar textos com novos fluxos `TEMPLATE_INVALID`, `XDR_RESULT_FAILED`, etc.)
- Modify: `docs/release/error-code-policy.md` (confirmar bullet list idêntica à spec 02)
- Modify: `docs/client.md` se mencionar apenas um subconjunto de códigos (opcional)

- [ ] **Step 1: Revisar cada linha da tabela** para conter as cinco colunas exigidas pela spec (já presentes; atualizar significados se a semântica mudou).

- [ ] **Step 2: Commit docs**

```bash
git add docs/errors.md docs/release/error-code-policy.md
git commit -m "docs: align error reference with error surface implementation"
```

---

## Self-review (spec 02)

**1. Spec coverage:** Auditoria de `throw` / `process.exit` / `catch` / CLI / schema / arquivos / Stellar / templates / artifacts / XDR / wallet está coberta por: (a) walker + regex estáticos, (b) matriz de testes por código, (c) mudanças em `runCommand`, build/deploy/bindings/invoke, client XDR/wallet, templates. `process.exit` no CLI permanece apenas `exitCode` em `errors.ts` / `index.ts` — aceitável se nenhum `process.exit(1)` sem código propagado; a spec lista `process.exit` para auditoria manual: adicionar nota em `docs/release/error-code-policy.md` de que o CLI usa `process.exitCode` e imprime código via `printError`.

**2. Placeholder scan:** Plano sem TBD; passos incluem código e comandos completos.

**3. Type consistency:** `failureCode` usa `KaleidoErrorCodeValue`; imports de `KaleidoErrorCode.js` vs `KaleidoError.js` alinhados após reexport.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-13-kaleido-error-surface-completeness.md`. Duas opções de execução:**

**1. Subagent-Driven (recomendado)** — um subagente fresco por task, revisão entre tasks, iteração rápida. **SUB-SKILL obrigatória:** superpowers:subagent-driven-development.

**2. Inline Execution** — executar tasks nesta sessão com superpowers:executing-plans, em lotes com checkpoints para revisão.

**Qual abordagem você prefere?**
