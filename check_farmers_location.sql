-- Check farmers with specific location (Kigali, Gasabo, Kinyinya)
SELECT user_id, full_name, email, role, province, district, sector, cell 
FROM users 
WHERE role = 'farmer' 
  AND province = 'Kigali' 
  AND district = 'Gasabo' 
  AND sector = 'Kinyinya' 
LIMIT 5;

-- Check all farmers in Kigali
SELECT user_id, full_name, email, role, province, district, sector, cell 
FROM users 
WHERE role = 'farmer' 
  AND province = 'Kigali' 
LIMIT 10;

-- Check sub-admin assignments
SELECT sa.sub_admin_id, u.full_name as sub_admin_name, u.email as sub_admin_email,
       sa.province, sa.district, sa.sector, sa.management_level, sa.is_active
FROM sub_admin_assignments sa
JOIN users u ON sa.sub_admin_id = u.user_id
WHERE u.role = 'sub_admin'
ORDER BY sa.sub_admin_id;
