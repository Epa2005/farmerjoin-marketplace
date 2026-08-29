const db = require('./dbConnection');
const jwt = require('jsonwebtoken');

async function fixForeignKeyIssue() {
    try {
        console.log('🔍 Fixing foreign key constraint issue...');
        
        // Step 1: Check existing farmers
        console.log('\n📋 Checking existing farmers...');
        db.query('SELECT f.farmer_id, f.user_id, u.email FROM farmers f JOIN users u ON f.user_id = u.user_id ORDER BY f.farmer_id LIMIT 10', (err, results) => {
            if (err) {
                console.error('❌ Error fetching farmers:', err);
                return;
            }
            
            console.log('✅ Available farmers:');
            results.forEach((farmer, index) => {
                console.log(`  ${index + 1}. Farmer ID: ${farmer.farmer_id}, User ID: ${farmer.user_id}, Email: ${farmer.email}`);
            });
            
            // Step 2: Find a valid farmer to use
            const validFarmer = results.find(f => f.farmer_id && f.user_id);
            
            if (validFarmer) {
                console.log(`\n✅ Using valid farmer: ID ${validFarmer.farmer_id}, User ID ${validFarmer.user_id}`);
                
                // Step 3: Create working JWT token
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
                
                // Step 4: Test adding product with valid farmer
                console.log('\n📦 Testing add product with valid farmer...');
                
                const testProduct = {
                    product_name: 'fresh maize',
                    category: 'Grains',
                    price: '500',
                    quantity: '34000'
                };
                
                db.query(`
                    INSERT INTO products (product_name, category, price, quantity, farmer_id, image, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                `, [
                    testProduct.product_name,
                    testProduct.category,
                    parseFloat(testProduct.price),
                    parseInt(testProduct.quantity),
                    validFarmer.farmer_id,
                    'test-image.jpg'
                ], (err, result) => {
                    if (err) {
                        console.error('❌ Failed to add product:', err);
                        console.error('SQL Error:', err.sqlMessage);
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
                    }
                });
                
            } else {
                console.log('\n❌ No valid farmers found in database');
                console.log('Please ensure there are farmers in the farmers table');
            }
        });
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
    }
}

fixForeignKeyIssue();
