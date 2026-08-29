-- Migration: add sub_admin role, user status fields, sub_admin_assignments, and logs
-- Run this against your database (make a backup first)

START TRANSACTION;

-- 1) Update `users` table: add new roles and management columns
ALTER TABLE `users`
  MODIFY `role` ENUM('farmer','buyer','admin','sub_admin','super_admin') NOT NULL DEFAULT 'farmer',
  ADD COLUMN `status` ENUM('active','banned','suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN `location` VARCHAR(150) DEFAULT NULL,
  ADD COLUMN `banned_by` INT DEFAULT NULL,
  ADD COLUMN `banned_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `ban_reason` TEXT DEFAULT NULL,
  ADD COLUMN `suspended_by` INT DEFAULT NULL,
  ADD COLUMN `suspended_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `suspension_reason` TEXT DEFAULT NULL;

-- 2) Table to assign sub_admins to locations
CREATE TABLE IF NOT EXISTS `sub_admin_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_admin_id` int(11) NOT NULL,
  `assigned_location` varchar(150) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sub_admin` (`sub_admin_id`),
  KEY `idx_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_subadmin_user` FOREIGN KEY (`sub_admin_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subadmin_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3) Logs for admin actions (ban/suspend/create sub-admin etc.)
CREATE TABLE IF NOT EXISTS `user_management_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `reason` text DEFAULT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_admin` (`admin_id`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

-- Notes:
-- - If your MySQL version does not allow direct enum modification, recreate the column safely.
-- - Adjust privileges and foreign key constraints as needed for your environment.
-- Migration: add sub_admin role, user status fields, sub_admin_assignments, and logs
-- Run this against your database (make a backup first)

START TRANSACTION;

-- 1) Update `users` table: add new roles and management columns
ALTER TABLE `users`
  MODIFY `role` ENUM('farmer','buyer','admin','sub_admin','super_admin') NOT NULL DEFAULT 'farmer',
  ADD COLUMN `status` ENUM('active','banned','suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN `location` VARCHAR(150) DEFAULT NULL,
  ADD COLUMN `banned_by` INT DEFAULT NULL,
  ADD COLUMN `banned_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `ban_reason` TEXT DEFAULT NULL,
  ADD COLUMN `suspended_by` INT DEFAULT NULL,
  ADD COLUMN `suspended_at` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `suspension_reason` TEXT DEFAULT NULL;

-- 2) Table to assign sub_admins to locations
CREATE TABLE IF NOT EXISTS `sub_admin_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sub_admin_id` int(11) NOT NULL,
  `assigned_location` varchar(150) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sub_admin` (`sub_admin_id`),
  KEY `idx_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_subadmin_user` FOREIGN KEY (`sub_admin_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subadmin_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3) Logs for admin actions (ban/suspend/create sub-admin etc.)
CREATE TABLE IF NOT EXISTS `user_management_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `reason` text DEFAULT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_admin` (`admin_id`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

-- Notes:
-- - If your MySQL version does not allow direct enum modification, recreate the column safely.
-- - Adjust privileges and foreign key constraints as needed for your environment.
