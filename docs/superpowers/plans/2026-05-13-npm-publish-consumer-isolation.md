# npm Publish Pipeline and Consumer Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que `@caatinga/cli`, `@caatinga/core` e `@caatinga/client` funcionem fora do monorepo antes do publish, com validação de pack, ausência de `workspace:*` nos tarballs, teste de consumidor real e checagem de bundlers para o client.

**Architecture:** Manter Changesets e `turbo` como hoje; estender scripts bash de isolamento (`scripts/`), adicionar um script só de CI que gera um changeset efêmero + `changeset version --snapshot smoke` antes do pack para espelhar o release; fixtures mínimas de consumidor Vite/webpack sob `scripts/consumer-client-bundlers/` instaladas via `npm install` apontando para `.tgz` em `packed/`; CI passa a executar pack pós-snapshot, grep em `package.json` extraídos, `pnpm publish -r --dry-run`, e o fluxo de consumidor estendido (install + build no app gerado).

**Tech Stack:** pnpm 9, Turborepo, Changesets, Vitest, tsup, GitHub Actions, bash, npm (consumidor), Vite 6, webpack 5.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `scripts/ci-snapshot-pack.sh` | Gera changeset efêmero, roda `pnpm changeset version --snapshot smoke`, `pnpm pack` nos três pacotes, extrai `package/package.json` de cada `.tgz` para um diretório temporário e falha se houver `workspace:*`, `link:`, ou `file:` |
| `scripts/consumer-isolation-test.sh` | Fluxo completo de consumidor: build, pack (ou recebe `PACKED_DIR`), grep nos `.tgz`, projeto em `/tmp`, `npm install` dos `.tgz`, smoke imports, `npx caatinga`, `init`, `cd` app, `npm install`, `npm run build` |
| `scripts/consumer-client-bundlers-test.sh` | Para cada fixture (Vite, webpack), copia para temp, `npm install` com caminhos absolutos dos `.tgz` de `@caatinga/core` e `@caatinga/client`, `npm run build` |
| `scripts/consumer-client-bundlers/vite/` | App Vite mínimo que importa `createCaatingaClient` |
| `scripts/consumer-client-bundlers/webpack/` | App webpack mínimo que importa `createCaatingaClient` |
| `package.json` (raiz) | Scripts `test:consumer`, `test:consumer:client-bundlers`, `ci:snapshot-pack`, `publish:dry-run` |
| `.github/workflows/ci.yml` | Passos: `bash scripts/ci-snapshot-pack.sh`, `pnpm publish:dry-run`, `pnpm test:consumer`, `pnpm test:consumer:client-bundlers` |
| `.github/workflows/release.yml` | Garantir ordem alinhada à spec; opcionalmente usar tag do input no dispatch (documentado) |
| `packages/core/src/release/package-manifest.test.ts` | (Opcional) Assert extra: subpath `./freighter` no `client` |

**Não criar** `@caatinga/react` neste plano (spec: “Add later”).

---

### Task 1: Teste de manifesto — subpath `freighter` no client

**Files:**

- Modify: `packages/core/src/release/package-manifest.test.ts`
- Test: `packages/core/src/release/package-manifest.test.ts` (Vitest)

- [ ] **Step 1: Write the test**

Adicionar um `it` que valida o bloco `exports["./freighter"]` com `types`, `import`, `require` apontando para `./dist/freighter.*` (espelha `packages/client/package.json`).

```typescript
    it("client exposes freighter subpath", () => {
      const packageJson = JSON.parse(
        readFileSync(join(repoRoot, "packages/client/package.json"), "utf8")
      );
      expect(packageJson.exports["./freighter"]).toEqual({
        types: "./dist/freighter.d.ts",
        import: "./dist/freighter.js",
        require: "./dist/freighter.cjs"
      });
    });
```

- [ ] **Step 2: Run test**

Run: `pnpm --filter @caatinga/core exec vitest run src/release/package-manifest.test.ts -v`

Expected: PASS (o manifest já está correto; o teste documenta o contrato de publish).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/release/package-manifest.test.ts
git commit -m "test: assert client freighter export map"
```

---

### Task 2: Script CI — snapshot Changesets + pack + grep em JSON extraídos

**Files:**

- Create: `scripts/ci-snapshot-pack.sh`
- Modify: `package.json` (raiz)

- [ ] **Step 1: Write the script**

Criar `scripts/ci-snapshot-pack.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKED_DIR="$ROOT_DIR/packed"
EXTRACT_DIR="$ROOT_DIR/packed-unpacked-package-jsons"

rm -rf "$PACKED_DIR" "$EXTRACT_DIR" "$ROOT_DIR/.changeset/__ci_snapshot__.md"
mkdir -p "$PACKED_DIR" "$EXTRACT_DIR"

if [[ ! -d "$ROOT_DIR/packages/core/dist" ]]; then
  pnpm --dir "$ROOT_DIR" build
fi

cat > "$ROOT_DIR/.changeset/__ci_snapshot__.md" <<'EOF'
---
"@caatinga/cli": patch
---

chore: ci snapshot for pack validation (do not commit)
EOF

pnpm --dir "$ROOT_DIR" exec changeset version --snapshot smoke

( cd "$ROOT_DIR/packages/core" && pnpm pack --pack-destination "$PACKED_DIR" )
( cd "$ROOT_DIR/packages/client" && pnpm pack --pack-destination "$PACKED_DIR" )
( cd "$ROOT_DIR/packages/cli" && pnpm pack --pack-destination "$PACKED_DIR" )

shopt -s nullglob
for t in "$PACKED_DIR"/*.tgz; do
  base="$(basename "$t" .tgz)"
  mkdir -p "$EXTRACT_DIR/$base"
  tar -xzf "$t" -C "$EXTRACT_DIR/$base" package/package.json
  if grep -qE 'workspace:\*|link:|file:' "$EXTRACT_DIR/$base/package/package.json"; then
    echo "Packed package $t contains monorepo-only dependency reference." >&2
    cat "$EXTRACT_DIR/$base/package/package.json" >&2
    exit 1
  fi
done

echo "ci-snapshot-pack: OK"
```

Tornar executável:

```bash
chmod +x scripts/ci-snapshot-pack.sh
```

- [ ] **Step 2: Add npm script**

Em `package.json` (raiz), dentro de `"scripts"`:

```json
"ci:snapshot-pack": "bash scripts/ci-snapshot-pack.sh"
```

- [ ] **Step 3: Run script locally**

Run: `pnpm ci:snapshot-pack`

Expected: termina com `ci-snapshot-pack: OK` e cria `packed/*.tgz` e `packed-unpacked-package-jsons/*/package/package.json`. O working tree fica com `package.json` dos pacotes e `.changeset` alterados pelo snapshot — usar `git checkout -- packages .changeset` após teste local se necessário.

- [ ] **Step 4: Commit**

```bash
git add scripts/ci-snapshot-pack.sh package.json
git commit -m "chore: add ci snapshot pack and packed manifest scan"
```

---

### Task 3: `pnpm publish` dry-run sem warnings críticos

**Files:**

- Modify: `package.json` (raiz)

- [ ] **Step 1: Add script**

```json
"publish:dry-run": "pnpm publish -r --access public --dry-run --no-git-checks"
```

- [ ] **Step 2: Run after a normal build (sem snapshot)**

Run: `pnpm install && pnpm build && pnpm publish:dry-run`

Expected: exit code 0; revisar stderr — o objetivo da spec é não depender só do dry-run; anotar warnings conhecidos (ex.: falta de `repository` no `package.json` dos pacotes) e corrigir em Task separada se algum warning for bloqueante para publicação.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add publish dry-run script"
```

---

### Task 4: Estender `consumer-isolation-test.sh` — install e build no app gerado

**Files:**

- Modify: `scripts/consumer-isolation-test.sh`

- [ ] **Step 1: Append steps after `npx caatinga init`**

Substituir o final do script (após `npx caatinga init test-app --template react-vite-counter`) por:

```bash
npx caatinga init test-app --template react-vite-counter
test -f test-app/caatinga.config.ts
test -f test-app/caatinga.artifacts.json

cd test-app
npm install
npm run build
cd "$TMP_DIR"
```

Manter no topo do script: `PACKED_DIR` default `"$ROOT_DIR/packed"`, e permitir override `PACKED_DIR` do ambiente para reutilizar tarballs já gerados pelo `ci-snapshot-pack.sh`:

```bash
PACKED_DIR="${PACKED_DIR:-$ROOT_DIR/packed}"
```

No início, **não** apagar `$PACKED_DIR` se `SKIP_PACK="${SKIP_PACK:-0}"` for `1` (útil quando CI já rodou `ci:snapshot-pack`). Quando `SKIP_PACK=0` (default), manter comportamento atual: `rm -rf "$PACKED_DIR"` antes de pack.

Pseudo-diff do bloco inicial:

```bash
PACKED_DIR="${PACKED_DIR:-$ROOT_DIR/packed}"
SKIP_PACK="${SKIP_PACK:-0}"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
if [[ "$SKIP_PACK" != "1" ]]; then
  rm -rf "$PACKED_DIR"
  mkdir -p "$PACKED_DIR"
  pnpm --dir "$ROOT_DIR" build
  ( cd "$ROOT_DIR/packages/core" && pnpm pack --pack-destination "$PACKED_DIR" )
  ( cd "$ROOT_DIR/packages/client" && pnpm pack --pack-destination "$PACKED_DIR" )
  ( cd "$ROOT_DIR/packages/cli" && pnpm pack --pack-destination "$PACKED_DIR" )
fi
```

- [ ] **Step 2: Run consumer test**

Run: `pnpm test:consumer`

Expected: sucesso; `test-app` compila com Vite (`npm run build` do template).

- [ ] **Step 3: Commit**

```bash
git add scripts/consumer-isolation-test.sh
git commit -m "test: extend consumer isolation with template npm build"
```

---

### Task 5: Fixtures + script — Vite e webpack consumindo `@caatinga/client` empacotado

**Files:**

- Create: `scripts/consumer-client-bundlers-test.sh`
- Create: `scripts/consumer-client-bundlers/vite/package.json`
- Create: `scripts/consumer-client-bundlers/vite/vite.config.ts`
- Create: `scripts/consumer-client-bundlers/vite/index.html`
- Create: `scripts/consumer-client-bundlers/vite/src/main.ts`
- Create: `scripts/consumer-client-bundlers/vite/tsconfig.json`
- Create: `scripts/consumer-client-bundlers/webpack/package.json`
- Create: `scripts/consumer-client-bundlers/webpack/webpack.config.cjs`
- Create: `scripts/consumer-client-bundlers/webpack/src/index.js`
- Modify: `package.json` (raiz)

- [ ] **Step 1: Create Vite fixture files**

`scripts/consumer-client-bundlers/vite/package.json`:

```json
{
  "name": "caatinga-client-consumer-vite",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build"
  },
  "dependencies": {
    "@caatinga/client": "0.0.0-placeholder",
    "@caatinga/core": "0.0.0-placeholder"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "vite": "^6.0.6"
  }
}
```

`scripts/consumer-client-bundlers/vite/vite.config.ts`:

```typescript
import { defineConfig } from "vite";

export default defineConfig({});
```

(App SPA: `vite build` usa `index.html` → `src/main.ts` e empacota `@caatinga/client` no bundle.)

`scripts/consumer-client-bundlers/vite/index.html`:

```html
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>smoke</title></head>
  <body><script type="module" src="/src/main.ts"></script></body>
</html>
```

`scripts/consumer-client-bundlers/vite/src/main.ts`:

```typescript
import { createCaatingaClient } from "@caatinga/client";

console.log(typeof createCaatingaClient);
```

`scripts/consumer-client-bundlers/vite/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 2: Create webpack fixture files**

`scripts/consumer-client-bundlers/webpack/package.json`:

```json
{
  "name": "caatinga-client-consumer-webpack",
  "private": true,
  "scripts": {
    "build": "webpack --config webpack.config.cjs"
  },
  "dependencies": {
    "@caatinga/client": "0.0.0-placeholder",
    "@caatinga/core": "0.0.0-placeholder"
  },
  "devDependencies": {
    "webpack": "^5.97.1",
    "webpack-cli": "^6.0.1"
  }
}
```

`scripts/consumer-client-bundlers/webpack/webpack.config.cjs`:

```javascript
const path = require("path");

module.exports = {
  mode: "production",
  target: "web",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true
  },
  resolve: {
    extensions: [".js", ".cjs", ".mjs"]
  },
  experiments: {
    outputModule: true
  },
  externals: {}
};
```

`scripts/consumer-client-bundlers/webpack/src/index.js`:

```javascript
import { createCaatingaClient } from "@caatinga/client";

console.log(typeof createCaatingaClient);
```

- [ ] **Step 3: Create runner script**

`scripts/consumer-client-bundlers-test.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKED_DIR="${PACKED_DIR:-$ROOT_DIR/packed}"

shopt -s nullglob
CORE_TGZ=( "$PACKED_DIR"/caatinga-core-*.tgz )
CLIENT_TGZ=( "$PACKED_DIR"/caatinga-client-*.tgz )
if [[ ${#CORE_TGZ[@]} -eq 0 || ${#CLIENT_TGZ[@]} -eq 0 ]]; then
  echo "Missing packed tarballs in $PACKED_DIR (run pnpm ci:snapshot-pack or pnpm test:consumer first)." >&2
  exit 1
fi

run_fixture() {
  local name="$1"
  local src="$ROOT_DIR/scripts/consumer-client-bundlers/$name"
  local tmp="${TMPDIR:-/tmp}/caatinga-client-bundler-$name-$$"
  rm -rf "$tmp"
  cp -a "$src" "$tmp"
  cd "$tmp"
  npm install "${CORE_TGZ[0]}" "${CLIENT_TGZ[0]}"
  npm run build
  cd "$ROOT_DIR"
  rm -rf "$tmp"
}

run_fixture vite
run_fixture webpack

BARE_TMP="${TMPDIR:-/tmp}/caatinga-client-bare-$$"
rm -rf "$BARE_TMP"
mkdir -p "$BARE_TMP"
cd "$BARE_TMP"
npm init -y >/dev/null
npm install "${CORE_TGZ[0]}" "${CLIENT_TGZ[0]}"
node --input-type=module -e 'import { createCaatingaClient } from "@caatinga/client"; console.log(typeof createCaatingaClient)'
cd "$ROOT_DIR"
rm -rf "$BARE_TMP"

echo "consumer-client-bundlers-test: OK"
```

```bash
chmod +x scripts/consumer-client-bundlers-test.sh
```

- [ ] **Step 4: Wire root script**

Em `package.json`:

```json
"test:consumer:client-bundlers": "bash scripts/consumer-client-bundlers-test.sh"
```

- [ ] **Step 5: Run**

Run:

```bash
pnpm ci:snapshot-pack
PACKED_DIR="$PWD/packed" pnpm test:consumer:client-bundlers
```

Expected: `consumer-client-bundlers-test: OK`

- [ ] **Step 6: Commit**

```bash
git add scripts/consumer-client-bundlers scripts/consumer-client-bundlers-test.sh package.json
git commit -m "test: add vite and webpack client consumer fixtures"
```

---

### Task 6: Orquestração CI — snapshot pack, dry-run publish, consumidores

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `package.json` (raiz) — script agregador opcional

- [ ] **Step 1: Add aggregator script** (opcional mas útil)

```json
"ci:publish-matrix": "pnpm build && pnpm test && pnpm ci:snapshot-pack && pnpm publish:dry-run && SKIP_PACK=1 PACKED_DIR=\"$PWD/packed\" pnpm test:consumer && PACKED_DIR=\"$PWD/packed\" pnpm test:consumer:client-bundlers"
```

- [ ] **Step 2: Update CI workflow**

Em `.github/workflows/ci.yml`, após o passo `Test`, inserir:

```yaml
      - name: Snapshot pack and packed manifest scan
        run: pnpm ci:snapshot-pack

      - name: Publish dry-run
        run: pnpm publish:dry-run

      - name: Consumer isolation (reuse packed tarballs)
        env:
          SKIP_PACK: "1"
          PACKED_DIR: ${{ github.workspace }}/packed
        run: pnpm test:consumer

      - name: Client bundler consumers
        env:
          PACKED_DIR: ${{ github.workspace }}/packed
        run: pnpm test:consumer:client-bundlers
```

- [ ] **Step 3: Run locally**

Run: `pnpm ci:publish-matrix`

Expected: todos os passos concluem sem erro.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml package.json
git commit -m "ci: snapshot pack, publish dry-run, and consumer tests"
```

---

### Task 7: Release workflow — alinhar ordem e tag

**Files:**

- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Confirm order matches spec**

Ordem desejada: checkout → pnpm → node → install → typecheck → build → test → pack + consumer → publish com provenance.

Inserir antes de `Consumer isolation`:

```yaml
      - name: Snapshot pack and packed manifest scan
        run: pnpm ci:snapshot-pack
```

Alterar `Consumer isolation` para reutilizar `packed/`:

```yaml
      - name: Consumer isolation
        env:
          SKIP_PACK: "1"
          PACKED_DIR: ${{ github.workspace }}/packed
        run: pnpm test:consumer

      - name: Client bundler consumers
        env:
          PACKED_DIR: ${{ github.workspace }}/packed
        run: pnpm test:consumer:client-bundlers
```

- [ ] **Step 2: Dist-tag do `pnpm publish`**

O passo `Publish` só roda em `github.event_name == 'release'` (não em `workflow_dispatch`). Escolha **uma** política e deixe explícita no workflow:

- **Pré-v1 / canal next:** manter `pnpm publish -r --access public --provenance --tag next`.
- **Pós-v1 / latest:** usar `--tag latest`.

Opcional: usar `github.event.release.tag_name` só como metadado em comentário de release; o dist-tag do npm é independente do nome da git tag. Evite expressões YAML frágeis; prefira valor fixo documentado no comentário do job.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: align release workflow with snapshot pack and consumers"
```

---

### Task 8: `.gitignore` — artefatos de pack e snapshot

**Files:**

- Modify: `.gitignore`

- [ ] **Step 1: Add entries**

```
packed/
packed-unpacked-package-jsons/
.changeset/__ci_snapshot__.md
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore ci pack artifacts"
```

---

## Divisão consumer-packaging vs consumer-runtime

O template `react-vite-counter` usa `npm run build` → `tsc && vite build` e **não** exige Rust nem Stellar CLI para esse build. Portanto **um único** `consumer-isolation-test.sh` atende à spec hoje.

Se no futuro um template passar a exigir Stellar CLI no `npm run build`, extrair para `scripts/consumer-runtime-test.sh` os passos `cd test-app && npm install && npm run build` e manter `scripts/consumer-packaging-test.sh` apenas até `npx caatinga init` + smoke de imports — não é necessário neste plano até o template mudar.

---

## Self-review (checklist interno)

1. **Cobertura da spec:** exports/types/files/bin (já no repo + teste freighter); Changesets (existente); `release.yml` + `consumer-isolation-test.sh` (estendidos); dry-run + snapshot pack; consumidor fora do monorepo com `npx caatinga init` + install + build; client em Vite + webpack + ESM bare; grep `workspace:*` nos manifests empacotados; publish com `--provenance` (já).
2. **Placeholders:** nenhum TBD remanescente; comandos e paths explícitos.
3. **Consistência:** `PACKED_DIR` e `SKIP_PACK` usados de forma uniforme entre CI e scripts.

---

## Execution handoff

**Plano salvo em** `docs/superpowers/plans/2026-05-13-npm-publish-consumer-isolation.md`.

**Duas opções de execução:**

1. **Subagent-Driven (recomendado)** — despachar um subagente fresco por task, revisar entre tasks, iteração rápida. **SUB-SKILL obrigatória:** `superpowers:subagent-driven-development`.

2. **Inline Execution** — executar tasks nesta sessão com checkpoints. **SUB-SKILL obrigatória:** `superpowers:executing-plans`.

**Qual abordagem você prefere?**
