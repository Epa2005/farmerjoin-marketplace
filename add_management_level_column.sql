-- Migration script to add management_level columns to sub_admin_assignments table
-- Run this in your MySQL database for farmerjoin_marketplace

-- Add province, district, sector columns if they don't exist
ALTER TABLE sub_admin_assignments 
ADD COLUMN IF NOT EXISTS province VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS district VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS sector VARCHAR(255) NOT NULL DEFAULT '';

-- Add management_level column if it doesn't exist
ALTER TABLE sub_admin_assignments 
ADD COLUMN IF NOT EXISTS management_level ENUM('province', 'district', 'sector') DEFAULT 'sector' COMMENT 'Level at which sub_admin manages farmers';

-- Update existing records to populate province, district, sector from assigned_location
UPDATE sub_admin_assignments 
SET 
    province = SUBSTRING_INDEX(assigned_location, ',', 1),
    district = SUBSTRING_INDEX(SUBSTRING_INDEX(assigned_location, ',', 2), ',', -1),
    sector = SUBSTRING_INDEX(assigned_location, ',', -1)
WHERE province = '' OR district = '' OR sector = '';

-- Add index for management_level for better performance
CREATE INDEX IF NOT EXISTS idx_management_level ON sub_admin_assignments(management_level);

SELECT 'Migration completed successfully!' as status;
