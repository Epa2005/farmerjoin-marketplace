-- User Management System SQL Queries
-- Created for FarmerJoin Marketplace

-- 1. Add new columns to users table for user management
ALTER TABLE users 
ADD COLUMN status ENUM('active', 'banned', 'suspended') DEFAULT 'active',
ADD COLUMN banned_by VARCHAR(255) NULL,
ADD COLUMN banned_at TIMESTAMP NULL,
ADD COLUMN suspended_by VARCHAR(255) NULL,
ADD COLUMN suspended_at TIMESTAMP NULL,
ADD COLUMN suspension_reason TEXT NULL,
ADD COLUMN ban_reason TEXT NULL,
ADD COLUMN managed_by VARCHAR(255) NULL COMMENT 'ID of sub_admin who manages this user',
ADD COLUMN assigned_location VARCHAR(255) NULL COMMENT 'Location assigned to sub_admin';

-- 2. Update users table to include sub_admin and super_admin roles
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'sub_admin', 'admin', 'farmer', 'cooperative', 'buyer') NOT NULL;

-- 3. Update current admin users to super_admin role
UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- 3. Create user_management_logs table for tracking user actions
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

-- 4. Create sub_admin_assignments table for managing sub_admin assignments
CREATE TABLE IF NOT EXISTS sub_admin_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_admin_id INT NOT NULL,
    assigned_location VARCHAR(255) NOT NULL,
    assigned_by INT NOT NULL COMMENT 'ID of admin who assigned this location',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sub_admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sub_admin_id (sub_admin_id),
    INDEX idx_location (assigned_location),
    INDEX idx_is_active (is_active)
);

-- 5. Insert sample sub_admin user (password: subadmin123)
INSERT INTO users (full_name, email, password, phone, location, role, status) 
VALUES ('Sub Admin User', 'subadmin@farmerjoin.com', '$2b$10$rQZ8ZqGqQqQqQqQqQqQqQu', '+250 788 123 457', 'Kigali', 'sub_admin', 'active');

-- 6. Create view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
    COUNT(CASE WHEN role = 'sub_admin' THEN 1 END) as total_sub_admins,
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

-- 8. Sample queries for user management operations

-- Ban a user
-- UPDATE users SET status = 'banned', banned_by = 'admin_id', banned_at = NOW(), ban_reason = 'Violation of terms' WHERE id = user_id;

-- Suspend a user
-- UPDATE users SET status = 'suspended', suspended_by = 'admin_id', suspended_at = NOW(), suspension_reason = 'Account review' WHERE id = user_id;

-- Unban a user
-- UPDATE users SET status = 'active', banned_by = NULL, banned_at = NULL, ban_reason = NULL WHERE id = user_id;

-- Unsuspend a user
-- UPDATE users SET status = 'active', suspended_by = NULL, suspended_at = NULL, suspension_reason = NULL WHERE id = user_id;

-- Assign location to sub_admin
-- INSERT INTO sub_admin_assignments (sub_admin_id, assigned_location, assigned_by) VALUES (sub_admin_id, 'Kigali', admin_id);

-- Get users managed by a specific sub_admin
-- SELECT u.* FROM users u 
-- JOIN sub_admin_assignments saa ON u.location = saa.assigned_location AND saa.is_active = TRUE 
-- WHERE saa.sub_admin_id = sub_admin_id AND u.role IN ('farmer', 'cooperative');

-- Log user management action
-- INSERT INTO user_management_logs (user_id, admin_id, action, reason, previous_status, new_status) 
-- VALUES (user_id, admin_id, 'banned', 'Violation of terms', 'active', 'banned');
