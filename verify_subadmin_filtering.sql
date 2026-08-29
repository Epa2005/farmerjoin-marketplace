-- Verify sub-admin location filtering is working correctly
-- This script checks if sub-admin has proper assignment and if farmers match

-- 1. Check sub-admin details and their assignment
SELECT u.user_id, u.full_name, u.email, u.role, 
       u.province, u.district, u.sector,
       sa.province as assigned_province, 
       sa.district as assigned_district, 
       sa.sector as assigned_sector,
       sa.management_level, 
       sa.is_active
FROM users u
LEFT JOIN sub_admin_assignments sa ON u.user_id = sa.sub_admin_id
WHERE u.role = 'sub_admin'
ORDER BY u.user_id DESC;

-- 2. Check farmers that should be visible to sub-admin with Kigali, Gasabo, Kinyinya assignment
SELECT user_id, full_name, email, role, province, district, sector, status, created_at
FROM users 
WHERE role = 'farmer' 
  AND province = 'Kigali' 
  AND district = 'Gasabo' 
  AND sector = 'Kinyinya' 
ORDER BY created_at DESC;

-- 3. Count farmers by location to see distribution
SELECT province, district, sector, COUNT(*) as farmer_count
FROM users 
WHERE role = 'farmer'
GROUP BY province, district, sector
ORDER BY farmer_count DESC;

-- 4. Test the exact query used by sub-admin managed-users endpoint for sector level
SELECT u.* 
FROM users u
WHERE u.province = 'Kigali' 
  AND u.district = 'Gasabo' 
  AND u.sector = 'Kinyinya' 
  AND u.role IN ('farmer', 'cooperative')
ORDER BY u.created_at DESC;

-- 5. Test for district level (if management_level is district)
SELECT u.* 
FROM users u
WHERE u.province = 'Kigali' 
  AND u.district = 'Gasabo' 
  AND u.role IN ('farmer', 'cooperative')
ORDER BY u.created_at DESC;

-- 6. Test for province level (if management_level is province)
SELECT u.* 
FROM users u
WHERE u.province = 'Kigali' 
  AND u.role IN ('farmer', 'cooperative')
ORDER BY u.created_at DESC;
