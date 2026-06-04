# Current Pending Tasks - Price Comparison POC

## 📋 Overview
Este documento registra as pendências atuais do projeto, identificadas através da análise do sidebar e validação de rotas.

**Data de Criação**: $(date)
**Última Atualização**: $(date)
**Status**: Em Análise

## 🚨 Critical Issues - Rotas Faltantes

### 1. `/dashboard/companies` - CRÍTICO
**Status**: ❌ NÃO IMPLEMENTADO
**Impacto**: ADMIN não consegue gerenciar empresas
**Prioridade**: ALTA

#### Tarefas Necessárias:
- [ ] Criar `src/app/dashboard/companies/page.tsx`
- [ ] Criar `src/app/dashboard/companies/companies-client.tsx`
- [ ] Criar `src/app/api/companies/route.ts` (GET, POST)
- [ ] Criar `src/app/api/companies/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Implementar validações Zod para Company
- [ ] Implementar autenticação e autorização (apenas ADMIN)
- [ ] Criar componentes UI para listagem, criação, edição
- [ ] Implementar filtros e paginação

#### Estrutura Sugerida:
```typescript
// companies-client.tsx
interface Company {
  id: string
  name: string
  type: 'SUPPLIER' | 'CLIENT'
  email?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
}
```

### 2. `/dashboard/products` - CRÍTICO
**Status**: ❌ NÃO IMPLEMENTADO
**Impacto**: Todos os perfis não conseguem gerenciar produtos
**Prioridade**: ALTA

#### Tarefas Necessárias:
- [ ] Criar `src/app/dashboard/products/page.tsx`
- [ ] Criar `src/app/dashboard/products/products-client.tsx`
- [ ] Criar `src/app/api/products/route.ts` (GET, POST)
- [ ] Criar `src/app/api/products/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Implementar validações Zod para Product
- [ ] Implementar autenticação e autorização por perfil
- [ ] Criar componentes UI para listagem, criação, edição
- [ ] Implementar filtros por empresa, categoria, status
- [ ] Implementar busca por SKU, código, nome

#### Funcionalidades por Perfil:
- **ADMIN**: Visualizar todos os produtos de todas as empresas
- **SUPPLIER**: Visualizar apenas produtos da própria empresa
- **CLIENT**: Visualizar apenas produtos de fornecedores

### 3. `/dashboard/settings` - IMPORTANTE
**Status**: ❌ NÃO IMPLEMENTADO
**Impacto**: Nenhum usuário consegue acessar configurações
**Prioridade**: MÉDIA

#### Tarefas Necessárias:
- [ ] Criar `src/app/dashboard/settings/page.tsx`
- [ ] Criar `src/app/dashboard/settings/settings-client.tsx`
- [ ] Criar `src/app/api/settings/route.ts`
- [ ] Implementar configurações por perfil
- [ ] Criar componentes UI para configurações

#### Configurações por Perfil:
- **ADMIN**: Configurações do sistema, notificações, segurança
- **SUPPLIER**: Configurações da empresa, notificações, integrações
- **CLIENT**: Configurações pessoais, notificações, preferências

### 4. `/dashboard/reports` - IMPORTANTE
**Status**: ❌ NÃO IMPLEMENTADO
**Impacto**: ADMIN não consegue acessar relatórios
**Prioridade**: MÉDIA

#### Tarefas Necessárias:
- [ ] Criar `src/app/dashboard/reports/page.tsx`
- [ ] Criar `src/app/dashboard/reports/reports-client.tsx`
- [ ] Criar `src/app/api/reports/route.ts`
- [ ] Implementar relatórios diversos
- [ ] Criar componentes UI para gráficos e tabelas

#### Tipos de Relatórios:
- Relatório de vendas por fornecedor
- Relatório de produtos mais comparados
- Relatório de performance de matching
- Relatório de uploads por período
- Relatório de pré-pedidos por status

## 🔧 Technical Debt

### 1. Validação de Rotas no Sidebar
**Status**: ⚠️ NECESSÁRIO
**Descrição**: Implementar verificação automática de rotas existentes

#### Tarefas:
- [ ] Criar script para validar rotas do sidebar
- [ ] Implementar verificação de arquivos page.tsx
- [ ] Adicionar ao processo de build/CI

### 2. Melhorias de UX
**Status**: ⚠️ MELHORIA
**Descrição**: Aprimorar experiência do usuário

#### Tarefas:
- [ ] Adicionar loading states em todas as páginas
- [ ] Implementar error boundaries
- [ ] Melhorar feedback de ações (toast notifications)
- [ ] Implementar skeleton loading
- [ ] Adicionar confirmações para ações destrutivas

### 3. Performance
**Status**: ⚠️ OTIMIZAÇÃO
**Descrição**: Melhorar performance da aplicação

#### Tarefas:
- [ ] Implementar paginação em todas as listas
- [ ] Adicionar cache para queries frequentes
- [ ] Otimizar queries do Prisma
- [ ] Implementar lazy loading para componentes pesados

## 📊 Progresso Atual

### Rotas Funcionais:
- ✅ `/dashboard` - 100% funcional
- ✅ `/dashboard/users` - 100% funcional (ADMIN)
- ✅ `/dashboard/pre-orders` - 100% funcional
- ✅ `/dashboard/upload` - 100% funcional
- ✅ `/dashboard/history` - 100% funcional
- ✅ `/dashboard/compare` - 100% funcional (CLIENT)

### Rotas Pendentes:
- ❌ `/dashboard/companies` - 0% implementado
- ❌ `/dashboard/products` - 0% implementado
- ❌ `/dashboard/settings` - 0% implementado
- ❌ `/dashboard/reports` - 0% implementado

### Métricas por Perfil:
- **ADMIN**: 4/7 rotas funcionais (57%)
- **SUPPLIER**: 3/6 rotas funcionais (50%)
- **CLIENT**: 4/6 rotas funcionais (67%)

## 🎯 Próximos Passos

### Fase 1 - Rotas Críticas (Prioridade ALTA)
1. Implementar `/dashboard/companies`
2. Implementar `/dashboard/products`
3. Implementar `/dashboard/settings`

### Fase 2 - Melhorias (Prioridade MÉDIA)
1. Implementar `/dashboard/reports`
2. Melhorar UX/Performance
3. Implementar validação automática de rotas

### Fase 3 - Otimizações (Prioridade BAIXA)
1. Implementar cache e otimizações
2. Adicionar testes automatizados
3. Implementar CI/CD

## 📝 Notas de Implementação

### Padrões a Seguir:
- Usar componentes shadcn/ui existentes
- Implementar validações com Zod
- Seguir padrão de autenticação existente
- Usar TypeScript strict mode
- Implementar error handling consistente

### Estrutura de Arquivos:
```
src/app/dashboard/[feature]/
├── page.tsx (Server Component)
├── [feature]-client.tsx (Client Component)
└── components/ (se necessário)

src/app/api/[feature]/
├── route.ts (GET, POST)
└── [id]/route.ts (GET, PUT, DELETE)
```

### Validações Necessárias:
- Autenticação em todas as rotas
- Autorização baseada em role
- Validação de dados com Zod
- Tratamento de erros consistente
- Loading states e feedback visual
