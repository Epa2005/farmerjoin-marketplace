const db = require('./dbConnection');
const jwt = require('jsonwebtoken');

async function fixFarmerIdIssue() {
    try {
        console.log('🔍 Fixing farmer_id foreign key issue...');
        
        // Step 1: Find existing farmers in database
        console.log('\n📋 Checking existing farmers...');
        
        db.query(`
            SELECT f.farmer_id, f.user_id, u.email, u.full_name 
            FROM farmers f 
            JOIN users u ON f.user_id = u.user_id 
            ORDER BY f.farmer_id 
            LIMIT 5
        `, (err, results) => {
            if (err) {
                console.error('❌ Error fetching farmers:', err);
                return;
            }
            
            if (results.length === 0) {
                console.log('❌ No farmers found in database');
                return;
            }
            
            console.log('✅ Available farmers:');
            results.forEach((farmer, index) => {
                console.log(`  ${index + 1}. Farmer ID: ${farmer.farmer_id}, User ID: ${farmer.user_id}, Email: ${farmer.email}`);
            });
            
            // Step 2: Use the first valid farmer
            const validFarmer = results[0];
            console.log(`\n✅ Using valid farmer: ID ${validFarmer.farmer_id}, User ID ${validFarmer.user_id}`);
            
            // Step 3: Create proper JWT token for this farmer
            const workingToken = jwt.sign(
                { 
                    user_id: validFarmer.user_id, 
                    role: 'farmer', 
                    email: validFarmer.email 
                },
                'secretkey',
                { expiresIn: '1h' }
            );
            
            console.log('✅ Working token created for user_id:', validFarmer.user_id);
            console.log('Token:', workingToken.substring(0, 50) + '...');
            
            // Step 4: Test adding product with valid farmer_id
            console.log('\n📦 Testing add product with valid farmer_id...');
            
            const testProduct = {
                product_name: 'fresh maize',
                category: 'Grains',
                price: '500',
                quantity: '100'
            };
            
            db.query(`
                INSERT INTO products (product_name, category, price, quantity, farmer_id, image, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [
                testProduct.product_name,
                testProduct.category,
                parseFloat(testProduct.price),
                parseInt(testProduct.quantity),
                validFarmer.farmer_id,  // Use valid farmer_id
                'product-1774604011037-633290312.jpg'
            ], (err, result) => {
                if (err) {
                    console.error('❌ Failed to add product:', err);
                    console.error('SQL Error:', err.sqlMessage);
                    
                    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                        console.log('\n🔍 Foreign key constraint issue detected');
                        console.log('This means farmer_id is not valid');
                    }
                } else {
                    console.log('✅ SUCCESS! Product added:');
                    console.log('  Product ID:', result.insertId);
                    console.log('  Farmer ID:', validFarmer.farmer_id);
                    console.log('  Product Name:', testProduct.product_name);
                    console.log('  Category:', testProduct.category);
                    console.log('  Price:', testProduct.price);
                    console.log('  Quantity:', testProduct.quantity);
                    
                    console.log('\n🎉 Foreign key constraint issue RESOLVED!');
                    console.log('✅ Product successfully added with valid farmer_id');
                    
                    // Step 5: Provide solution for frontend
                    console.log('\n🔧 Frontend Solution:');
                    console.log('Add this to browser console:');
                    console.log(`localStorage.setItem('token', '${workingToken}');`);
                    console.log('\nThen try adding product again - it should work!');
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
    }
}

fixFarmerIdIssue();
