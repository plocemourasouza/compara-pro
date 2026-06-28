# Guia de Implantação - PriceCompare

## Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- Docker (opcional)
- Git

## 1. Preparação do Ambiente

### 1.1 Configuração do Banco de Dados PostgreSQL

```bash
# Via Docker
docker run --name pricecompare-postgres \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=price_comparison \
  -p 5432:5432 -d postgres:15

# Ou usando docker-compose (já configurado)
docker-compose up -d
```

### 1.2 Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

**Configurações obrigatórias para produção:**

```env
# Database
DATABASE_URL="postgresql://usuario:senha@host:5432/price_comparison_prod"

# Secrets (IMPORTANTE: Gere chaves seguras para produção)
JWT_SECRET="sua-chave-jwt-super-segura-aqui"
NEXTAUTH_SECRET="sua-chave-nextauth-super-segura-aqui"

# URLs
NEXTAUTH_URL="https://seudominio.com"
APP_URL="https://seudominio.com"

# Environment
NODE_ENV="production"
```

## 2. Migração do Banco de Dados

### 2.1 Migração de SQLite para PostgreSQL

Se estiver migrando do SQLite existente:

```bash
# 1. Instalar dependências
npm install

# 2. Gerar client Prisma com novo schema
npm run prisma:generate

# 3. Aplicar migrações
npm run prisma:migrate:deploy

# 4. (Opcional) Seed de dados iniciais
npm run prisma:seed
```

### 2.2 Criação de Usuário Admin

Execute o script para criar o primeiro usuário administrador:

```bash
node scripts/create-admin.js
```

**Credenciais padrão (ALTERE IMEDIATAMENTE):**
- Email: `admin@pricecompare.com`
- Senha: `admin123`

## 3. Build e Deploy

### 3.1 Build da Aplicação

```bash
# Instalar dependências
npm ci --production=false

# Build do projeto
npm run build

# Verificar build
npm run start
```

### 3.2 Deploy via Docker (Recomendado)

```dockerfile
# Dockerfile já incluído no projeto
FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --production=false

# Copiar código fonte
COPY . .

# Gerar Prisma client
RUN npm run prisma:generate

# Build da aplicação
RUN npm run build

# Remover devDependencies
RUN npm ci --production && npm cache clean --force

EXPOSE 3000

# Comando para produção
CMD ["npm", "start"]
```

### 3.3 Deploy via PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "pricecompare" -- start

# Configurar auto-start
pm2 startup
pm2 save
```

## 4. Configuração de Proxy Reverso (Nginx)

```nginx
server {
    listen 80;
    server_name seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5. Backup e Monitoramento

### 5.1 Backup do Banco de Dados

```bash
# Script de backup automático
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
```

### 5.2 Logs da Aplicação

```bash
# Visualizar logs PM2
pm2 logs pricecompare

# Logs Docker
docker logs pricecompare-app
```

## 6. Verificações Pós-Deploy

### 6.1 Health Check

Acesse: `https://seudominio.com/api/admin/system-health`

### 6.2 Testes Funcionais

1. **Login de Admin**
   - Acesse `/auth/login`
   - Use as credenciais do admin criado

2. **Upload de Produtos**
   - Teste upload de arquivo Excel/CSV
   - Verifique processamento

3. **Comparação de Preços**
   - Crie uma comparação
   - Verifique matches automáticos

4. **Pré-pedidos**
   - Crie um pré-pedido
   - Teste workflow cliente-fornecedor

## 7. Manutenção

### 7.1 Atualizações

```bash
# Backup antes da atualização
npm run backup

# Pull das mudanças
git pull origin main

# Instalar dependências
npm ci

# Executar migrações
npm run prisma:migrate:deploy

# Rebuild
npm run build

# Restart
pm2 restart pricecompare
```

### 7.2 Monitoramento de Performance

- Monitor de CPU/Memória
- Logs de erro da aplicação
- Tempo de resposta das APIs
- Uso do banco de dados

## 8. Problemas Conhecidos e Soluções

### 8.1 Erro de Conexão com Banco

```bash
# Verificar conectividade
psql $DATABASE_URL -c "SELECT 1"

# Verificar configuração Prisma
npm run prisma:studio
```

### 8.2 Erro de Permissões de Upload

```bash
# Configurar permissões do diretório
chmod 755 ./uploads
chown -R node:node ./uploads
```

### 8.3 Problemas de SSL

```bash
# Verificar certificados
openssl x509 -in certificate.crt -text -noout

# Renovar Let's Encrypt
certbot renew
```

## 9. Segurança

### 9.1 Configurações Obrigatórias

- [ ] JWT_SECRET alterado e seguro (32+ caracteres)
- [ ] NEXTAUTH_SECRET alterado e seguro
- [ ] Database com credenciais fortes
- [ ] SSL/TLS configurado
- [ ] Firewall configurado (apenas portas necessárias)
- [ ] Backup automático configurado

### 9.2 Atualizações de Segurança

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix
```

---

## Suporte

Para problemas específicos:
1. Consulte os logs da aplicação
2. Verifique o status do banco de dados
3. Confirme as variáveis de ambiente
4. Teste conectividade entre serviços

**Contato:** admin@pricecompare.com