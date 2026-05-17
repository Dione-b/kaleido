# Multi-Contract Dependency Deploy (Spec 05) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que o fluxo de deploy multi-contrato com `dependsOn`, ordenação topológica, placeholders `${contracts.<name>.contractId}`, grafo em artefatos e códigos de erro atenda integralmente à spec 05, com testes e documentação alinhados ao código já existente.

**Architecture:** O núcleo já concentra `dependsOn` e `deployArgs` em `ContractConfigSchema`, ordenação DFS com detecção de ciclo em `resolveDeployOrder`, resolução estrita de placeholders em `resolveDeployArgs`, orquestração em `deployContractGraph` e persistência de `dependencyGraph` / `dependencies` / `resolvedDeployArgs` via `updateArtifact`. Este plano prioriza **verificação**, **extração do módulo `dependency-graph.ts` como na spec**, **lacunas de teste** (`--force`, deploy completo sem nome de contrato, skip quando artefato existe) e **correção de drift** em `docs/architecture.md` (tabela ADR 0005 ainda marca Draft).

**Tech Stack:** pnpm workspaces, TypeScript, Vitest, Zod (`config` + `artifacts`), Commander (`@caatinga/cli`), `@caatinga/core`.

**Nota de contexto:** A skill *writing-plans* recomenda worktree dedicado (brainstorming). Use um worktree limpo se a branch atual misturar outras mudanças.

---

## File structure (repo map)

| Path | Responsibility |
|------|----------------|
| `packages/core/src/config/config.schema.ts` | `dependsOn`, `deployArgs` por contrato |
| `packages/core/src/artifacts/artifact.schema.ts` | `ContractArtifact` com `dependencies`, `resolvedDeployArgs`; rede com `dependencyGraph` |
| `packages/core/src/artifacts/update-artifact.ts` | Mescla `dependencyGraph` na rede ao atualizar um contrato |
| `packages/core/src/contracts/resolve-deploy-order.ts` | `resolveDeployOrder` (topo ordem + erros `NOT_FOUND` / `CYCLE`) — hoje também exporta `buildDependencyGraph` |
| `packages/core/src/contracts/dependency-graph.ts` | **Criar:** `buildDependencyGraph` isolado (alinhamento à spec 05 “Core modules”) |
| `packages/core/src/contracts/resolve-deploy-args.ts` | Somente placeholder `${contracts.<name>.contractId}`; erros `PLACEHOLDER_*` e `ARTIFACT_NOT_FOUND` |
| `packages/core/src/contracts/deploy-contract-graph.ts` | Lê artefatos por iteração; `resolveDeployArgs` antes de cada deploy; repassa `resolvedDeployArgs` e `dependsOn` |
| `packages/core/src/contracts/deploy-contract.ts` | Skip se `contractId` e `!force`; Stellar deploy; `updateArtifact` com grafo completo |
| `packages/core/src/errors/CaatingaErrorCode.ts` | Códigos `CAATINGA_CONTRACT_DEPENDENCY_*`, `CAATINGA_DEPLOY_ARG_PLACEHOLDER_*` |
| `packages/cli/src/commands/deploy.command.ts` | `deploy [contract]`, `--no-deps`, `--force` |
| `packages/templates/marketplace-with-token/*` | Template oficial (já demonstra token + marketplace + README) |
| `docs/adr/0005-multi-contract-dependency-deploy.md` | ADR já **Accepted** — revisar bullets da spec |
| `docs/architecture.md` | Tabela ADR — **corrigir** status 0005 e texto obsoleto |
| `docs/config.md`, `docs/cli.md` | Já descrevem multi-contract; revisão rápida após mudanças |

**Baseline:** Em 2026-05-13 o repositório já implementa a maior parte da spec (core + CLI + template + ADR Accepted). O trabalho restante é principalmente **estrutura de arquivo da spec**, **testes de aceite explícitos** e **docs/architecture.md**.

---

### Task 1: Verificar baseline (types + testes)

**Files:**

- Read-only: monorepo

- [ ] **Step 1: Typecheck**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga && pnpm typecheck
```

Expected: exit code `0`.

- [ ] **Step 2: Testes do core**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga && pnpm --filter @caatinga/core test
```

Expected: Vitest conclui com sucesso; em especial `resolve-deploy-order.test.ts`, `resolve-deploy-args.test.ts`, `deploy-contract-graph.test.ts`, `deploy-contract.test.ts`, `error-surface.test.ts`.

- [ ] **Step 3: Commit**

Somente se corrigiu algo. Caso contrário, sem commit.

```bash
git add -A
git commit -m "chore: verify spec 05 multi-contract deploy baseline"
```

---

### Task 2: Extrair `buildDependencyGraph` para `dependency-graph.ts`

**Files:**

- Create: `packages/core/src/contracts/dependency-graph.ts`
- Create: `packages/core/src/contracts/dependency-graph.test.ts`
- Modify: `packages/core/src/contracts/resolve-deploy-order.ts` (remover `buildDependencyGraph`; manter só `resolveDeployOrder`)
- Modify: `packages/core/src/contracts/deploy-contract.ts` (importar `buildDependencyGraph` de `./dependency-graph.js`)
- Modify: `packages/core/src/index.ts` (exportar `buildDependencyGraph` de `./contracts/dependency-graph.js` e `resolveDeployOrder` de `./contracts/resolve-deploy-order.js`)

- [ ] **Step 1: Escrever teste que falha (módulo ainda não existe)**

Create `packages/core/src/contracts/dependency-graph.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildDependencyGraph } from "./dependency-graph.js";

describe("buildDependencyGraph", () => {
  it("should_map_each_contract_name_to_its_dependsOn_list", () => {
    const contracts = {
      token: { path: "./t", wasm: "./t.wasm", dependsOn: [] as string[], deployArgs: {} },
      marketplace: {
        path: "./m",
        wasm: "./m.wasm",
        dependsOn: ["token"],
        deployArgs: {}
      }
    };
    expect(buildDependencyGraph(contracts)).toEqual({
      token: [],
      marketplace: ["token"]
    });
  });
});
```

- [ ] **Step 2: Rodar teste e ver falha**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga/packages/core && pnpm exec vitest run src/contracts/dependency-graph.test.ts
```

Expected: FAIL (cannot find module `./dependency-graph.js` ou equivalente).

- [ ] **Step 3: Implementar `dependency-graph.ts`**

Create `packages/core/src/contracts/dependency-graph.ts`:

```typescript
import type { ContractConfig } from "../config/config.schema.js";

export function buildDependencyGraph(contracts: Record<string, ContractConfig>): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  for (const name of Object.keys(contracts)) {
    graph[name] = [...contracts[name].dependsOn];
  }
  return graph;
}
```

Modify `packages/core/src/contracts/resolve-deploy-order.ts`: delete the entire `buildDependencyGraph` function and its body (lines 6–12 no estado atual), keeping imports and `resolveDeployOrder` only.

Modify `packages/core/src/contracts/deploy-contract.ts`: change

```typescript
import { buildDependencyGraph } from "./resolve-deploy-order.js";
```

to

```typescript
import { buildDependencyGraph } from "./dependency-graph.js";
```

Modify `packages/core/src/index.ts`: replace the single line

```typescript
export { resolveDeployOrder, buildDependencyGraph } from "./contracts/resolve-deploy-order.js";
```

with

```typescript
export { buildDependencyGraph } from "./contracts/dependency-graph.js";
export { resolveDeployOrder } from "./contracts/resolve-deploy-order.js";
```

- [ ] **Step 4: Rodar testes afetados**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga/packages/core && pnpm exec vitest run src/contracts/dependency-graph.test.ts src/contracts/resolve-deploy-order.test.ts src/contracts/deploy-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/contracts/dependency-graph.ts packages/core/src/contracts/dependency-graph.test.ts packages/core/src/contracts/resolve-deploy-order.ts packages/core/src/contracts/deploy-contract.ts packages/core/src/index.ts
git commit -m "refactor: extract buildDependencyGraph to dependency-graph module"
```

---

### Task 3: Corrigir status do ADR 0005 em `docs/architecture.md`

**Files:**

- Modify: `docs/architecture.md` (tabela ADR e parágrafo logo abaixo)

- [ ] **Step 1: Aplicar alteração**

Na seção “Architecture Decision Records”, substituir a linha da tabela:

```markdown
| [0005](./adr/0005-multi-contract-dependency-deploy.md) | Draft | Multi-contract `dependsOn` and contractId injection |
```

por:

```markdown
| [0005](./adr/0005-multi-contract-dependency-deploy.md) | Accepted | Multi-contract `dependsOn` and contractId injection |
```

Substituir o parágrafo:

```markdown
**0001–0004** are ratified. **0005** remains a draft until dependency deploy sequencing is implemented.
```

por:

```markdown
**0001–0005** are ratified; multi-contract deploy sequencing and placeholder resolution are implemented in `@caatinga/core` and documented in ADR 0005.
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: align architecture ADR table with accepted 0005"
```

---

### Task 4: Teste — `deployContract` pula Stellar quando artefato já tem `contractId` e `force` é falso

**Files:**

- Modify: `packages/core/src/contracts/deploy-contract.test.ts`

- [ ] **Step 1: Escrever teste (mock de `runCommand` deve permanecer não chamado para deploy)**

Add dentro de `describe("deployContract", () => { ... })` um novo `it`:

```typescript
  it("should_skip_stellar_deploy_when_artifact_has_contractId_and_force_is_false", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "caatinga-deploy-skip-"));
    const wasmPath = path.join(tmpDir, "rel", "counter.wasm");
    await mkdir(path.dirname(wasmPath), { recursive: true });
    await writeFile(wasmPath, Buffer.from("wasm-bytes"), "utf8");

    const artifacts = createInitialArtifacts("app");
    artifacts.networks.testnet = {
      contracts: {
        counter: {
          contractId: CONTRACT_ID,
          wasmHash: "a".repeat(64),
          deployedAt: "2026-05-12T00:00:00.000Z",
          sourcePath: "./contracts/counter",
          wasmPath: "./rel/counter.wasm",
          dependencies: [],
          resolvedDeployArgs: {}
        }
      },
      dependencyGraph: { counter: [] }
    };
    await writeArtifacts(artifacts, tmpDir);

    const result = await deployContract({
      config: baseConfig,
      contractName: "counter",
      networkName: "testnet",
      source: "alice",
      cwd: tmpDir,
      force: false
    });

    expect(result.skipped).toBe(true);
    expect(result.contractId).toBe(CONTRACT_ID);
    expect(runCommand).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Rodar o arquivo de teste**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga/packages/core && pnpm exec vitest run src/contracts/deploy-contract.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/contracts/deploy-contract.test.ts
git commit -m "test: skip stellar when contract already deployed without force"
```

---

### Task 5: Testes — `deployContractGraph` com deploy completo e com `--force`

**Files:**

- Modify: `packages/core/src/contracts/deploy-contract-graph.test.ts`

- [ ] **Step 1: Adicionar teste “full graph” sem `contractName`**

Add ao `describe("deployContractGraph", () => { ... })`:

```typescript
  it("deploys_all_contracts_in_topological_order_when_contractName_is_omitted", async () => {
    const store: {
      networks: {
        testnet: { contracts: Record<string, { contractId: string }>; dependencyGraph: Record<string, string[]> };
      };
    } = {
      networks: {
        testnet: { contracts: {}, dependencyGraph: {} }
      }
    };

    readArtifactsMock.mockImplementation(async () => ({
      project: "marketplace-app",
      version: 1 as const,
      networks: store.networks
    }));

    deployContractMock.mockImplementation(async (opts: { contractName: string }) => {
      const id = opts.contractName === "token" ? "C".padEnd(56, "A") : "C".padEnd(56, "B");
      store.networks.testnet.contracts[opts.contractName] = { contractId: id };
      return { contractId: id, contract: { name: opts.contractName } };
    });

    const result = await deployContractGraph({
      config,
      networkName: "testnet",
      source: "alice",
      cwd: "/tmp/app",
      includeDependencies: true,
      force: false
    });

    expect(result.deployedContracts.map((c) => c.name)).toEqual(["token", "marketplace"]);
    expect(deployContractMock).toHaveBeenCalledTimes(2);
  });
```

- [ ] **Step 2: Adicionar teste `--force` redeploya mesmo com artefatos**

```typescript
  it("should_call_deploy_for_each_contract_when_force_true_even_if_artifacts_have_ids", async () => {
    const existingToken = "C".padEnd(56, "X");
    const existingMarket = "C".padEnd(56, "Y");
    const store: {
      networks: {
        testnet: { contracts: Record<string, { contractId: string }>; dependencyGraph: Record<string, string[]> };
      };
    } = {
      networks: {
        testnet: {
          contracts: {
            token: { contractId: existingToken },
            marketplace: { contractId: existingMarket }
          },
          dependencyGraph: { token: [], marketplace: ["token"] }
        }
      }
    };

    readArtifactsMock.mockImplementation(async () => ({
      project: "marketplace-app",
      version: 1 as const,
      networks: store.networks
    }));

    deployContractMock.mockImplementation(async (opts: { contractName: string }) => {
      const id = opts.contractName === "token" ? "C".padEnd(56, "1") : "C".padEnd(56, "2");
      store.networks.testnet.contracts[opts.contractName] = { contractId: id };
      return { contractId: id, contract: { name: opts.contractName } };
    });

    await deployContractGraph({
      config,
      networkName: "testnet",
      source: "alice",
      cwd: "/tmp/app",
      includeDependencies: true,
      force: true
    });

    expect(deployContractMock).toHaveBeenCalledTimes(2);
    expect(deployContractMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ contractName: "token", force: true }));
    expect(deployContractMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ contractName: "marketplace", force: true }));
  });
```

- [ ] **Step 3: Rodar testes do arquivo**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga/packages/core && pnpm exec vitest run src/contracts/deploy-contract-graph.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/contracts/deploy-contract-graph.test.ts
git commit -m "test: cover full graph deploy and force redeploy in deployContractGraph"
```

---

### Task 6: ADR 0005 — alinhar bullets da spec (se ainda faltar frase explícita)

**Files:**

- Modify: `docs/adr/0005-multi-contract-dependency-deploy.md`

- [ ] **Step 1: Ler ADR atual e comparar com a checklist da spec**

Checklist da spec:

- why `dependsOn` belongs in core  
- why placeholders are explicit  
- why env mutation is rejected  
- artifact schema impact  
- experimental stability if applicable  

O ADR já cobre decisão, placeholders estreitos, `version: 1`, e “experimental until … template”. Se após leitura faltar **uma frase explícita** sobre rejeição de mutação de env / shell (`$(...)`, `${env.*}`), append em **Consequences** (sem reescrever o ADR inteiro):

```markdown
- Shell interpolation and `${env.*}` are out of scope: deploy args are data passed to Stellar CLI, not a second templating language; keeping resolution artifact-only avoids non-reproducible deploys.
```

- [ ] **Step 2: Commit (somente se editou o ADR)**

```bash
git add docs/adr/0005-multi-contract-dependency-deploy.md
git commit -m "docs: clarify env and shell rejection in ADR 0005"
```

---

### Task 7: Verificação final monorepo

**Files:**

- Read-only

- [ ] **Step 1: Rodar suite completa usada no CI (ajuste se o repo usar turbo diferente)**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga && pnpm test
```

Expected: exit code `0`.

- [ ] **Step 2: Commit**

Somente se houve correções de última hora.

---

## Self-review (executado pelo autor do plano)

1. **Spec coverage:** `dependsOn` / grafo acíclico / ordem / placeholders / CLI `--no-deps` / artefatos / códigos de erro / template / ADR → cobertos por baseline + Tasks 2–7.  
2. **Placeholder scan:** Nenhum TBD; passos com código ou comandos concretos.  
3. **Consistência:** `buildDependencyGraph` permanece com a mesma assinatura após extração; exports públicos de `@caatinga/core` preservados.

**Gaps intencionais:** Não duplicar testes já presentes em `resolve-deploy-order.test.ts` e `resolve-deploy-args.test.ts` além do smoke em `dependency-graph.test.ts`.

---

**Plano salvo em** `docs/superpowers/plans/2026-05-13-multi-contract-dependency-deploy.md`.

**Duas opções de execução:**

1. **Subagent-Driven (recomendado)** — dispare um subagente fresco por tarefa, revisão entre tarefas, iteração rápida. **Sub-skill obrigatória:** `superpowers:subagent-driven-development`.

2. **Inline Execution** — execute as tarefas nesta sessão com `superpowers:executing-plans`, em lotes com checkpoints para revisão.

**Qual abordagem você prefere?**
