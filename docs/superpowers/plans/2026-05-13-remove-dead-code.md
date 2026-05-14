# Remove Dead Code, Unused Imports e Dependências Não Usadas — Plano de Implementação

> **Para workers agentic:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano passo a passo. Os passos usam checkbox (`- [ ]`) para rastreio.

**Goal:** Eliminar código morto, símbolos e importações TypeScript sem uso e dependências de `package.json` realmente não referenciadas no monorepo `@kaleido/*`, mantendo build, typecheck e testes verdes — sem analisar `node_modules` nem `pnpm-lock.yaml` (ferramentas já as ignoram por padrão).

**Architecture:** (1) Endurecer o compilador com `noUnusedLocals` e `noUnusedParameters` em `tsconfig.base.json` (somente os pacotes que estendem esse base: `packages/core`, `packages/cli`, `packages/client`; templates têm `tsconfig.json` próprio). Para parâmetros exigidos pela assinatura mas não usados, usar nome com prefixo `_` (ex.: `_value`). (2) Corrigir todos os diagnósticos TS. (3) Opcionalmente rodar **Knip** na raiz com `ignoreWorkspaces: ["packages/templates/*"]` para dependências/exportações mortas (`__PROJECT_NAME__` nos templates quebra análise útil neles). TDD literal não se aplica a remoção pura; use `pnpm typecheck` e `pnpm test` como barreira.

**Tech Stack:** pnpm 9, Turbo, TypeScript 5.7, Vitest 2, tsup; monorepo em `packages/*` e `examples/*`.

**Escopo explícito:** Inclui `packages/core`, `packages/cli`, `packages/client`. **Fora do escopo automático:** `packages/templates/**` (projetos esqueleto com nome placeholder; typecheck isolado exige `pnpm install` dentro do template). `examples/*` hoje só contém markdown; não há TS. Não editar `pnpm-lock.yaml` nem varrer `node_modules`.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `tsconfig.base.json` | Opções TS compartilhadas pelos três pacotes principais; recebe `noUnusedLocals` / `noUnusedParameters`. |
| `packages/core/src/artifacts/read-write-artifacts.test.ts` | Teste; remover import `mkdir` não usado. |
| `packages/core/src/contracts/build-contract.test.ts` | Teste; remover import `readFile` não usado. |
| `packages/core/src/contracts/generate-bindings.test.ts` | Teste; remover import `writeFile` não usado. |
| `packages/core/src/contracts/invoke-contract.test.ts` | Teste; remover import `writeFile` não usado. |
| `package.json` (raiz) | Script `knip` e devDependency `knip` (opcional, Task 3). |
| `knip.json` (raiz) | Configuração Knip: entradas dos pacotes e ignorar templates. |

---

### Task 1: Baseline de typecheck (sem flags novas)

**Files:** nenhuma modificação.

- [ ] **Step 1: Rodar typecheck atual**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm typecheck
```

Expected: concluir com sucesso (exit code 0). Se falhar, corrigir o baseline antes de prosseguir.

- [ ] **Step 2: Commit**

Somente se não houver mudanças; caso contrário pule. Não há commit neste task se o working tree estiver limpo.

```bash
# Nada a commitar se apenas verificação
```

---

### Task 2: Ativar `noUnusedLocals` / `noUnusedParameters` e corrigir violações em `@kaleido/core`

**Files:**
- Modify: `tsconfig.base.json`
- Modify: `packages/core/src/artifacts/read-write-artifacts.test.ts`
- Modify: `packages/core/src/contracts/build-contract.test.ts`
- Modify: `packages/core/src/contracts/generate-bindings.test.ts`
- Modify: `packages/core/src/contracts/invoke-contract.test.ts`

- [ ] **Step 1: “Teste” vermelho — typecheck com flags na linha de comando (antes de commitar flags)**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm exec tsc --noEmit -p packages/core/tsconfig.json --noUnusedLocals --noUnusedParameters 2>&1
```

Expected: **FAIL** (exit code 2) com exatamente estes quatro diagnósticos `TS6133`:

- `read-write-artifacts.test.ts(1,10): 'mkdir' is declared but its value is never read.`
- `build-contract.test.ts(1,26): 'readFile' is declared but its value is never read.`
- `generate-bindings.test.ts(1,23): 'writeFile' is declared but its value is never read.`
- `invoke-contract.test.ts(1,23): 'writeFile' is declared but its value is never read.`

- [ ] **Step 2: Adicionar flags ao `tsconfig.base.json`**

Substituir o bloco `compilerOptions` inteiro pelo conteúdo abaixo (preserva todas as chaves existentes e acrescenta as duas últimas):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

- [ ] **Step 3: Corrigir import em `read-write-artifacts.test.ts`**

Trocar a linha 1 de:

```typescript
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
```

para:

```typescript
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
```

- [ ] **Step 4: Corrigir import em `build-contract.test.ts`**

Trocar a linha 1 de:

```typescript
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
```

para:

```typescript
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
```

- [ ] **Step 5: Corrigir import em `generate-bindings.test.ts`**

Trocar a linha 1 de:

```typescript
import { mkdtemp, rm, writeFile } from "node:fs/promises";
```

para:

```typescript
import { mkdtemp, rm } from "node:fs/promises";
```

- [ ] **Step 6: Corrigir import em `invoke-contract.test.ts`**

Trocar a linha 1 de:

```typescript
import { mkdtemp, rm, writeFile } from "node:fs/promises";
```

para:

```typescript
import { mkdtemp, rm } from "node:fs/promises";
```

- [ ] **Step 7: Verificar typecheck do monorepo**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm typecheck
```

Expected: **PASS** (exit code 0).

- [ ] **Step 8: Rodar testes**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm test
```

Expected: **PASS** (exit code 0).

- [ ] **Step 9: Commit**

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && git add tsconfig.base.json packages/core/src/artifacts/read-write-artifacts.test.ts packages/core/src/contracts/build-contract.test.ts packages/core/src/contracts/generate-bindings.test.ts packages/core/src/contracts/invoke-contract.test.ts && git commit -m "chore: enforce unused locals/parameters and fix core test imports"
```

---

### Task 3 (opcional): Knip — dependências e exportações não usadas

**Files:**
- Create: `knip.json`
- Modify: `package.json` (raiz)

- [ ] **Step 1: Instalar Knip na raiz**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm add -D knip@5
```

Expected: `package.json` e `pnpm-lock.yaml` atualizados (lockfile é efeito colateral do pnpm; **não** editar o lock manualmente).

- [ ] **Step 2: Criar `knip.json` na raiz**

Conteúdo completo do arquivo (chaves de `workspaces` são caminhos relativos à raiz do repositório; `ignoreWorkspaces` aceita globs conforme [documentação do Knip](https://knip.dev/reference/configuration)):

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "ignoreWorkspaces": ["packages/templates/*"],
  "workspaces": {
    "packages/core": {
      "entry": "src/index.ts",
      "project": ["src/**/*.ts"]
    },
    "packages/cli": {
      "entry": "src/index.ts",
      "project": ["src/**/*.ts"]
    },
    "packages/client": {
      "entry": ["src/index.ts", "src/freighter.ts"],
      "project": ["src/**/*.ts"]
    }
  }
}
```

- [ ] **Step 3: Executar Knip**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm exec knip
```

Expected: exit code 0 após resolver todos os achados **reais** (dependências não usadas, exportações não usadas). Se Knip listar um export público intencional da API (`packages/*/src/index.ts`), adicionar anotação documentada pelo Knip (ex.: comentário `/** knipignore */` na exportação ou entrada em `knip.json` via `ignoreExports`) — só suprimir com justificativa de API pública.

- [ ] **Step 4: Adicionar script `knip` no `package.json` raiz**

Dentro de `"scripts"`, adicionar a chave:

```json
"knip": "knip"
```

(manter vírgulas JSON válidas em relação às chaves vizinhas).

- [ ] **Step 5: Verificação**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && pnpm typecheck && pnpm test && pnpm knip
```

Expected: tudo **PASS**.

- [ ] **Step 6: Commit**

```bash
cd /home/dionebastos/Documentos/PROJETOS/kaleido && git add package.json pnpm-lock.yaml knip.json && git add -u packages/*/package.json && git commit -m "chore: add knip for unused deps and exports"
```

(Ajuste `git add` para incluir apenas arquivos que de fato mudaram após a limpeza do Knip.)

---

## Auto-revisão (checklist interna)

1. **Cobertura do pedido:** Código/imports não usados → Task 2 (`tsc` + correções). Dependências npm não usadas → Task 3 (Knip). `node_modules` e `pnpm-lock.yaml` ignorados como solicitado (sem varredura manual do lock).
2. **Placeholders:** Nenhum TBD; caminhos e comandos explícitos.
3. **Consistência:** Nomes de arquivos e mensagens `TS6133` batem com o estado medido em 2026-05-13 no repositório; se novos unused aparecerem após merges, repetir Step 7 da Task 2 e corrigir antes de commitar.

---

## Handoff de execução

**Plano salvo em:** `docs/superpowers/plans/2026-05-13-remove-dead-code.md`

**Duas opções de execução:**

1. **Subagent-Driven (recomendado)** — um subagente por task, revisão entre tasks, iteração rápida. SUB-SKILL: `superpowers:subagent-driven-development`.

2. **Inline Execution** — executar tasks nesta sessão com checkpoints. SUB-SKILL: `superpowers:executing-plans`.

**Qual abordagem você prefere?**

Antes de declarar conclusão em qualquer implementação, use `superpowers:verification-before-completion` e confira saída real de `pnpm typecheck` e `pnpm test`.
