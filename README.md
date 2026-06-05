# Compara Pró

Plataforma **B2B de comparação de preços**. Compradores sobem suas listas de necessidades, fornecedores
sobem suas listas de preços, e o sistema **cruza** os dois automaticamente. Um **agente de IA** avalia o
cruzamento e emite um **parecer** (melhores oportunidades, economia e recomendação de fornecedor). Na
mesma tela o comprador ajusta as escolhas por produto e cria **pré-pedidos agrupados** por fornecedor,
que o fornecedor aprova ou rejeita.

## Funcionalidades

- **RBAC** — três papéis: `ADMIN`, `SUPPLIER` (fornecedor), `CLIENT` (comprador).
- **Upload + parsing** de planilhas (XLSX/CSV) de necessidades e de catálogos de preço.
- **Motor de matching** em 4 níveis: SKU → código → nome exato → nome fuzzy (Fuse.js + Jaccard).
- **Parecer por IA (híbrido)** — números calculados de forma determinística + narrativa escrita pela IA.
  Config multi-provedor (**Anthropic / OpenAI**) com validação de chave, seleção de modelo e **prompt
  configurável**; chave **criptografada em repouso** (AES-256-GCM) e nunca devolvida ao cliente.
  Degrada graciosamente para análise determinística quando não há IA configurada.
- **Override + pré-pedido agrupado** — o comprador troca fornecedor/quantidade por produto e confirma um
  pré-pedido por fornecedor numa ação só (transacional).
- **Fluxo do fornecedor** — lista de pré-pedidos recebidos, aprovar/rejeitar (com motivo).
- **Área administrativa** — usuários, empresas, produtos, histórico de uploads, relatórios (métricas
  reais + export CSV), configurações (perfil/senha/preferências + IA).
- **Notificações** in-app e por **e-mail** (Resend, opcional — habilita com `RESEND_API_KEY`).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 (strict) · Prisma 7 + PostgreSQL
(driver adapter `@prisma/adapter-pg`) · Tailwind CSS 4 · Biome · Vitest · auth JWT com `jose`/
`jsonwebtoken` · cripto AES-256-GCM para a chave de IA.

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

# 3. Banco (Postgres via docker-compose) + schema
docker compose up -d
npx prisma db push

# 4. Dados de demonstração (opcional)
node scripts/seed-demo.cjs     # senha demo1234

# 5. Dev server
npm run dev                    # http://localhost:3000
```

**Logins de demonstração** (após o seed): `comprador@demo.com`,
`fornecedor.alfa@demo.com`, `fornecedor.beta@demo.com` — senha `demo1234`.

## Scripts

| Comando | Ação |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | build de produção |
| `npm start` | serve o build |
| `npm test` | testes (Vitest) |
| `npm run lint` | Biome (lint + format check) |

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

## Status

MVP funcional. Em evolução: testes automatizados de rota/E2E e unificação do modelo de produto
(catálogo ↔ matching).
