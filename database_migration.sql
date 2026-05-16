-- Database Migration Script for FarmerJoin Marketplace
-- Adds sub_admin role and user management system
-- Updates existing admin users to super_admin

-- Run this script in your MySQL database to implement the user management system

-- 1. Add new columns to users table for user management
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'banned', 'suspended') DEFAULT 'active',
ADD COLUMN IF NOT EXISTS banned_by VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS suspended_by VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS managed_by VARCHAR(255) NULL COMMENT 'ID of sub_admin who manages this user',
ADD COLUMN IF NOT EXISTS assigned_location VARCHAR(255) NULL COMMENT 'Location assigned to sub_admin';

-- 2. Update users table to include sub_admin and super_admin roles
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'sub_admin', 'admin', 'farmer', 'cooperative', 'buyer') NOT NULL;

-- 3. Update current admin users to super_admin role
UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- 4. Create user_management_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS user_management_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admin_id INT NOT NULL COMMENT 'ID of admin/sub_admin who performed action',
    action ENUM('banned', 'unbanned', 'suspended', 'unsuspended', 'role_changed', 'location_assigned') NOT NULL,
    reason TEXT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- 5. Create sub_admin_assignments table for managing sub_admin assignments
CREATE TABLE IF NOT EXISTS sub_admin_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_admin_id INT NOT NULL,
    assigned_location VARCHAR(255) NOT NULL,
    province VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    sector VARCHAR(255) NOT NULL,
    management_level ENUM('province', 'district', 'sector') DEFAULT 'sector' COMMENT 'Level at which sub_admin manages farmers',
    assigned_by INT NOT NULL COMMENT 'ID of admin who assigned this location',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sub_admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sub_admin_id (sub_admin_id),
    INDEX idx_location (assigned_location),
    INDEX idx_is_active (is_active),
    INDEX idx_management_level (management_level)
);

-- 6. Create view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as total_super_admins,
    COUNT(CASE WHEN role = 'sub_admin' THEN 1 END) as total_sub_admins,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
    COUNT(CASE WHEN role = 'farmer' THEN 1 END) as total_farmers,
    COUNT(CASE WHEN role = 'cooperative' THEN 1 END) as total_cooperatives,
    COUNT(CASE WHEN role = 'buyer' THEN 1 END) as total_buyers,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_this_month
FROM users;

-- 7. Create view for sub_admin managed users
CREATE OR REPLACE VIEW sub_admin_managed_users AS
SELECT 
    u.*,
    saa.assigned_location,
    saa.created_at as assignment_date,
    CONCAT(m.full_name, ' (', m.email, ')') as managed_by_info
FROM users u
LEFT JOIN sub_admin_assignments saa ON u.location = saa.assigned_location AND saa.is_active = TRUE
LEFT JOIN users m ON saa.sub_admin_id = m.id
WHERE u.role IN ('farmer', 'cooperative');

-- 8. Insert sample sub_admin user (password: subadmin123)
INSERT IGNORE INTO users (full_name, email, password, phone, location, role, status) 
VALUES ('Sub Admin User', 'subadmin@farmerjoin.com', '$2b$10$rQZ8ZqGqQqQqQqQqQqQqQu', '+250 788 123 457', 'Kigali', 'sub_admin', 'active');

-- 9. Assign location to sample sub_admin (assuming super_admin exists with id 1)
INSERT IGNORE INTO sub_admin_assignments (sub_admin_id, assigned_location, assigned_by)
SELECT u.user_id, 'Kigali', 1
FROM users u 
WHERE u.email = 'subadmin@farmerjoin.com' AND u.role = 'sub_admin';

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Migration completed successfully!
-- Your database now supports:
-- - Super Admin, Sub Admin, Admin, Farmer, Cooperative, Buyer roles
-- - User banning/suspension with logging
-- - Location-based sub_admin assignments
-- - User management statistics
-- - Complete audit trail

-- Next steps:
-- 1. Update your backend API to use the new user management routes
-- 2. Test the UserManagement and SubAdminDashboard components
-- 3. Create sub_admin accounts through the UserManagement interface
-- 4. Assign locations to sub_admins for farmer management
