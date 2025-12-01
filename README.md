# QR Code Tracker

Sistema de criação e rastreamento de QR Codes com dashboard de analytics.

## 🚀 Deploy em Produção (Docker)

Este projeto está configurado para usar um container PostgreSQL existente (`contador-visitas-db`).

### Pré-requisitos

-   Docker e Docker Compose instalados
-   Container PostgreSQL `contador-visitas-db` rodando
-   Acesso à rede Docker do container existente

### Passo a Passo

#### 1. Criar o banco de dados no container existente

```bash
# No servidor, execute:
docker exec -it contador-visitas-db psql -U postgres -c "CREATE DATABASE qrcode_tracker;"

# Verificar se foi criado:
docker exec -it contador-visitas-db psql -U postgres -c "\l"
```

#### 2. Descobrir a rede Docker do container

```bash
# Liste as redes
docker network ls

# Ou veja em qual rede o container está conectado
docker inspect contador-visitas-db --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}'
```

#### 3. Configurar variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.production.example .env

# Edite com suas configurações
nano .env
```

**Exemplo de `.env`:**

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_do_postgres
POSTGRES_DB=qrcode_tracker
DOCKER_NETWORK=contador-visitas_default
NEXTAUTH_SECRET=sua-chave-secreta-aqui
IP_HASH_SALT=salt-para-anonimizar-ips
NEXT_PUBLIC_BASE_URL=http://seu-servidor:3007
```

#### 4. Build e Deploy

```bash
# Build e iniciar
docker compose up -d --build

# Ver logs
docker compose logs -f app

# Verificar status
docker ps
```

#### 5. Verificar a aplicação

-   Dashboard: `http://seu-servidor:3007/dashboard/qr`
-   Health Check: `http://seu-servidor:3007/api/health`

### Comandos Úteis

```bash
# Parar a aplicação
docker compose down

# Reiniciar
docker compose restart

# Ver logs em tempo real
docker compose logs -f

# Acessar o container
docker exec -it qrcode-app sh

# Rodar migrations manualmente
docker exec -it qrcode-app npx prisma migrate deploy

# Ver status do banco
docker exec -it contador-visitas-db psql -U postgres -d qrcode_tracker -c "\dt"
```

### Troubleshooting

**Erro de conexão com o banco:**

1. Verifique se o container `contador-visitas-db` está rodando
2. Verifique se a rede Docker está correta no `.env`
3. Confirme usuário e senha do PostgreSQL

**Erro de rede não encontrada:**

```bash
# Liste as redes disponíveis
docker network ls

# Atualize DOCKER_NETWORK no .env com o nome correto
```

---

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar banco local (usando docker-compose com banco próprio)
# Ou configure DATABASE_URL no .env.local para um banco existente

# Rodar migrations
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/          # Endpoints da API
│   ├── dashboard/    # Páginas do dashboard
│   └── r/[id]/       # Redirecionamento de QR Codes
├── components/       # Componentes React
├── hooks/            # Custom hooks
└── lib/              # Utilitários e configurações
```

## 🔗 Endpoints da API

-   `POST /api/qr/create` - Criar QR Code
-   `GET /api/qr/[id]` - Obter QR Code
-   `PUT /api/qr/[id]/style` - Atualizar estilo
-   `DELETE /api/qr/[id]/delete` - Deletar QR Code
-   `GET /api/qr/preview` - Preview de QR Code
-   `GET /r/[id]` - Redirecionamento com tracking
