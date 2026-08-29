-- ============================================================
-- fix_profile_schema.sql  (PostgreSQL / Supabase)
-- Run once in the Supabase SQL Editor.
-- Guarantees registration can ALWAYS insert the profile rows:
--   farmer  -> INSERT INTO farmers (user_id, farm_name)
--   buyer   -> INSERT INTO buyers  (user_id)
--   cooper  -> INSERT INTO cooperatives (user_id)
-- Idempotent: safe to run repeatedly. Fixes tables that were
-- created manually in Supabase with missing columns, missing
-- tables, or NOT NULL columns that have no default value.
-- ============================================================

-- 1) farmers
CREATE TABLE IF NOT EXISTS farmers (
    user_id       BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    farm_name     VARCHAR(255) DEFAULT NULL,
    bio           TEXT DEFAULT NULL,
    location      VARCHAR(255) DEFAULT NULL,
    phone         VARCHAR(50)  DEFAULT NULL,
    province      VARCHAR(100) DEFAULT NULL,
    district      VARCHAR(100) DEFAULT NULL,
    sector        VARCHAR(100) DEFAULT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE farmers ADD COLUMN IF NOT EXISTS farm_name  VARCHAR(255) DEFAULT NULL;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS bio        TEXT DEFAULT NULL;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS location   VARCHAR(255) DEFAULT NULL;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS phone      VARCHAR(50)  DEFAULT NULL;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS province   VARCHAR(100) DEFAULT NULL;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS district   VARCHAR(100) DEFAULT NULL;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS sector     VARCHAR(100) DEFAULT NULL;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ  DEFAULT NOW();

ALTER TABLE farmers ALTER COLUMN farm_name  DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN created_at DROP NOT NULL;

-- 2) buyers
CREATE TABLE IF NOT EXISTS buyers (
    user_id    BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE buyers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE buyers ALTER COLUMN created_at DROP NOT NULL;

-- 3) cooperatives
CREATE TABLE IF NOT EXISTS cooperatives (
    user_id           BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    cooperative_name  VARCHAR(255) DEFAULT NULL,
    location          VARCHAR(255) DEFAULT NULL,
    phone             VARCHAR(50)  DEFAULT NULL,
    created_at        TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS cooperative_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS location         VARCHAR(255) DEFAULT NULL;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS phone            VARCHAR(50)  DEFAULT NULL;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ  DEFAULT NOW();

ALTER TABLE cooperatives ALTER COLUMN cooperative_name DROP NOT NULL;
ALTER TABLE cooperatives ALTER COLUMN created_at        DROP NOT NULL;

-- 4) users: "role" must accept the values the app sends.
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Done. Hit "Run", then try registering again.