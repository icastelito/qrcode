-- Tabela de Usuários
CREATE TABLE
    "user" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password_hash" TEXT NOT NULL,
        "is_admin" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_pkey" PRIMARY KEY ("id")
    );

-- Tabela de Sessões
CREATE TABLE
    "session" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "session_pkey" PRIMARY KEY ("id")
    );

-- Tabela de Códigos de Recuperação de Senha
CREATE TABLE
    "password_reset_code" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "password_reset_code_pkey" PRIMARY KEY ("id")
    );

-- Tabela de Projetos
CREATE TABLE
    "project" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "user_id" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "project_pkey" PRIMARY KEY ("id")
    );

-- Adicionar colunas user_id e project_id à tabela qr_code (nullable para não quebrar dados existentes)
ALTER TABLE "qr_code"
ADD COLUMN "user_id" TEXT;

ALTER TABLE "qr_code"
ADD COLUMN "project_id" TEXT;

-- Índices únicos
CREATE UNIQUE INDEX "user_email_key" ON "user" ("email");

CREATE UNIQUE INDEX "session_token_key" ON "session" ("token");

-- Índices de busca
CREATE INDEX "session_token_idx" ON "session" ("token");

CREATE INDEX "session_user_id_idx" ON "session" ("user_id");

CREATE INDEX "password_reset_code_user_id_idx" ON "password_reset_code" ("user_id");

CREATE INDEX "password_reset_code_code_idx" ON "password_reset_code" ("code");

CREATE INDEX "project_user_id_idx" ON "project" ("user_id");

CREATE INDEX "qr_code_user_id_idx" ON "qr_code" ("user_id");

CREATE INDEX "qr_code_project_id_idx" ON "qr_code" ("project_id");

-- Foreign Keys
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "password_reset_code" ADD CONSTRAINT "password_reset_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project" ADD CONSTRAINT "project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "qr_code" ADD CONSTRAINT "qr_code_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE SET NULL ON UPDATE CASCADE;