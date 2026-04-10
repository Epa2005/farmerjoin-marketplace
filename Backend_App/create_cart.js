const db = require('./dbConnection');

const createCartTable = `
CREATE TABLE IF NOT EXISTS cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_buyer_product (buyer_id, product_id),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_product_id (product_id)
)
`;

db.query(createCartTable, (err, result) => {
    if (err) {
        console.error('❌ Error creating cart table:', err);
    } else {
        console.log('✅ Cart table created successfully!');
        
        // Show table structure
        db.query('DESCRIBE cart', (err, results) => {
            if (err) {
                console.error('❌ Error describing table:', err);
            } else {
                console.log('📋 Cart table structure:');
                console.table(results);
            }
            process.exit(0);
        });
    }
});
