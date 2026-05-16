# Stellar CLI Downgrade 22.0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o binario local `stellar` `25.1.0` por `22.0.1` no ambiente Linux x86_64 para manter compatibilidade com o contrato atual do Caatinga.

**Architecture:** O downgrade sera tratado como mudanca operacional local, sem tocar no codigo do repositorio. Como este host nao permite escrita direta em `/usr/local/bin` sem `sudo` interativo, o binario atual em `/usr/local/bin/stellar` sera preservado em backup no escopo do usuario e o release oficial `v22.0.1` sera instalado em `~/.local/bin/stellar`, que tem precedencia no `PATH`. A validacao final ocorre com `stellar --version` e com um build real de um projeto Caatinga fora do monorepo.

**Tech Stack:** Bash, `curl`, `tar`, GitHub Releases (`stellar/stellar-cli`), Caatinga CLI, Linux x86_64 glibc.

---

## File structure (repo map)

| Path | Responsibility |
|------|----------------|
| `docs/superpowers/plans/2026-05-15-stellar-cli-downgrade-22-0-1.md` | Plano operacional do downgrade |
| `/usr/local/bin/stellar` | Binario de sistema original, mantido intacto |
| `/home/dionebastos/.local/bin/stellar-25.1.0.backup` | Backup nomeado do binario atual antes da troca |
| `/home/dionebastos/.local/bin/stellar` | Binario ativo do Stellar CLI usado pelo Caatinga apos o downgrade |
| `/tmp/stellar-cli-downgrade/` | Diretorio temporario para download e extracao do release `22.0.1` |

**Baseline verificado neste ambiente:** `which stellar` retornava `/usr/local/bin/stellar`; `stellar --version` retornava `25.1.0`; o host e Linux x86_64; `brew` e `asdf` nao estao instalados; o binario atual nao pertence a pacote `dpkg`; `/usr/local/bin` exige privilegio fora do fluxo automatizavel; `~/.local/bin` aparece antes de `/usr/local/bin` no `PATH`, entao a substituicao local em escopo de usuario e o caminho correto.

### Task 1: Inventariar e preservar o binario atual no escopo do usuario

**Files:**
- Read-only: `/usr/local/bin/stellar`
- Create: `/home/dionebastos/.local/bin/stellar-25.1.0.backup`

- [x] **Step 1: Confirmar localizacao, versao e precedencia do PATH**

Run:

```bash
which stellar
stellar --version
ls -l /usr/local/bin/stellar
printf '%s\n' "$PATH"
```

Expected:
- `which stellar` imprime `/usr/local/bin/stellar`
- `stellar --version` imprime `stellar 25.1.0`
- `ls -l` mostra um binario executavel existente
- `PATH` contem `/home/dionebastos/.local/bin` antes de `/usr/local/bin`

- [x] **Step 2: Criar backup versionado antes de qualquer troca**

Run:

```bash
mkdir -p /home/dionebastos/.local/bin
cp /usr/local/bin/stellar /home/dionebastos/.local/bin/stellar-25.1.0.backup
chmod +x /home/dionebastos/.local/bin/stellar-25.1.0.backup
ls -l /home/dionebastos/.local/bin/stellar-25.1.0.backup
```

Expected:
- arquivo `/home/dionebastos/.local/bin/stellar-25.1.0.backup` criado
- `ls -l` mostra o backup executavel

- [x] **Step 3: Verificar que o backup executa**

Run:

```bash
/home/dionebastos/.local/bin/stellar-25.1.0.backup --version
```

Expected:
- saida contendo `stellar 25.1.0`

### Task 2: Baixar o release oficial `v22.0.1`

**Files:**
- Create: `/tmp/stellar-cli-downgrade/stellar-cli-22.0.1-x86_64-unknown-linux-gnu.tar.gz`
- Create: `/tmp/stellar-cli-downgrade/stellar`

- [x] **Step 1: Preparar diretorio temporario limpo**

Run:

```bash
rm -rf /tmp/stellar-cli-downgrade
mkdir -p /tmp/stellar-cli-downgrade
cd /tmp/stellar-cli-downgrade
pwd
```

Expected:
- `pwd` imprime `/tmp/stellar-cli-downgrade`

- [x] **Step 2: Baixar o asset oficial de Linux x86_64 glibc**

Run:

```bash
cd /tmp/stellar-cli-downgrade
curl -fL https://github.com/stellar/stellar-cli/releases/download/v22.0.1/stellar-cli-22.0.1-x86_64-unknown-linux-gnu.tar.gz -o stellar-cli-22.0.1-x86_64-unknown-linux-gnu.tar.gz
ls -lh stellar-cli-22.0.1-x86_64-unknown-linux-gnu.tar.gz
```

Expected:
- `curl` conclui com exit code `0`
- `ls -lh` mostra o arquivo `.tar.gz` baixado

- [x] **Step 3: Extrair o binario e validar a presenca do executavel**

Run:

```bash
cd /tmp/stellar-cli-downgrade
tar xzf stellar-cli-22.0.1-x86_64-unknown-linux-gnu.tar.gz
ls -l /tmp/stellar-cli-downgrade/stellar
file /tmp/stellar-cli-downgrade/stellar
```

Expected:
- arquivo `/tmp/stellar-cli-downgrade/stellar` extraido
- `file` identifica um binario ELF x86-64

### Task 3: Instalar `22.0.1` no path ativo do usuario

**Files:**
- Create/Modify: `/home/dionebastos/.local/bin/stellar`

- [x] **Step 1: Substituir o binario ativo pelo release `22.0.1`**

Run:

```bash
install -m 0755 /tmp/stellar-cli-downgrade/stellar /home/dionebastos/.local/bin/stellar
ls -l /home/dionebastos/.local/bin/stellar
```

Expected:
- `install` conclui com exit code `0`
- `ls -l` mostra o binario ativo atualizado

- [x] **Step 2: Validar a versao instalada**

Run:

```bash
which stellar
readlink -f "$(which stellar)"
stellar --version
```

Expected:
- `which stellar` retorna `/home/dionebastos/.local/bin/stellar`
- `readlink -f` tambem resolve para `/home/dionebastos/.local/bin/stellar`
- `stellar --version` mostra `stellar 22.0.1`

### Task 4: Verificar compatibilidade com o Caatinga

**Files:**
- Read-only: `/home/dionebastos/Documentos/PROJETOS/caatinga/packages/cli/src/commands/build.command.ts`
- Read-only: `/home/dionebastos/Documentos/PROJETOS/first-dapp/caatinga.config.ts`

- [x] **Step 1: Rodar o build sem override em um projeto Caatinga real**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/first-dapp
npx caatinga build counter
```

Expected:
- nao aparece `CAATINGA_UNTESTED_CLI_VERSION`
- se houver falha, ela deve ser do pipeline real de build do contrato, nao do gate de versao

Observed:
- o erro de versao desapareceu
- o build avancou ate a etapa Rust e falhou com `CAATINGA_RUST_TARGET_NOT_FOUND`
- o hint retornado foi `rustup target add wasm32v1-none`

- [x] **Step 2: Revalidar o contrato de versao do projeto**

Run:

```bash
cd /home/dionebastos/Documentos/PROJETOS/caatinga
sed -n '1,80p' docs/stellar-cli-version-contract.md
sed -n '1,40p' packages/cli/README.md
```

Expected:
- documentacao mostra suporte `>=22.0.0` e `<=22.0.1`

### Task 5: Rollback explicito se o downgrade quebrar algo fora do Caatinga

**Files:**
- Modify: `/home/dionebastos/.local/bin/stellar`
- Read-only: `/home/dionebastos/.local/bin/stellar-25.1.0.backup`

- [x] **Step 1: Definir rollback operacional**

Run:

```bash
install -m 0755 /home/dionebastos/.local/bin/stellar-25.1.0.backup /home/dionebastos/.local/bin/stellar
stellar --version
```

Expected:
- `stellar --version` volta a mostrar `stellar 25.1.0`

- [x] **Step 2: Registrar decisao operacional**

Run:

```bash
printf '%s\n' 'Rollback applied: restored Stellar CLI 25.1.0 from /home/dionebastos/.local/bin/stellar-25.1.0.backup'
```

Expected:
- linha unica confirmando que o rollback foi executado

Observed:
- rollback nao foi necessario
- o asset de rollback permanece disponivel para uso futuro

## Self-review

**Spec coverage:** O plano cobre motivacao operacional, caminho principal, verificacao final e rollback. Nao cobre mudancas de codigo no Caatinga porque isso esta explicitamente fora de escopo.

**Placeholder scan:** Nenhum `TODO`, `TBD` ou referencia vaga ficou no plano. Todos os passos tem comandos concretos, resultado esperado e observacao de execucao quando relevante.

**Type consistency:** Nao ha tipos de codigo envolvidos; os artefatos operacionais e paths usados no plano sao consistentes entre tarefas.
