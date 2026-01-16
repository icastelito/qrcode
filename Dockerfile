# ================================
# Dockerfile otimizado para Next.js em produção
# ================================

# Estágio 1: Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copia arquivos de dependências
COPY package.json ./
COPY prisma ./prisma/

# Instala dependências (usa npm install para gerar dependências corretas para Linux)
RUN npm install --legacy-peer-deps

# ================================
# Estágio 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copia dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Define variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# DATABASE_URL dummy para build (páginas dinâmicas não precisam de conexão real)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Build da aplicação
RUN npm run build

# ================================
# Estágio 3: Runner (Produção)
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos públicos
COPY --from=builder /app/public ./public

# Configura diretório de cache do Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia o build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia Prisma para migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Inicialização: apenas inicia o servidor (migrations devem ser executadas manualmente)
CMD ["node", "server.js"]
