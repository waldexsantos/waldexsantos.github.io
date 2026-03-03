-- ============================================================
--  ServiçosPro — Schema PostgreSQL para Neon
--  Execute este arquivo no SQL Editor do Neon Console
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Usuários ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(50)  UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    TEXT NOT NULL,           -- bcrypt hash
  role        VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Categorias ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  VARCHAR(100) UNIQUE NOT NULL
);

-- ── Prestadores ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS providers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  nickname     VARCHAR(100),
  phone        VARCHAR(30)  NOT NULL,
  email        VARCHAR(255),
  website      VARCHAR(255),
  address      TEXT,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  emergency    BOOLEAN NOT NULL DEFAULT FALSE,
  hours        VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Avaliações ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, user_id)   -- um voto por usuário por prestador
);

-- ── Comentários ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  status      VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_providers_category   ON providers(category_id);
CREATE INDEX IF NOT EXISTS idx_ratings_provider     ON ratings(provider_id);
CREATE INDEX IF NOT EXISTS idx_comments_provider    ON comments(provider_id);
CREATE INDEX IF NOT EXISTS idx_comments_status      ON comments(status);

-- ── Seed: categorias padrão ───────────────────────────────────
INSERT INTO categories (name) VALUES
  ('Pedreiro'), ('Carpinteiro'), ('Encanador'),
  ('Serralheiro'), ('Eletricista'), ('Pintor')
ON CONFLICT (name) DO NOTHING;

-- ── Seed: admin padrão ───────────────────────────────────────
-- Senha: admin123  (hash bcrypt rounds=10)
INSERT INTO users (username, email, password, role) VALUES (
  'admin',
  'admin@sistema.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lbu',
  'admin'
) ON CONFLICT (username) DO NOTHING;
