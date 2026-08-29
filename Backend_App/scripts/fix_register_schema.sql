-- ============================================================
-- FIX: Registration returns HTTP 500 on the deployed app
-- Target database: PostgreSQL (Supabase or Aiven) on Render
-- Run this once in the Supabase SQL Editor (or psql) for your
-- production database BEFORE redeploying.
-- ============================================================

-- 1) farmers table: the app INSERTs (user_id, farm_name). Older code
--    also referenced created_at, which was missing. Add all expected
--    columns so neither path can fail.
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS farm_name      VARCHAR(255) DEFAULT NULL;
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS bio            TEXT DEFAULT NULL;
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS location       VARCHAR(255) DEFAULT NULL;
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS phone          VARCHAR(50)  DEFAULT NULL;
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS province       VARCHAR(100) DEFAULT NULL;
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS district       VARCHAR(100) DEFAULT NULL;
ALTER TABLE farmers      ADD COLUMN IF NOT EXISTS sector         VARCHAR(100) DEFAULT NULL;

-- 2) buyers table: the app INSERTs (user_id) and older code
--    referenced created_at as well.
ALTER TABLE buyers       ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ DEFAULT NOW();

-- 3) cooperatives table: the app INSERTs
--    (user_id, cooperative_name, location, phone).
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS cooperative_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS location         VARCHAR(255) DEFAULT NULL;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS phone            VARCHAR(50)  DEFAULT NULL;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ DEFAULT NOW();

-- 4) users table: columns used by registration/login/presence.
ALTER TABLE users        ADD COLUMN IF NOT EXISTS status       VARCHAR(20)   DEFAULT 'active';
ALTER TABLE users        ADD COLUMN IF NOT EXISTS location     VARCHAR(255) DEFAULT NULL;
ALTER TABLE users        ADD COLUMN IF NOT EXISTS province     VARCHAR(100) DEFAULT NULL;
ALTER TABLE users        ADD COLUMN IF NOT EXISTS district     VARCHAR(100) DEFAULT NULL;
ALTER TABLE users        ADD COLUMN IF NOT EXISTS sector       VARCHAR(100) DEFAULT NULL;
ALTER TABLE users        ADD COLUMN IF NOT EXISTS last_seen    TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users        ADD COLUMN IF NOT EXISTS is_online    BOOLEAN DEFAULT FALSE;

-- 5) Indexes for the duplicate-email check and role filtering.
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- Done. Try registering again.

-- ============================================================
-- IMPORTANT: If your Render database is MySQL instead of
-- PostgreSQL, run the block below instead (not the one above).
-- ============================================================
-- ALTER TABLE farmers
--   ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   ADD COLUMN IF NOT EXISTS farm_name VARCHAR(255) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL;
--
-- ALTER TABLE buyers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
--
-- ALTER TABLE cooperatives
--   ADD COLUMN IF NOT EXISTS cooperative_name VARCHAR(255) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
--
-- ALTER TABLE users
--   MODIFY COLUMN role ENUM('farmer','buyer','cooperative','admin','sub_admin','super_admin') NOT NULL DEFAULT 'farmer',
--   ADD COLUMN IF NOT EXISTS status ENUM('active','banned','suspended') NOT NULL DEFAULT 'active',
--   ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP NULL DEFAULT NULL,
--   ADD COLUMN IF NOT EXISTS is_online TINYINT(1) DEFAULT 0;