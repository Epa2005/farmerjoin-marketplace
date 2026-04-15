-- Add missing payment_reference column to orders table
USE project6;

ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255) DEFAULT NULL;

-- Add payment_id column for mobile money payments
ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255) DEFAULT NULL;

-- Add payment_status column for tracking payment status
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';

-- Verify the changes
DESCRIBE orders;
