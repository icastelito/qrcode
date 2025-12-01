#!/bin/bash
# ================================
# Script para criar o banco de dados qrcode_tracker
# no container PostgreSQL existente (contador-visitas-db)
# ================================

echo "=== Criando banco de dados qrcode_tracker ==="

# Variáveis (ajuste conforme necessário)
CONTAINER_NAME="contador-visitas-db"
DB_USER="${POSTGRES_USER:-postgres}"
NEW_DB="qrcode_tracker"

# Verifica se o container está rodando
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Erro: Container '${CONTAINER_NAME}' não está rodando!"
    echo "   Execute: docker start ${CONTAINER_NAME}"
    exit 1
fi

# Verifica se o banco já existe
DB_EXISTS=$(docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -tAc "SELECT 1 FROM pg_database WHERE datname='${NEW_DB}'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "ℹ️  Banco de dados '${NEW_DB}' já existe!"
else
    # Cria o banco de dados
    echo "📦 Criando banco de dados '${NEW_DB}'..."
    docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -c "CREATE DATABASE ${NEW_DB};"
    
    if [ $? -eq 0 ]; then
        echo "✅ Banco de dados '${NEW_DB}' criado com sucesso!"
    else
        echo "❌ Erro ao criar o banco de dados!"
        exit 1
    fi
fi

# Lista os bancos de dados
echo ""
echo "=== Bancos de dados disponíveis ==="
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -c "\l"

echo ""
echo "=== Próximos passos ==="
echo "1. Copie o arquivo .env.production.example para .env"
echo "2. Configure as variáveis de ambiente no .env"
echo "3. Verifique o nome da rede Docker: docker network ls"
echo "4. Execute: docker compose up -d --build"
echo "5. As migrations serão aplicadas automaticamente no primeiro start"
