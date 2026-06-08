# Compara Pró

Plataforma **B2B de comparação de preços**. Compradores sobem suas listas de necessidades, representantes
comerciais sobem as listas de preços de seus fornecedores, e o sistema **cruza** os dois automaticamente.
Um **agente de IA** avalia o cruzamento e emite um **parecer** (melhores oportunidades, economia e
recomendação de fornecedor). Na mesma tela o comprador ajusta as escolhas por produto e cria
**pré-pedidos agrupados** por fornecedor, que o representante aprova ou rejeita.

## Funcionalidades

- **RBAC** — três papéis: `ADMIN`, `REPRESENTATIVE` (representante comercial), `CLIENT` (comprador).
- **Representante → N fornecedores** — cada representante representa vários fornecedores; cada lista de
  preços é enviada em nome de um fornecedor de origem. Telas em visão agregada com coluna/filtro Fornecedor.
- **Upload + parsing** de planilhas (XLSX/CSV) de necessidades e de catálogos de preço.
- **Motor de matching** em 4 níveis: SKU → código → nome exato → nome fuzzy (Fuse.js + Jaccard).
- **Parecer por IA (híbrido)** — números calculados de forma determinística + narrativa escrita pela IA.
  Config multi-provedor (**Anthropic / OpenAI**) com validação de chave, seleção de modelo e **prompt
  configurável**; chave **criptografada em repouso** (AES-256-GCM) e nunca devolvida ao cliente.
  Degrada graciosamente para análise determinística quando não há IA configurada.
- **Override + pré-pedido agrupado** — o comprador troca fornecedor/quantidade por produto e confirma um
  pré-pedido por fornecedor numa ação só (transacional).
- **Fluxo do representante** — fornecedores representados, lista de pré-pedidos recebidos, aprovar/rejeitar
  (com motivo).
- **Área administrativa** — usuários, empresas, produtos, histórico de uploads, relatórios (métricas
  reais + export CSV), configurações (perfil/senha/preferências + IA).
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
#   - R2_* (storage de avatar; só necessário em produção — ver seção Deploy)

# 3. Banco (Postgres via docker-compose) + schema
docker compose up -d
npx prisma migrate deploy        # aplica a migration baseline (prisma/migrations/0_init)
npx prisma generate

# 4. Dados de demonstração (opcional)
node scripts/seed-demo.cjs     # senha demo1234

# 5. Dev server
npm run dev                    # http://localhost:3000
```

**Logins de demonstração** (após o seed): `comprador@demo.com` (comprador) e
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

## Estrutura

```
src/app              rotas (App Router): admin, supplier, client, dashboard, api
src/lib/services     matching, pré-pedido, parecer (IA), file-processor
src/lib/ai           abstração de provedores de IA + config criptografada
src/components       UI (shadcn) + componentes de domínio
prisma/schema.prisma modelo de dados
scripts              seed e verificação ponta a ponta
```

## Segurança

Auth em toda rota/Server Action, validação Zod em toda entrada externa, chave de IA criptografada e
nunca exposta. Advisories de dependência aceitas estão documentadas em [SECURITY.md](SECURITY.md).

## Deploy (Vercel)

O `npm run build` roda `prisma generate && prisma migrate deploy && next build` — a migration baseline
(`prisma/migrations/0_init`) é aplicada automaticamente no primeiro deploy contra um banco vazio.

Variáveis de ambiente em produção:

```
DATABASE_URL           Postgres de produção
JWT_SECRET             segredo de sessão
AI_CONFIG_ENCRYPTION_KEY
AWS_REGION             ex. us-east-1
AWS_ACCESS_KEY_ID      IAM user com s3:PutObject/s3:DeleteObject no bucket
AWS_SECRET_ACCESS_KEY
S3_BUCKET              nome do bucket de avatares
S3_PUBLIC_URL          opcional: domínio CloudFront/custom (sem barra final).
                       Vazio = https://<S3_BUCKET>.s3.<AWS_REGION>.amazonaws.com
```

Avatares vão para AWS S3 — a fs da Vercel é read-only, então uploads não podem ir para
`public/uploads/`. O bucket precisa servir leitura pública (bucket policy) ou via CloudFront. Sem as
vars de S3, o upload de avatar falha com erro genérico (fail-secure); o resto do app funciona.

## Status

MVP funcional, com testes unitários (Vitest), E2E de autenticação (Playwright) e verificação ponta a
ponta por scripts (`npm run verify:cycle`).
