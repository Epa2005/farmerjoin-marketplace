-- SQL Script to Fix Sub-Admin User 114 Location Issue
-- Database: project6

-- 1. Check the current data for user_id 114
SELECT '=== CURRENT DATA FOR USER 114 ===' as info;
SELECT user_id, full_name, email, role, province, district, sector, location, status 
FROM users 
WHERE user_id = 114;

-- 2. Check if there's an existing assignment for user_id 114
SELECT '=== EXISTING ASSIGNMENT FOR USER 114 ===' as info;
SELECT * FROM sub_admin_assignments WHERE sub_admin_id = 114;

-- 3. Update user 114's location data (replace with actual location values)
-- IMPORTANT: Replace the values below with the actual location data for this sub-admin
UPDATE users 
SET 
    province = 'Kigali',
    district = 'Gasabo',
    sector = 'Kinyinya',
    location = 'Kigali,Gasabo,Kinyinya'
WHERE user_id = 114;

-- 4. Create sub_admin_assignments record for user 114
INSERT INTO sub_admin_assignments (sub_admin_id, assigned_location, province, district, sector, management_level, assigned_by, is_active)
VALUES (
    114,
    'Kigali,Gasabo,Kinyinya',
    'Kigali',
    'Gasabo',
    'Kinyinya',
    'sector',
    114,
    TRUE
)
ON DUPLICATE KEY UPDATE
    assigned_location = 'Kigali,Gasabo,Kinyinya',
    province = 'Kigali',
    district = 'Gasabo',
    sector = 'Kinyinya',
    management_level = 'sector',
    is_active = TRUE;

-- 5. Verify the fix
SELECT '=== VERIFICATION AFTER FIX ===' as info;
SELECT u.user_id, u.full_name, u.email, u.province, u.district, u.sector, 
       saa.assigned_location, saa.management_level, saa.is_active
FROM users u
LEFT JOIN sub_admin_assignments saa ON u.user_id = saa.sub_admin_id AND saa.is_active = TRUE
WHERE u.user_id = 114;

SELECT '=== FIX COMPLETE ===' as info;
SELECT 'User 114 location data has been updated and assignment created.' as message;
