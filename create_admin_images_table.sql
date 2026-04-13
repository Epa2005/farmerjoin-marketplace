-- Create table for admin uploaded images
CREATE TABLE IF NOT EXISTS admin_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    category VARCHAR(50) DEFAULT 'dashboard',
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_uploaded_by (uploaded_by)
);
