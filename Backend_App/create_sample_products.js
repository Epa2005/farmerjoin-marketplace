const db = require('./dbConnection');

async function createSampleProducts() {
    try {
        console.log('🌱 Creating sample products for different farmers...');
        
        // Sample products for different farmers
        const sampleProducts = [
            // Farmer ID 43 (kevin)
            [43, 'Fresh Tomatoes', 'Vegetables', '3.50', 50, 'Organic tomatoes grown with care', 'uploads/products/tomatoes.jpg'],
            [43, 'Green Peppers', 'Vegetables', '2.75', 30, 'Crisp green peppers', 'uploads/products/peppers.jpg'],
            
            // Farmer ID 42 (mushuti)  
            [42, 'Fresh Carrots', 'Vegetables', '1.50', 100, 'Sweet and crunchy carrots', 'uploads/products/carrots.jpg'],
            [42, 'Lettuce', 'Vegetables', '2.00', 25, 'Fresh garden lettuce', 'uploads/products/lettuce.jpg'],
            
            // Farmer ID 41 (epa23)
            [41, 'Red Onions', 'Vegetables', '1.25', 80, 'Pungent red onions', 'uploads/products/onions.jpg'],
            [41, 'Cucumbers', 'Vegetables', '1.75', 40, 'Fresh cucumbers', 'uploads/products/cucumbers.jpg'],
            
            // Farmer ID 16 (existing farmer with products)
            [16, 'Sweet Corn', 'Grains', '0.75', 200, 'Fresh sweet corn', 'uploads/products/corn.jpg'],
        ];
        
        // Insert products one by one
        for (const [farmerId, name, category, price, quantity, description, image] of sampleProducts) {
            const insertQuery = `
                INSERT INTO products (farmer_id, product_name, category, price, quantity, description, image, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            db.query(insertQuery, [farmerId, name, category, price, quantity, description, image], (err, result) => {
                if (err) {
                    console.error(`❌ Error inserting ${name}:`, err);
                } else {
                    console.log(`✅ Added ${name} for Farmer ID ${farmerId}`);
                }
            });
        }
        
        // Wait a moment then show results
        setTimeout(() => {
            console.log('\n📊 Checking product distribution...');
            
            const checkQuery = `
                SELECT f.user_id, f.full_name, COUNT(p.product_id) as product_count
                FROM farmers f
                LEFT JOIN products p ON f.user_id = p.farmer_id
                GROUP BY f.user_id, f.full_name
                ORDER BY product_count DESC
                LIMIT 10
            `;
            
            db.query(checkQuery, (err, results) => {
                if (err) {
                    console.error('❌ Error checking results:', err);
                } else {
                    console.log('\n👨‍🌾 Farmers and their products:');
                    results.forEach(row => {
                        console.log(`  ${row.full_name}: ${row.product_count} products`);
                    });
                }
                process.exit(0);
            });
        }, 2000);
        
    } catch (error) {
        console.error('❌ Creation failed:', error);
        process.exit(0);
    }
}

createSampleProducts();
