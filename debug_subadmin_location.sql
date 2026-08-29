-- Debug sub-admin location assignment issue
-- Check if sub-admin has proper assignment in sub_admin_assignments table

-- 1. Check sub-admin user details
SELECT user_id, full_name, email, role, province, district, sector, cell 
FROM users 
WHERE role = 'sub_admin' 
ORDER BY user_id DESC 
LIMIT 5;

-- 2. Check sub_admin_assignments for all sub-admins
SELECT sa.sub_admin_id, u.full_name as sub_admin_name, u.email as sub_admin_email,
       sa.province, sa.district, sa.sector, sa.management_level, sa.is_active
FROM sub_admin_assignments sa
JOIN users u ON sa.sub_admin_id = u.user_id
WHERE u.role = 'sub_admin'
ORDER BY sa.sub_admin_id;

-- 3. Check farmers with Kigali, Gasabo, Kinyinya location
SELECT user_id, full_name, email, role, province, district, sector, cell, status, created_at
FROM users 
WHERE role = 'farmer' 
  AND province = 'Kigali' 
  AND district = 'Gasabo' 
  AND sector = 'Kinyinya' 
ORDER BY created_at DESC;

-- 4. Check if there are farmers in Kigali at all
SELECT COUNT(*) as total_farmers_kigali,
       COUNT(CASE WHEN district = 'Gasabo' AND sector = 'Kinyinya' THEN 1 END) as farmers_specific_location
FROM users 
WHERE role = 'farmer' 
  AND province = 'Kigali';

-- 5. Test the exact query used by sub-admin managed-users endpoint
-- This simulates what happens when sub-admin tries to fetch farmers
SELECT u.* 
FROM users u
WHERE u.province = 'Kigali' 
  AND u.district = 'Gasabo' 
  AND u.sector = 'Kinyinya' 
  AND u.role IN ('farmer', 'cooperative')
ORDER BY u.created_at DESC;
