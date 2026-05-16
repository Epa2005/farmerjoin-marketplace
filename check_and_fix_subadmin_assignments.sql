-- SQL Script to Check and Fix Sub-Admin Assignment Issues
-- This script helps diagnose and fix location assignment problems for sub-admins
-- Database: project6

-- 1. Check all sub-admin users
SELECT '=== ALL SUB-ADMIN USERS ===' as info;
SELECT user_id, full_name, email, role, province, district, sector, location, status 
FROM users 
WHERE role = 'sub_admin';

-- 2. Check sub_admin_assignments table
SELECT '=== SUB_ADMIN ASSIGNMENTS TABLE ===' as info;
SELECT saa.*, u.full_name, u.email 
FROM sub_admin_assignments saa
JOIN users u ON saa.sub_admin_id = u.user_id
ORDER BY saa.created_at DESC;

-- 3. Check for sub-admins without assignments
SELECT '=== SUB-ADMINS WITHOUT ASSIGNMENTS ===' as info;
SELECT u.user_id, u.full_name, u.email, u.province, u.district, u.sector, u.location
FROM users u
LEFT JOIN sub_admin_assignments saa ON u.user_id = saa.sub_admin_id AND saa.is_active = TRUE
WHERE u.role = 'sub_admin' AND saa.id IS NULL;

-- 4. Check for mismatched assignments (user_id doesn't match)
SELECT '=== POTENTIAL MISMATCHED ASSIGNMENTS ===' as info;
SELECT saa.*, u.full_name, u.email, u.user_id as actual_user_id
FROM sub_admin_assignments saa
LEFT JOIN users u ON saa.sub_admin_id = u.user_id
WHERE u.user_id IS NULL;

-- 5. Auto-fix: Create missing assignments for sub-admins using their own location data
-- This will insert assignments for sub-admins who have location data but no assignment record

INSERT INTO sub_admin_assignments (sub_admin_id, assigned_location, province, district, sector, management_level, assigned_by, is_active)
SELECT 
    u.user_id,
    CONCAT(u.province, ',', u.district, ',', u.sector) as assigned_location,
    u.province,
    u.district,
    u.sector,
    'sector' as management_level,
    u.user_id as assigned_by,  -- Self-assigned
    TRUE as is_active
FROM users u
LEFT JOIN sub_admin_assignments saa ON u.user_id = saa.sub_admin_id AND saa.is_active = TRUE
WHERE u.role = 'sub_admin' 
  AND saa.id IS NULL
  AND u.province IS NOT NULL 
  AND u.district IS NOT NULL 
  AND u.sector IS NOT NULL;

-- 6. Verify the fix
SELECT '=== VERIFICATION: SUB-ADMINS WITH ASSIGNMENTS AFTER FIX ===' as info;
SELECT u.user_id, u.full_name, u.email, saa.province, saa.district, saa.sector, saa.management_level, saa.is_active
FROM users u
JOIN sub_admin_assignments saa ON u.user_id = saa.sub_admin_id AND saa.is_active = TRUE
WHERE u.role = 'sub_admin'
ORDER BY u.created_at DESC;

-- 7. Update existing assignments to include province, district, sector columns if they are missing
UPDATE sub_admin_assignments saa
JOIN users u ON saa.sub_admin_id = u.user_id
SET 
    saa.province = u.province,
    saa.district = u.district,
    saa.sector = u.sector
WHERE saa.province = '' OR saa.province IS NULL;

SELECT '=== FIX COMPLETE ===' as info;
SELECT 'Sub-admin assignments have been checked and fixed.' as message;
