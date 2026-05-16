# Stellar CLI Version Contract (Spec 01) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declarar, aplicar em runtime e testar um intervalo suportado de versões do Stellar CLI, com override local explícito e sem override em CI.

**Architecture:** Constantes `STELLAR_CLI_MIN_VERSION` e `STELLAR_CLI_TESTED_MAX_VERSION` em `@kaleido-xlm/core` alimentam `parseStellarCliVersion` e `assertSupportedStellarCliVersion`. `checkStellarCliVersion` executa `stellar --version` via `runCommand` com `skipStellarVersionCheck: true` para evitar recursão. `runCommand` chama `checkStellarCliVersion` antes de qualquer outro `stellar` quando `skipStellarVersionCheck` é falso. O pacote `@kaleido-xlm/cli` expõe `--allow-untested-stellar-cli` e repassa `allowUntestedStellarCli` para funções de contrato que chamam `runCommand` / `checkBinary`.

**Tech Stack:** pnpm workspaces, TypeScript, Vitest, `semver`, `execa`, Commander (`@kaleido-xlm/cli`), pacote `@kaleido-xlm/core`.

**Nota de contexto:** A skill *writing-plans* recomenda worktree dedicado (brainstorming). Abra um worktree limpo antes de executar tarefas se a branch atual misturar outras mudanças.

---

## File structure (repo map)

| Path | Responsibility |
|------|----------------|
| `packages/core/src/stellar-cli/version.ts` | Regex + `semver.valid`, `parseStellarCliVersion`, `assertSupportedStellarCliVersion`, constantes de range |
| `packages/core/src/stellar-cli/check-stellar-cli-version.ts` | Orquestra `stellar --version` + assert; mapeia `ENOENT` → `KALEIDO_STELLAR_CLI_NOT_FOUND` |
| `packages/core/src/shell/run-command.ts` | Gate de versão antes de `execa` para comando `stellar` |
| `packages/core/src/shell/check-binary.ts` | `stellar --version` / `rustc --version` via `runCommand` (herda gate stellar) |
| `packages/core/src/errors/KaleidoError.ts` | Códigos `KALEIDO_STELLAR_CLI_*`, `KALEIDO_UNSUPPORTED_CLI_VERSION`, `KALEIDO_UNTESTED_CLI_VERSION` |
| `packages/core/src/contracts/build-contract.ts` (e deploy, invoke, generate-bindings) | Passam `allowUntestedStellarCli` para `checkBinary` / `runCommand` |
| `packages/cli/src/commands/*.command.ts` | Flags `--allow-untested-stellar-cli` nas ações build/deploy/invoke/generate |
| `docs/stellar-cli-version-contract.md` | Contrato público: range, upgrade, regra de CI |
| `docs/errors.md` | Tabela dos códigos públicos (já inclui os quatro códigos Stellar CLI) |
| `docs/testing.md` | Convenção de diretórios de fixtures por semver |
| `packages/core/test/fixtures/stellar-cli/**` | Saídas reais capturadas (`v22.0.0/`, `v26.0.0/`, `unknown/`) |

**Baseline:** No estado do repositório em que este plano foi escrito, os arquivos acima já implementam a maior parte da spec. As tarefas abaixo cobrem **verificação**, **aceitação explícita de “dois semvers de fixture” no CI**, e **pequeno alinhamento de documentação**.

---

### Task 1: Verificar baseline (types, build, testes core)

**Files:**

- Read-only: todos os arquivos da tabela acima

- [ ] **Step 1: Rodar typecheck monorepo**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm typecheck
```

Expected: exit code `0`, sem erros TypeScript.

- [ ] **Step 2: Rodar testes do pacote core**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm --filter @kaleido-xlm/core test
```

Expected: Vitest conclui com sucesso; em especial passam `packages/core/src/stellar-cli/check-stellar-cli-version.test.ts` e `packages/core/src/stellar-cli/run-command-version.test.ts`.

- [ ] **Step 3: Commit (somente se houve mudança local — normalmente skip)**

Se nada mudou, não commitar. Se corrigiu drift, commit convencional, por exemplo:

```bash
git add -A
git commit -m "chore: verify stellar cli version contract baseline"
```

---

### Task 2: Testes de fixture — `parseStellarCliVersion` em dois semvers (aceite CI)

**Motivo:** A spec exige *“CI runs fixture tests for at least two Stellar CLI versions”*. O CI já roda `pnpm test` (turbo). Hoje `parse-contract-id.test.ts` lê fixture principalmente `v26.0.0` e `unknown`. Este passo amarra explicitamente **dois diretórios de semver** (`v22.0.0` e `v26.0.0`) a testes estáveis de parser de versão.

**Files:**

- Create: `packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts`
- Read fixtures: `packages/core/test/fixtures/stellar-cli/v22.0.0/version.v22.0.0.fixture.txt`, `packages/core/test/fixtures/stellar-cli/v26.0.0/version.txt`

- [ ] **Step 1: Criar arquivo de teste (conteúdo completo)**

Create `packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts`:

```typescript
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseStellarCliVersion } from "./version.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, "../../test/fixtures/stellar-cli");

async function readFixture(relativePath: string): Promise<string> {
  return readFile(path.join(fixturesDir, relativePath), "utf8");
}

describe("parseStellarCliVersion (checked-in fixtures)", () => {
  it("should_parse_semver_from_v22_0_0_version_fixture", async () => {
    const output = await readFixture("v22.0.0/version.v22.0.0.fixture.txt");
    expect(parseStellarCliVersion(output)).toBe("22.0.0");
  });

  it("should_parse_semver_from_v26_0_0_version_fixture", async () => {
    const output = await readFixture("v26.0.0/version.txt");
    expect(parseStellarCliVersion(output)).toBe("26.0.0");
  });
});
```

- [ ] **Step 2: Rodar só este arquivo de teste**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido/packages/core && pnpm exec vitest run src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts -v
```

Expected: `2 passed` (ou equivalente), exit code `0`.

- [ ] **Step 3: Rodar suite completa do core**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm --filter @kaleido-xlm/core test
```

Expected: todos os testes passam.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/stellar-cli/parse-stellar-cli-version.fixtures.test.ts
git commit -m "test: cover parseStellarCliVersion with two semver fixtures"
```

---

### Task 3: Documentação — exemplo explícito do flag local

**Files:**

- Modify: `docs/stellar-cli-version-contract.md` (seção após “Local override” ou equivalente)

- [ ] **Step 1: Inserir seção com exemplos de CLI**

Após o parágrafo que menciona `--allow-untested-stellar-cli`, acrescente ao `docs/stellar-cli-version-contract.md` o seguinte trecho (copiar como um bloco único):

```markdown
### Exemplos locais (override)

Execute apenas localmente, por exemplo:

- `kaleido build counter --allow-untested-stellar-cli`
- `kaleido deploy counter -s <identity> --allow-untested-stellar-cli`
- `kaleido generate counter --allow-untested-stellar-cli`
- `kaleido invoke counter.increment -s <identity> --allow-untested-stellar-cli` (substitua `<identity>` pelo alias ou endereço configurado no Stellar CLI)

Use apenas em máquina de desenvolvimento quando aceitar risco de incompatibilidade de saída ou flags do Stellar CLI.
```

- [ ] **Step 2: Commit**

```bash
git add docs/stellar-cli-version-contract.md
git commit -m "docs: add local examples for allow-untested-stellar-cli flag"
```

---

### Task 4: Garantir que CI não usa o override

**Files:**

- Grep-only: `.github/workflows/*.yml`, `scripts/**`

- [ ] **Step 1: Buscar o flag em automação**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && rg "allow-untested-stellar-cli" .github scripts packages --glob "*.yml" --glob "*.yaml" --glob "*.sh"
```

Expected: **nenhum** match em workflows ou scripts de CI; apenas em `packages/cli/src/commands/*.ts` e documentação.

- [ ] **Step 2: Se encontrar em CI, remover e commitar**

Se `rg` encontrar uso indevido, remover a flag do job e commit:

```bash
git add .github/workflows/<file>.yml
git commit -m "fix: remove untested stellar CLI override from CI"
```

Se não encontrar, marcar esta tarefa como verificação concluída sem commit.

---

### Task 5: Export público (opcional de verificação)

**Files:**

- Modify (only if missing): `packages/core/src/index.ts`

- [ ] **Step 1: Confirmar exports**

Abrir `packages/core/src/index.ts` e confirmar que existem linhas equivalentes a:

```typescript
export * from "./stellar-cli/version.js";
```

Se `parseStellarCliVersion` / constantes já forem reexportadas, nenhuma mudança.

- [ ] **Step 2: Se alterou `index.ts`, rodar typecheck e commit**

```bash
pnpm typecheck
git add packages/core/src/index.ts
git commit -m "fix: export stellar CLI version helpers from core"
```

---

## Self-review (checklist interno)

**1. Spec coverage**

| Requisito da spec | Tarefa |
|-------------------|--------|
| Constantes min / tested max em `@kaleido-xlm/core` | Baseline Task 1 — já em `version.ts` |
| `parseStellarCliVersion` + erros | Baseline — `version.ts` + `KaleidoErrorCode` |
| Check antes de shell stellar | Baseline — `run-command.ts` |
| `--allow-untested-stellar-cli` só local | Baseline CLI + Task 4 |
| Códigos de erro listados | Baseline — `KaleidoError.ts` + `docs/errors.md` |
| Testes: parse conhecido, old fail, untested default fail, override pass, run-command gate | Baseline — `check-stellar-cli-version.test.ts`, `run-command-version.test.ts` |
| Fixtures com semver no nome | Parcial na spec (ex.: `deploy.v22…`); repo usa diretórios `v22.0.0/` e nomes mistos documentados em `docs/testing.md` — aceitável; Task 2 reforça **dois semvers** via fixtures existentes |
| Docs: range, upgrade, flag, CI | Task 3 reforça exemplos; `docs/stellar-cli-version-contract.md` já cobre o restante |
| CI + dois semvers | Task 2 amarra testes de fixture; `pnpm test` no CI executa turbo |

**Gaps corrigidos por este plano:** teste explícito de fixture em dois semvers; exemplo de CLI na doc; verificação explícita de ausência do flag em CI.

**2. Placeholder scan:** Nenhum TBD / “implement later” / passos sem comando ou código onde aplicável.

**3. Type consistency:** `allowUntestedStellarCli` em `RunCommandOptions`, `checkStellarCliVersion({ allowUntested })`, e CLI `options.allowUntestedStellarCli === true` permanecem alinhados (padrão já no repositório).

---

## Self-review — execution handoff

**Plano salvo em:** `docs/superpowers/plans/2026-05-13-stellar-cli-version-contract.md`

**Duas opções de execução:**

1. **Subagent-Driven (recomendado)** — um subagente por tarefa, revisão entre tarefas, iteração rápida. **SUB-SKILL obrigatória:** `superpowers:subagent-driven-development`.

2. **Inline Execution** — executar as tarefas nesta sessão com checkpoints. **SUB-SKILL obrigatória:** `superpowers:executing-plans`.

**Qual abordagem você prefere?**
