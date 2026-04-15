-- Step 1: Find farmers that need location updates
-- First, see what farmers exist and their current locations
SELECT user_id, full_name, email, province, district, sector, status
FROM users 
WHERE role = 'farmer' 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Find specific farmers that need Kigali, Gasabo, Kinyinya location
-- Look for farmers with partial or incorrect location data
SELECT user_id, full_name, email, province, district, sector
FROM users 
WHERE role = 'farmer' 
  AND (province IS NULL OR province != 'Kigali' 
       OR district IS NULL OR district != 'Gasabo' 
       OR sector IS NULL OR sector != 'Kinyinya')
ORDER BY created_at DESC;

-- Step 3: Update specific farmers with correct location
-- Option A: Update all farmers with incorrect locations
UPDATE users 
SET province = 'Kigali', district = 'Gasabo', sector = 'Kinyinya' 
WHERE role = 'farmer' 
  AND (province IS NULL OR province != 'Kigali' 
       OR district IS NULL OR district != 'Gasabo' 
       OR sector IS NULL OR sector != 'Kinyinya');

-- Step 4: Verify the updates
SELECT user_id, full_name, email, province, district, sector, status
FROM users 
WHERE role = 'farmer' 
  AND province = 'Kigali' 
  AND district = 'Gasabo' 
  AND sector = 'Kinyinya' 
ORDER BY created_at DESC;
