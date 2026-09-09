# Compara Pró

Plataforma **B2B de comparação de preços**. Compradores sobem suas listas de necessidades, representantes
comerciais sobem as listas de preços de seus fornecedores, e o sistema **cruza** os dois automaticamente.
Um **agente de IA** avalia o cruzamento e emite um **parecer** (melhores oportunidades, economia e
recomendação de fornecedor). Na mesma tela o comprador ajusta as escolhas por produto e cria
**pré-pedidos agrupados** por fornecedor, que o representante aprova ou rejeita.

## Funcionalidades

- **Conta = empresa** — não existe `User.role`. A área do usuário é **derivada** de `Company.type`
  (`src/lib/area.ts`): `CLIENT` (comprador) → `/client`, `REPRESENTATIVE` (representante comercial) →
  `/supplier`, usuário **sem empresa** → `ADMIN`. Empresas `SUPPLIER` são catálogos sem login.
- **Representante → N fornecedores** — cada representante representa vários fornecedores; cada lista de
  preços é enviada em nome de um fornecedor de origem. A lista de fornecedores representados mostra
  também quantas listas de preço cada um enviou.
- **Pré-pedido com representante vinculado** — todo pré-pedido tem exatamente **1 cliente e 1
  representante** (a agência que cadastrou o cliente na carteira daquele fornecedor); a lista
  administrativa de pré-pedidos traz o Representante na primeira coluna.
- **Upload + parsing** de planilhas (XLSX/CSV) de necessidades e de catálogos de preço.
- **Motor de matching** em 4 níveis: SKU → código → nome exato → nome fuzzy (Fuse.js + Jaccard).
- **Parecer por IA (híbrido)** — números calculados de forma determinística + narrativa escrita pela IA.
  Config multi-provedor (**Anthropic / OpenAI**) com validação de chave, seleção de modelo e **prompt
  configurável**; chave **criptografada em repouso** (AES-256-GCM) e nunca devolvida ao cliente.
  Degrada graciosamente para análise determinística quando não há IA configurada.
- **Override + pré-pedido agrupado** — o comprador troca fornecedor/quantidade por produto e confirma um
  pré-pedido por fornecedor numa ação só (transacional). Vê a **economia** (vs. preço-alvo informado) por
  item e total no momento da decisão.
- **Fluxo do representante** — fornecedores representados, lista de pré-pedidos recebidos, aprovar/rejeitar
  (com motivo).
- **Área administrativa** — usuários, empresas, produtos (suporte: edita/exclui, sem cadastrar),
  histórico de uploads, relatórios (métricas reais + export CSV), configurações (perfil/senha/
  preferências + IA).
- **Padrão único de listas** — toda lista usa **data-table** (ordenação/busca/paginação); clicar na
  linha abre uma **modal de detalhe**, e o cadastro (criar/editar) acontece em **rota dedicada**
  (`/novo`, `/[id]/editar`) com formulários react-hook-form + Zod.
- **Notificações** in-app e por **e-mail** (Resend, opcional — habilita com `RESEND_API_KEY`).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 (strict) · Prisma 7 + PostgreSQL
(driver adapter `@prisma/adapter-pg`) · Tailwind CSS 4 · shadcn/ui + TanStack Table · react-hook-form
+ Zod · Biome · Vitest · Playwright · auth JWT com `jose`/`jsonwebtoken` · cripto AES-256-GCM para a
chave de IA.

## Rodando localmente

Pré-requisitos: Node 20+, Docker (para o Postgres) e `npm`.

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
#   - DATABASE_URL (Postgres)
#   - JWT_SECRET
#   - AI_CONFIG_ENCRYPTION_KEY  ->  openssl rand -base64 32   (necessária p/ configurar IA)
#   - AWS_* / S3_* (storage de avatar no S3; sem elas o upload falha — fail-secure)

# 3. Banco (Postgres via docker-compose) + schema
docker compose up -d
./node_modules/.bin/prisma migrate deploy   # migrations (baseline 0_init + versionadas)
./node_modules/.bin/prisma generate         # use o binário local; `npx prisma` falha neste projeto

# 4. Dados de demonstração (opcional)
node scripts/seed-demo.cjs     # senha demo1234

# 5. Dev server
npm run dev                    # http://localhost:3150
```

**Logins de demonstração** (após o seed): `admin@demo.com` (admin), `comprador@demo.com` (comprador) e
`representante@demo.com` (representante — representa os fornecedores Alfa e Beta) — senha `demo1234`.

## Scripts

| Comando | Ação |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | build de produção |
| `npm start` | serve o build |
| `npm test` | testes unitários (Vitest) |
| `npm run test:e2e` | testes E2E (Playwright) |
| `npm run lint` | Biome (lint + format check) |
| `npm run seed:demo` | popula dados de demonstração |
| `npm run verify:cycle` | smoke e2e do fluxo comprador→representante (precisa do dev server) |
| `npm run e2e:cleanup` | varre o que a suíte E2E deixou para trás (idempotente) |

> Se o dev server não estiver na porta 3150, aponte os smokes/E2E com `BASE_URL`, ex.:
> `BASE_URL=http://localhost:3150 npm run verify:cycle` · `BASE_URL=http://localhost:3150 npx playwright test --workers=1`.

## Estrutura

```
src/app              rotas (App Router): admin, supplier, client, api
src/lib/services     matching, pré-pedido, parecer (IA), file-processor
src/lib/ai           abstração de provedores de IA + config criptografada
src/components       UI (shadcn) + componentes de domínio
prisma/schema.prisma modelo de dados
scripts              seed e verificação ponta a ponta
```

## Segurança

Auth em toda rota/Server Action, validação Zod em toda entrada externa, chave de IA criptografada e
nunca exposta. A borda (`src/proxy.ts`) é **fail-closed**: `/api/*` exige sessão por padrão e só uma
allowlist explícita, por match exato, escapa. Um teste estático (`src/app/api/auth-guard.test.ts`)
quebra se um handler novo esquecer o gate. Advisories de dependência aceitas estão documentadas em
[SECURITY.md](docs/SECURITY.md).

## Status

MVP funcional: `tsc --noEmit` limpo, Biome sem nenhum apontamento, **243** testes unitários (Vitest),
**53** specs E2E (Playwright) e verificação ponta a ponta por scripts (`npm run verify:cycle`) como
oráculo de integração. O fluxo completo comprador→representante é coberto pela UI em
`e2e/business-flow-deep.spec.ts` e pela API no `verify:cycle`.

A suíte E2E **não deixa resíduo**: o `global-setup` grava o instante em que a rodada começou e o
teardown apaga só o que nasceu dessa janela, então rodar a suíte quantas vezes quiser devolve o
banco ao mesmo estado. Error boundaries e telas de `loading`/`error`/`404` cobrem as três áreas.
