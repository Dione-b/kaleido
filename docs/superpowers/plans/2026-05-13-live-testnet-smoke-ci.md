# Live Testnet Smoke CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que o CI de smoke na testnet da Stellar cumpra a spec `04-live-testnet-smoke-ci.md`: fluxo completo `init → build → deploy → generate → invoke`, identidade só por alias, asserções explícitas, artefatos de diagnóstico, retry apenas para falha transitória de rede e documentação operacional para o gate de release (3 runs verdes consecutivos).

**Architecture:** Manter o fluxo em `scripts/testnet-smoke.sh` orquestrando o CLI já empacotado no monorepo; extrair a política “transitório vs não-retry” para uma função pura em `@caatinga/core` (testada com Vitest) consumida pelo script via `node` após `pnpm build`. O workflow GitHub Actions grava `GITHUB_OUTPUT` quando o script sai com código `2` (transitório) para condicionar um único retry; saída `1` falha o job sem retry. Artefatos versionados e log consolidado ficam sob um diretório no repositório raiz antes do upload.

**Tech Stack:** Bash, Node 20, pnpm, Vitest, GitHub Actions, `@caatinga/core` (tsup bundle via `src/index.ts`).

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/core/src/ci/is-transient-testnet-smoke-failure.ts` | Classifica texto de log (stderr/stdout capturado) como falha transitória de testnet **após** excluir erros de versão CLI e códigos `CAATINGA_*` de parser/config que não devem retry. |
| `packages/core/src/ci/is-transient-testnet-smoke-failure.test.ts` | Vitest: casos positivos (timeout, 503, ECONNRESET), negativos (`CAATINGA_UNSUPPORTED_CLI_VERSION`, `CAATINGA_INVALID_CONFIG`), e borda (vazio). |
| `packages/core/src/index.ts` | Re-export público da função de classificação. |
| `scripts/testnet-smoke.sh` | Fluxo spec; `tee` de log; arquivos de versão; validações pós-passos; saída `0` / `1` / `2`; escreve `transient=true` em `GITHUB_OUTPUT` antes de `exit 2`. |
| `.github/workflows/testnet-smoke.yml` | Triggers já corretos; ajustar retry condicional; expandir `upload-artifact`. |
| `docs/testing.md` | Documentar códigos de saída do smoke, artefatos e variáveis de segredo. |
| `docs/release/v1-readiness.md` | Opcional: uma linha apontando como verificar “3 runs consecutivos” na UI do Actions (sem automação obrigatória). |

---

### Task 1: Classificador de falha transitória (`@caatinga/core`)

**Files:**

- Create: `packages/core/src/ci/is-transient-testnet-smoke-failure.ts`
- Create: `packages/core/src/ci/is-transient-testnet-smoke-failure.test.ts`
- Modify: `packages/core/src/index.ts` (adicionar `export`)

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/ci/is-transient-testnet-smoke-failure.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { isTransientTestnetSmokeFailure } from "./is-transient-testnet-smoke-failure.js";

describe("isTransientTestnetSmokeFailure", () => {
  it("should_return_true_when_log_contains_network_timeout", () => {
    expect(isTransientTestnetSmokeFailure("request i/o timeout")).toBe(true);
  });

  it("should_return_true_when_log_contains_503", () => {
    expect(isTransientTestnetSmokeFailure("upstream returned 503")).toBe(true);
  });

  it("should_return_false_when_log_contains_unsupported_cli_code", () => {
    expect(
      isTransientTestnetSmokeFailure("Error CAATINGA_UNSUPPORTED_CLI_VERSION: bump stellar")
    ).toBe(false);
  });

  it("should_return_false_when_log_contains_version_parse_failure", () => {
    expect(
      isTransientTestnetSmokeFailure("CAATINGA_STELLAR_CLI_VERSION_PARSE_FAILED")
    ).toBe(false);
  });

  it("should_return_false_when_log_contains_invalid_config", () => {
    expect(isTransientTestnetSmokeFailure("CAATINGA_INVALID_CONFIG")).toBe(false);
  });

  it("should_return_false_when_empty", () => {
    expect(isTransientTestnetSmokeFailure("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga/packages/core && pnpm exec vitest run src/ci/is-transient-testnet-smoke-failure.test.ts
```

Expected: FAIL (module not found or function not exported).

- [ ] **Step 3: Write minimal implementation**

Create `packages/core/src/ci/is-transient-testnet-smoke-failure.ts`:

```typescript
const NO_RETRY_CAATINGA_SUBSTRINGS = [
  "CAATINGA_UNSUPPORTED_CLI_VERSION",
  "CAATINGA_UNTESTED_CLI_VERSION",
  "CAATINGA_STELLAR_CLI_VERSION_PARSE_FAILED",
  "CAATINGA_STELLAR_CLI_NOT_FOUND",
  "CAATINGA_INVALID_CONFIG",
  "CAATINGA_CONFIG_NOT_FOUND"
];

const TRANSIENT_PATTERN =
  /timeout|i\/o timeout|econnreset|connection reset|503|502|429|rate limit|temporar|bad gateway|fetch failed|network error|unavailable/i;

export function isTransientTestnetSmokeFailure(logText: string): boolean {
  if (!logText.trim()) {
    return false;
  }
  for (const marker of NO_RETRY_CAATINGA_SUBSTRINGS) {
    if (logText.includes(marker)) {
      return false;
    }
  }
  return TRANSIENT_PATTERN.test(logText);
}
```

Append to `packages/core/src/index.ts` after existing exports (before end of file):

```typescript
export { isTransientTestnetSmokeFailure } from "./ci/is-transient-testnet-smoke-failure.js";
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga/packages/core && pnpm exec vitest run src/ci/is-transient-testnet-smoke-failure.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga
git add packages/core/src/ci/is-transient-testnet-smoke-failure.ts packages/core/src/ci/is-transient-testnet-smoke-failure.test.ts packages/core/src/index.ts
git commit -m "feat(core): classify transient testnet smoke failures for CI retry"
```

---

### Task 2: Script de smoke com log, versões, asserções e códigos de saída

**Files:**

- Modify: `scripts/testnet-smoke.sh`

- [ ] **Step 1: Replace `scripts/testnet-smoke.sh` with the implementation below**

`CORE_INDEX` must always point at the bundle built by `pnpm build` (workflow already runs build before smoke). Use it in every `node --input-type=module -e` snippet so classification works after `cd` into the app directory.

Full `scripts/testnet-smoke.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$ROOT_DIR/node_modules/.bin:$PATH"
CORE_INDEX="${ROOT_DIR}/packages/core/dist/index.js"

APP_NAME="${1:-smoke-app}"
IDENTITY_ALIAS="${CAATINGA_CI_IDENTITY_ALIAS:?CAATINGA_CI_IDENTITY_ALIAS is required}"
ARTIFACT_DIR="$ROOT_DIR/smoke-ci-out"
LOG_FILE="$ARTIFACT_DIR/${APP_NAME}-smoke.log"
CAATINGA_VERSION_FILE="$ARTIFACT_DIR/${APP_NAME}-caatinga-version.txt"
STELLAR_VERSION_FILE="$ARTIFACT_DIR/${APP_NAME}-stellar-version.txt"

mkdir -p "$ARTIFACT_DIR"
: > "$LOG_FILE"

log() {
  { echo "[$(date -Iseconds)] $*"; } | tee -a "$LOG_FILE"
}

classify_and_exit() {
  local ec="$1"
  local title="$2"
  log "Step failed: ${title} (exit ${ec})"
  if node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { isTransientTestnetSmokeFailure } from '${CORE_INDEX}';
const log = readFileSync(process.argv[1], 'utf8');
process.exit(isTransientTestnetSmokeFailure(log) ? 0 : 1);
" "$LOG_FILE"; then
    if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
      echo "transient=true" >> "$GITHUB_OUTPUT"
    fi
    exit 2
  fi
  exit 1
}

run_step() {
  local title="$1"
  shift
  log "=== ${title} ==="
  set +e
  { "$@" 2>&1; } | tee -a "$LOG_FILE"
  local ec=${PIPESTATUS[0]}
  set -e
  if [[ "$ec" -ne 0 ]]; then
    classify_and_exit "$ec" "$title"
  fi
}

log "=== caatinga-version ==="
set +e
caatinga --version 2>&1 | tee "$CAATINGA_VERSION_FILE" | tee -a "$LOG_FILE"
ec_kv=${PIPESTATUS[0]}
set -e
if [[ "$ec_kv" -ne 0 ]]; then
  classify_and_exit "$ec_kv" "caatinga-version"
fi

log "=== stellar-version ==="
set +e
stellar --version 2>&1 | tee "$STELLAR_VERSION_FILE" | tee -a "$LOG_FILE"
ec_sv=${PIPESTATUS[0]}
set -e
if [[ "$ec_sv" -ne 0 ]]; then
  classify_and_exit "$ec_sv" "stellar-version"
fi

rm -rf "$ROOT_DIR/$APP_NAME"

run_step "init" caatinga init "$APP_NAME" --template react-vite-counter
cd "$ROOT_DIR/$APP_NAME"

run_step "build" caatinga build counter
run_step "deploy" caatinga deploy counter --network testnet --source "$IDENTITY_ALIAS"

log "=== artifacts-contract-id ==="
set +e
node --input-type=module -e '
import fs from "node:fs";
const artifacts = JSON.parse(fs.readFileSync("caatinga.artifacts.json", "utf8"));
const contractId = artifacts.networks?.testnet?.contracts?.counter?.contractId;
if (!/^C[A-Z0-9]{55}$/.test(contractId ?? "")) {
  console.error(`Invalid contractId: ${contractId}`);
  process.exit(1);
}
' 2>&1 | tee -a "$LOG_FILE"
ec_art=${PIPESTATUS[0]}
set -e
if [[ "$ec_art" -ne 0 ]]; then
  classify_and_exit "$ec_art" "artifacts-contract-id"
fi
test -f caatinga.artifacts.json

run_step "generate" caatinga generate counter --network testnet
test -d src/contracts/generated

set +e
INVOKE_OUT="$(mktemp)"
caatinga invoke counter.increment --network testnet --source "$IDENTITY_ALIAS" 2>&1 | tee "$INVOKE_OUT" | tee -a "$LOG_FILE"
INV_EC=${PIPESTATUS[0]}
set -e
if [[ "$INV_EC" -ne 0 ]]; then
  classify_and_exit "$INV_EC" "invoke"
fi
if ! grep -q "Invoke complete" "$INVOKE_OUT"; then
  echo "invoke output missing success marker" | tee -a "$LOG_FILE"
  classify_and_exit 1 "invoke-assert"
fi
rm -f "$INVOKE_OUT"

log "=== smoke complete ==="
exit 0
```

- [ ] **Step 2: Syntax-check**

Run:

```bash
bash -n /home/dionebastos/Documentos/PROJETOS/caatinga/scripts/testnet-smoke.sh
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/testnet-smoke.sh
git commit -m "ci: harden testnet smoke script with logs, versions, and exit codes"
```

---

### Task 3: Workflow — retry condicional e artefatos

**Files:**

- Modify: `.github/workflows/testnet-smoke.yml`

- [ ] **Step 1: Replace steps from `Smoke attempt 1` through `Upload smoke artifacts`**

Use exactly this block (after `pnpm build`). The `Smoke gate` step treats a skipped `smokeretry` (non-transient first failure) as a job failure because `steps.smokeretry.outcome` is not `success`.

```yaml
      - name: Smoke attempt 1
        id: smoke1
        continue-on-error: true
        env:
          CAATINGA_CI_IDENTITY_ALIAS: ${{ secrets.CAATINGA_CI_IDENTITY_ALIAS }}
        run: bash scripts/testnet-smoke.sh smoke-app

      - name: Smoke retry
        id: smokeretry
        if: steps.smoke1.outcome == 'failure' && steps.smoke1.outputs.transient == 'true'
        env:
          CAATINGA_CI_IDENTITY_ALIAS: ${{ secrets.CAATINGA_CI_IDENTITY_ALIAS }}
        run: bash scripts/testnet-smoke.sh smoke-app-retry

      - name: Smoke gate
        if: always()
        run: |
          s1="${{ steps.smoke1.outcome }}"
          tr="${{ steps.smoke1.outputs.transient }}"
          sr="${{ steps.smokeretry.outcome }}"
          if [[ "$s1" == "success" ]]; then
            exit 0
          fi
          if [[ "$s1" == "failure" && "$tr" == "true" && "$sr" == "success" ]]; then
            exit 0
          fi
          exit 1

      - name: Upload smoke artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: testnet-smoke-artifacts
          path: |
            smoke-ci-out/
            smoke-app/caatinga.artifacts.json
            smoke-app-retry/caatinga.artifacts.json
          if-no-files-found: ignore
```

- [ ] **Step 2: Validate YAML locally (optional)**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('/home/dionebastos/Documentos/PROJETOS/caatinga/.github/workflows/testnet-smoke.yml'))"
```

Expected: no exception.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/testnet-smoke.yml
git commit -m "ci: gate testnet smoke retry on transient failures and upload logs"
```

---

### Task 4: Alternativa `CAATINGA_CI_SECRET_KEY` (somente documentação)

**Files:**

- Modify: `docs/testing.md` (mesmo bloco da Task 5)

**Rationale:** O `stellar keys add` da CLI atual não aceita chave secreta não interativa na linha de comando (`--secret-key` é interativo / deprecated). O caminho suportado continua sendo restaurar `config.toml` completo via `CAATINGA_CI_STELLAR_CONFIG_B64` (ou gerar esse blob fora do CI com a identidade já registrada).

- [ ] **Step 1: Append to `docs/testing.md` (after the smoke exit-codes paragraph from Task 5)**

```markdown
If you cannot use a pre-built `config.toml` blob, create one locally with `stellar keys` (or fund a throwaway account), then base64-encode the resulting `~/.config/stellar/config.toml` for `CAATINGA_CI_STELLAR_CONFIG_B64`. Do not commit raw keys; do not pass secret material to `caatinga --source`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/testing.md
git commit -m "docs: clarify CI identity secret handling without broken stellar keys flags"
```

(If you already committed the Task 5 doc block in one commit, fold this paragraph into that commit instead.)

---

### Task 5: Documentação

**Files:**

- Modify: `docs/testing.md`
- Modify: `docs/release/v1-readiness.md` (opcional, uma linha)

- [ ] **Step 1: Extend `docs/testing.md`**

After the paragraph that mentions `CAATINGA_CI_IDENTITY_ALIAS` and `CAATINGA_CI_STELLAR_CONFIG_B64`, append:

```markdown
Smoke script exit codes: `0` success; `1` hard failure (no retry — includes Caatinga/parser/CLI version errors); `2` classified transient testnet failure (workflow may run one retry). Artifacts include `smoke-ci-out/*-smoke.log`, `*-caatinga-version.txt`, `*-stellar-version.txt`, and the app `caatinga.artifacts.json`. Prefer `CAATINGA_CI_STELLAR_CONFIG_B64` plus `CAATINGA_CI_IDENTITY_ALIAS`; never pass raw secrets to `caatinga --source`. For the spec’s `CAATINGA_CI_SECRET_KEY` alternative, see the paragraph below on baking keys into `config.toml` offline.
```

- [ ] **Step 2: Optional line in v1 readiness**

In `docs/release/v1-readiness.md`, after the sentence about three consecutive runs, add:

```markdown
Verify in GitHub Actions: filter workflow `Testnet Smoke` by `event:schedule` and confirm three newest runs are green with no intervening non-retrying failures in the last seven days.
```

- [ ] **Step 3: Commit**

```bash
git add docs/testing.md docs/release/v1-readiness.md
git commit -m "docs: describe testnet smoke exit codes and release verification"
```

---

### Task 6: Verificação monorepo

**Files:** (nenhum novo; apenas comandos)

- [ ] **Step 1: Full package checks**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

Expected: all PASS.

- [ ] **Step 2: Commit**

Only if fixes were needed from verification; otherwise no commit.

---

## Self-review

**1. Spec coverage**

| Requirement | Task |
|-------------|------|
| Fluxo CI `init → build → deploy → generate → invoke` | Task 2 script |
| Identidade por alias; sem chave no repo | Já existente (`assertSafeSourceAccount`) + Task 4 docs para alternativa de secret |
| Segredos documentados | Task 5 |
| Asserções (exit 0, artifacts, contractId regex, bindings dir, invoke success) | Task 2 |
| Retry transitório uma vez; sem retry em erro parser/CLI | Tasks 1–3 |
| Schedule + dispatch + release | Já em `testnet-smoke.yml` |
| Artefatos: artifacts json, logs, versões stellar/caatinga | Tasks 2–3 |
| Gate release 3 runs / 7 dias | Documentação operacional Task 5 (não automatizável só no YAML sem API externa) |

**Gap aceito:** “Require 3 consecutive successful scheduled runs before tag v1.0.0” permanece processo humano + Actions UI; não exige app externa no escopo desta spec.

**2. Placeholder scan:** Nenhum TBD remanescente no plano.

**3. Type consistency:** `isTransientTestnetSmokeFailure(logText: string): boolean` exportado em `packages/core/src/index.ts`; o smoke importa `${ROOT_DIR}/packages/core/dist/index.js` após `pnpm build` no CI.

---

## Plan complete and saved to `docs/superpowers/plans/2026-05-13-live-testnet-smoke-ci.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Um subagente por task, revisão entre tasks, iteração rápida.

**2. Inline Execution** — Executar as tasks nesta sessão usando executing-plans, em lote com checkpoints.

**Which approach?**
