-- ============================================================
-- fix_user_validation.sql
-- Run once in the Supabase SQL Editor AFTER redeploying the backend.
-- Purpose: make user validation consistent with the new backend rules:
--   1) Lowercase trim all existing emails so login/register duplicate
--      checks match.
--   2) Remove duplicate accounts that share the same email
--      (keeps the OLDEST account), cleaning up dependent rows first.
--   3) Create a unique index on LOWER(email) so duplicates are
--      impossible at the database level from now on.
-- ============================================================

BEGIN;

-- 1) Normalize existing emails. New registrations are always stored
--    lowercase, and new checks are case-insensitive (LOWER(email)).
UPDATE users
SET email = LOWER(BTRIM(email))
WHERE email IS DISTINCT FROM LOWER(BTRIM(email));

-- 2) (OPTIONAL — remove this whole "DELETE" section if you are sure
--    there are no accidental duplicate accounts, or if it fails because
--    you do not have one of the child tables.)
--    Removes duplicate accounts sharing the same email, keeping the
--    account with the smallest user_id. Dependent rows are deleted first.
--    Uncomment the child-table deletes that apply to your schema.
--    The `users` delete itself is safe to run even without the child ones.

-- DELETE FROM farmers              WHERE user_id IN (SELECT b.user_id FROM (SELECT MIN(a.user_id) AS keep_id, LOWER(a.email) AS email FROM users a GROUP BY LOWER(a.email) HAVING COUNT(*) > 1) k, users b WHERE LOWER(b.email) = k.email AND b.user_id <> k.keep_id);
-- DELETE FROM buyers               WHERE user_id IN (SELECT b.user_id FROM (SELECT MIN(a.user_id) AS keep_id, LOWER(a.email) AS email FROM users a GROUP BY LOWER(a.email) HAVING COUNT(*) > 1) k, users b WHERE LOWER(b.email) = k.email AND b.user_id <> k.keep_id);
-- DELETE FROM cooperatives         WHERE user_id IN (SELECT b.user_id FROM (SELECT MIN(a.user_id) AS keep_id, LOWER(a.email) AS email FROM users a GROUP BY LOWER(a.email) HAVING COUNT(*) > 1) k, users b WHERE LOWER(b.email) = k.email AND b.user_id <> k.keep_id);
-- DELETE FROM user_management_logs WHERE user_id IN (SELECT b.user_id FROM (SELECT MIN(a.user_id) AS keep_id, LOWER(a.email) AS email FROM users a GROUP BY LOWER(a.email) HAVING COUNT(*) > 1) k, users b WHERE LOWER(b.email) = k.email AND b.user_id <> k.keep_id);
-- DELETE FROM sub_admin_assignments WHERE sub_admin_id IN (SELECT b.user_id FROM (SELECT MIN(a.user_id) AS keep_id, LOWER(a.email) AS email FROM users a GROUP BY LOWER(a.email) HAVING COUNT(*) > 1) k, users b WHERE LOWER(b.email) = k.email AND b.user_id <> k.keep_id);

-- DELETE FROM users                WHERE user_id IN (SELECT b.user_id FROM (SELECT MIN(a.user_id) AS keep_id, LOWER(a.email) AS email FROM users a GROUP BY LOWER(a.email) HAVING COUNT(*) > 1) k, users b WHERE LOWER(b.email) = k.email AND b.user_id <> k.keep_id);

-- 3) Database-level guarantee: one email per account, regardless of casing.
--    Fails ONLY if duplicates still exist after step 2 — in that case
--    uncomment the DELETE sections above, or review duplicates with:
--        SELECT LOWER(email), COUNT(*) FROM users GROUP BY LOWER(email) HAVING COUNT(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (LOWER(email));

-- Existing index on the raw email column can stay (or drop to avoid confusion):
-- DROP INDEX IF EXISTS idx_users_email;

COMMIT;