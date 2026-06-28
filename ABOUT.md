# Compara Pró — Descrição do Projeto

## O que é

**Compara Pró** é uma plataforma **B2B SaaS** de comparação de preços e apoio à compra. Compradores enviam listas de necessidades (planilhas); representantes comerciais enviam catálogos de preços dos fornecedores que representam; o sistema **cruza** automaticamente as duas bases, destaca as melhores oportunidades e permite criar **pré-pedidos** que o representante aprova ou rejeita.

O objetivo é eliminar a troca manual de arquivos entre comprador e fornecedor, reduzir o tempo de cotação e dar visibilidade clara de economia e melhor fornecedor por item.

---

## Problema que resolve

Em compras recorrentes (varejo, atacado, distribuição), o fluxo tradicional costuma ser:

1. O comprador monta uma planilha com os itens desejados.
2. Envia por e-mail ou WhatsApp para vários fornecedores ou representantes.
3. Recebe planilhas de volta, compara manualmente e decide.

Esse processo é lento, sujeito a erro e difícil de auditar. O Compara Pró centraliza upload, matching, comparação, parecer e pré-pedido em um único ambiente web, sem instalação local.

---

## Público-alvo

- **Pequenas e médias empresas** que compram com volume relevante (centenas a milhares de itens por consulta).
- Setores como varejo, supermercados, atacado e centros de distribuição.
- Operação típica do MVP: poucos usuários por empresa, dezenas a centenas de transações por mês.

---

## Atores e papéis

O sistema organiza o acesso em **três áreas** (derivadas do vínculo do usuário com uma empresa):

| Área | Quem é | O que faz na plataforma |
|------|--------|-------------------------|
| **Administrador** | Usuário sem empresa vinculada (`companyId` nulo) | Gestão global: empresas, produtos, histórico, relatórios, configurações do sistema (incl. IA) e administradores |
| **Representante** | Usuário de uma **agência** (`Company` tipo `REPRESENTATIVE`) | Faz upload de catálogos em nome dos fornecedores representados, acompanha histórico de preços e responde pré-pedidos |
| **Cliente (comprador)** | Usuário de uma empresa compradora (`Company` tipo `CLIENT`) | Envia listas de necessidades, compara preços, associa itens manualmente quando necessário, cria pré-pedidos e acompanha status |

### Tipos de empresa

| Tipo | Papel no modelo |
|------|-----------------|
| **SUPPLIER** | Fornecedor — possui catálogo de produtos e preços; **não tem login próprio** na plataforma |
| **CLIENT** | Comprador — conta com um ou mais usuários |
| **REPRESENTATIVE** | Agência de representação — conta com usuários que operam em nome de vários fornecedores |

Uma agência representa **N fornecedores** (relação N-N via `RepresentativeSupplier`). Todos os usuários da mesma agência compartilham os fornecedores representados.

A gestão de usuários é **por sessão**: administradores de clientes em `/client/usuarios`, de representantes em `/supplier/usuarios`, e administradores do sistema em `/admin/users`.

---

## Fluxos principais

### 1. Representante — catálogo de preços

1. Seleciona o fornecedor de origem (entre os que a agência representa).
2. Faz upload de planilha XLSX/CSV com produtos e preços.
3. O sistema valida, processa e atualiza o **catálogo** (`products`); apenas a carga mais recente de cada fornecedor entra na comparação ativa.
4. O histórico de uploads é preservado, com indicadores de variação de preço em relação à carga anterior.

### 2. Cliente — comparação e compra

1. Faz upload da lista de necessidades (itens, quantidades, preços-alvo opcionais).
2. O **motor de matching** associa cada item aos produtos dos fornecedores disponíveis.
3. A tela de comparação exibe preços por fornecedor, economia estimada e um **parecer da operação** (IA + números determinísticos).
4. Itens sem correspondência automática podem ser associados **manualmente** a produtos do catálogo.
5. O comprador pode **trocar o fornecedor escolhido** por produto e confirmar **pré-pedidos agrupados por fornecedor** em uma ação transacional.

### 3. Representante — pré-pedidos

1. Recebe notificações de novos pré-pedidos dos clientes da carteira.
2. Analisa itens, quantidades e valores.
3. **Aprova** (converte em pedido confirmado) ou **rejeita** (com motivo).

### 4. Administrador — operação da plataforma

- Cadastro e manutenção de empresas (fornecedores, clientes, agências).
- Visão de uploads, produtos, pré-pedidos e métricas.
- Relatórios e exportação.
- Configuração de perfil, preferências e integração de **IA** para o parecer (chave criptografada em repouso).

---

## Funcionalidades centrais

### Upload e processamento de arquivos

- Formatos **Excel (XLSX)** e **CSV**.
- Validação de campos obrigatórios (SKU, código, nome, preço, etc.).
- Histórico auditável de todas as cargas.

### Motor de matching (4 níveis)

1. **SKU** — correspondência exata por SKU.
2. **Código** — correspondência por código interno.
3. **Nome exato** — igualdade de descrição.
4. **Nome fuzzy** — similaridade com Fuse.js e Jaccard para itens com grafia diferente.

### Parecer por IA (híbrido)

- Métricas calculadas de forma **determinística** (economia, melhor fornecedor por item, totais).
- Narrativa gerada por **IA** (Anthropic ou OpenAI), com prompt configurável pelo admin.
- Chave de API **criptografada** (AES-256-GCM); nunca exposta ao cliente.
- **Degradação graciosa**: sem IA configurada, exibe análise determinística.

### Pré-pedidos

- Agrupamento automático por fornecedor.
- Registro de preço-alvo (`baselinePrice`) para cálculo de economia.
- Status: ativo, finalizado (aprovado) ou rejeitado.
- Notificações in-app e por e-mail (Resend, opcional).

### Interface

- Padrão de **data tables** com ordenação, busca e paginação.
- Detalhes em modal; criação/edição em rotas dedicadas (`/novo`, `/[id]/editar`).
- Formulários com react-hook-form + Zod.
- Componentes shadcn/ui + Tailwind CSS.

---

## Stack técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, TanStack Table |
| Backend | Route Handlers, Server Actions, validação Zod |
| Banco | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Auth | JWT (`jose` / `jsonwebtoken`), cookies de sessão |
| Testes | Vitest (unitário), Playwright (E2E) |
| Qualidade | Biome (lint/format) |
| Storage | AWS S3 / R2 para avatares (produção) |
| E-mail | Resend (opcional) |

Estrutura principal do código:

```
src/app/              Rotas: admin, supplier, client, auth, api
src/lib/services/     Matching, pré-pedido, parecer, processamento de arquivos
src/lib/ai/           Provedores de IA e config criptografada
src/components/       UI compartilhada e componentes de domínio
prisma/schema.prisma  Modelo de dados
scripts/              Seeds e verificações ponta a ponta
e2e/                  Testes Playwright
```

---

## Modelo de dados (visão conceitual)

- **User** — pessoa com login; vinculada opcionalmente a uma **Company**.
- **Company** — entidade jurídica/operacional (`SUPPLIER`, `CLIENT` ou `REPRESENTATIVE`).
- **Product** — item do catálogo de um fornecedor, com preço e referência à última carga.
- **UploadHistory** — registro de cada envio de planilha (cliente ou fornecedor).
- **Comparison** — resultado de uma comparação iniciada pelo cliente.
- **PreOrder / PreOrderItem** — intenção de compra agrupada por fornecedor.
- **RepresentativeSupplier** — vínculo agência ↔ fornecedor.
- **SupplierClient** — carteira de clientes atendidos por um fornecedor.
- **Notification** — alertas in-app para eventos relevantes.

Regras de negócio importantes:

- Só a **última carga** de catálogo de cada fornecedor entra na comparação ativa.
- Cargas anteriores permanecem no histórico para auditoria e tendência de preço.
- O cliente tem autonomia de compra (sem fluxo de aprovação interna no MVP).
- A aprovação do representante confirma o compromisso comercial com o fornecedor.

---

## Segurança e governança

- Autenticação e autorização em rotas, APIs e Server Actions.
- **Escopo por área**: representante não acessa gestão de clientes de outra sessão; cliente não cria usuários fora do próprio papel/empresa.
- Validação Zod em toda entrada externa.
- Secrets e chaves de IA com defaults **fail-secure** (sem valores fracos em produção).
- Soft delete em entidades principais (`deletedAt`).

---

## Ambiente de desenvolvimento

- **Runtime recomendado**: Bun (`bun run dev`).
- **Porta local preferida**: `3150` (ex.: `bun run dev -- -p 3150`).
- **Banco**: PostgreSQL via Docker (`docker compose up -d`), porta host **5435**.
- **Seed de demonstração**: `bun run seed:demo` — logins `admin@demo.com`, `comprador@demo.com`, `representante@demo.com` (senha `demo1234`).

Detalhes de setup, deploy na Vercel e variáveis de ambiente estão no [README.md](README.md).

---

## Status do projeto

**MVP funcional**, com:

- Fluxo completo comprador → comparação → pré-pedido → representante.
- Testes unitários (Vitest) e E2E (Playwright), incluindo escopo de gestão de usuários e match manual.
- Scripts de verificação ponta a ponta (`verify:cycle`, `verify:parecer`).
- Evolução em curso no modelo de papéis (área derivada do tipo de empresa e agências de representação).

O projeto nasceu como **POC** (`price-comparison-poc`) e evolui para uma solução de compras B2B com parecer assistido por IA e operação multi-fornecedor via representantes comerciais.
