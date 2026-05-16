-- Add missing columns to order_items table
USE project6;

ALTER TABLE order_items ADD COLUMN farmer_id INT DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE order_items ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add index for better query performance
ALTER TABLE order_items ADD INDEX idx_farmer_id (farmer_id);

-- Verify the changes
DESCRIBE order_items;
