-- ============================================================
-- SQL PARA SUPABASE (PostgreSQL)
-- ============================================================
-- Execute este SQL no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ou rode via CLI: psql "postgresql://..." -f supabase-schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSÕES
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- TABELAS
-- ------------------------------------------------------------

-- PROFILES (Perfis de usuário)
CREATE TABLE profiles (
    id              BIGSERIAL PRIMARY KEY,
    auth_id         TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    full_name       TEXT,
    display_name    TEXT,
    avatar_url      TEXT,
    password_hash   TEXT,
    bio             TEXT,
    favorite_genres TEXT,
    role            TEXT NOT NULL DEFAULT 'client',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PREFERENCES (Preferências do usuário)
CREATE TABLE preferences (
    id                         BIGSERIAL PRIMARY KEY,
    profile_id                 BIGINT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    avatar_index               INT NOT NULL DEFAULT 0,
    genres                     TEXT NOT NULL DEFAULT '',
    recommendations_updated_at TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WATCHLIST (Minha Lista)
CREATE TABLE watchlist (
    id          BIGSERIAL PRIMARY KEY,
    profile_id  BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tmdb_id     INT NOT NULL,
    media_type  TEXT NOT NULL,
    title       TEXT NOT NULL,
    poster_url  TEXT,
    backdrop_url TEXT,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, tmdb_id, media_type)
);

-- WATCH_HISTORY (Continue Assistindo / Histórico)
CREATE TABLE watch_history (
    id              BIGSERIAL PRIMARY KEY,
    profile_id      BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tmdb_id         INT NOT NULL,
    media_type      TEXT NOT NULL,
    title           TEXT NOT NULL,
    poster_url      TEXT,
    backdrop_url    TEXT,
    season_number   INT NOT NULL DEFAULT 0,
    episode_number  INT NOT NULL DEFAULT 0,
    total_seasons   INT NOT NULL DEFAULT 0,
    total_episodes  INT NOT NULL DEFAULT 0,
    progress_percent REAL NOT NULL DEFAULT 0,
    watched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, tmdb_id, media_type)
);

-- RATINGS (Avaliações: love/like/dislike)
CREATE TABLE ratings (
    id          BIGSERIAL PRIMARY KEY,
    profile_id  BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tmdb_id     INT NOT NULL,
    media_type  TEXT NOT NULL,
    value       TEXT NOT NULL CHECK (value IN ('love', 'like', 'dislike')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_id, tmdb_id, media_type)
);

-- ------------------------------------------------------------
-- ÍNDICES PARA PERFORMANCE
-- ------------------------------------------------------------
CREATE INDEX idx_profiles_auth_id      ON profiles(auth_id);
CREATE INDEX idx_profiles_email        ON profiles(email);
CREATE INDEX idx_watchlist_profile_id  ON watchlist(profile_id);
CREATE INDEX idx_watchlist_tmdb_id     ON watchlist(tmdb_id);
CREATE INDEX idx_watch_history_profile ON watch_history(profile_id);
CREATE INDEX idx_watch_history_tmdb    ON watch_history(tmdb_id);
CREATE INDEX idx_ratings_profile_id    ON ratings(profile_id);
CREATE INDEX idx_ratings_tmdb_id       ON ratings(tmdb_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) — POLÍTICAS DE ACESSO
-- ------------------------------------------------------------
-- Habilita RLS em todas as tabelas
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings       ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
-- Usuários podem ver seu próprio perfil
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid()::text = auth_id);

-- Usuários podem inserir seu próprio perfil (signup)
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid()::text = auth_id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid()::text = auth_id);

-- ------------------------------------------------------------
-- PREFERENCES
-- ------------------------------------------------------------
CREATE POLICY "preferences_select_own" ON preferences
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "preferences_insert_own" ON preferences
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "preferences_update_own" ON preferences
    FOR UPDATE USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

-- ------------------------------------------------------------
-- WATCHLIST
-- ------------------------------------------------------------
CREATE POLICY "watchlist_select_own" ON watchlist
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "watchlist_insert_own" ON watchlist
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "watchlist_delete_own" ON watchlist
    FOR DELETE USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

-- ------------------------------------------------------------
-- WATCH_HISTORY
-- ------------------------------------------------------------
CREATE POLICY "watch_history_select_own" ON watch_history
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "watch_history_insert_own" ON watch_history
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "watch_history_update_own" ON watch_history
    FOR UPDATE USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "watch_history_delete_own" ON watch_history
    FOR DELETE USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

-- ------------------------------------------------------------
-- RATINGS
-- ------------------------------------------------------------
CREATE POLICY "ratings_select_own" ON ratings
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "ratings_insert_own" ON ratings
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "ratings_update_own" ON ratings
    FOR UPDATE USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

CREATE POLICY "ratings_delete_own" ON ratings
    FOR DELETE USING (
        profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()::text)
    );

-- ------------------------------------------------------------
-- TRIGGERS PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM anon, authenticated;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
    BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- FUNÇÕES AUXILIARES (OPCIONAL - para queries complexas)
-- ------------------------------------------------------------

-- Busca itens da watchlist com contagem
CREATE OR REPLACE FUNCTION get_watchlist_with_count(p_profile_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    tmdb_id INT,
    media_type TEXT,
    title TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    added_at TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT w.id, w.tmdb_id, w.media_type, w.title, w.poster_url, w.backdrop_url, w.added_at
    FROM watchlist w
    WHERE w.profile_id = p_profile_id
    ORDER BY w.added_at DESC;
$$;

-- Busca histórico de watch com progresso
CREATE OR REPLACE FUNCTION get_watch_history_with_progress(p_profile_id BIGINT, p_limit INT DEFAULT 20)
RETURNS TABLE (
    id BIGINT,
    tmdb_id INT,
    media_type TEXT,
    title TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    season_number INT,
    episode_number INT,
    total_seasons INT,
    total_episodes INT,
    progress_percent REAL,
    watched_at TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT h.id, h.tmdb_id, h.media_type, h.title, h.poster_url, h.backdrop_url,
           h.season_number, h.episode_number, h.total_seasons, h.total_episodes,
           h.progress_percent, h.watched_at
    FROM watch_history h
    WHERE h.profile_id = p_profile_id
    ORDER BY h.watched_at DESC
    LIMIT p_limit;
$$;

-- Upsert de rating (insert ou update)
CREATE OR REPLACE FUNCTION upsert_rating(
    p_profile_id BIGINT,
    p_tmdb_id INT,
    p_media_type TEXT,
    p_value TEXT
) RETURNS ratings LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_rating ratings;
BEGIN
    INSERT INTO ratings (profile_id, tmdb_id, media_type, value)
    VALUES (p_profile_id, p_tmdb_id, p_media_type, p_value)
    ON CONFLICT (profile_id, tmdb_id, media_type)
    DO UPDATE SET value = EXCLUDED.value, created_at = NOW()
    RETURNING * INTO v_rating;
    RETURN v_rating;
END;
$$;

-- ------------------------------------------------------------
-- COMENTÁRIOS NAS TABELAS E COLUNAS (DOCUMENTAÇÃO)
-- ------------------------------------------------------------
COMMENT ON TABLE profiles       IS 'Perfis de usuário (um por auth.user)';
COMMENT ON TABLE preferences    IS 'Preferências de UI e recomendações por perfil';
COMMENT ON TABLE watchlist      IS 'Itens salvos em "Minha Lista"';
COMMENT ON TABLE watch_history  IS 'Histórico de exibição com progresso de episódios';
COMMENT ON TABLE ratings        IS 'Avaliações: love, like, dislike';

COMMENT ON COLUMN watch_history.season_number  IS '0 para filmes, >0 para séries';
COMMENT ON COLUMN watch_history.episode_number IS '0 para filmes, >0 para séries';
COMMENT ON COLUMN ratings.value                IS 'love | like | dislike';

-- ------------------------------------------------------------
-- VERIFICAÇÃO FINAL
-- ------------------------------------------------------------
-- Lista todas as tabelas criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'preferences', 'watchlist', 'watch_history', 'ratings')
ORDER BY table_name;

-- Verifica se RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'preferences', 'watchlist', 'watch_history', 'ratings');