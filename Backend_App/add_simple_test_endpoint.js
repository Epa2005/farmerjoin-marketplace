// Add this simple test endpoint to the main server
app.post('/test-add-product', (req, res) => {
    console.log('🔍 Test add product endpoint called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        console.log('Attempting JWT verification...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        console.log('JWT verification successful:', decoded);
        
        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        const farmerId = decoded.user_id;
        console.log('Farmer ID:', farmerId);
        
        // Get product data from request body
        const { product_name, category, price, quantity, description } = req.body;
        console.log('Product data:', { product_name, category, price, quantity, description });
        
        // Simple database insert
        const query = `
            INSERT INTO products (product_name, category, price, quantity, farmer_id, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [
            product_name || 'Test Product',
            category || 'general',
            parseFloat(price) || 0,
            parseInt(quantity) || 1,
            farmerId,
            description || 'Test description'
        ];
        
        console.log('Executing database query...');
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to add product', error: err.message });
            }
            
            console.log('Product added successfully:', result.insertId);
            res.status(201).json({
                message: 'Product added successfully',
                product_id: result.insertId,
                product: {
                    product_id: result.insertId,
                    product_name,
                    category: category || 'general',
                    price: parseFloat(price) || 0,
                    quantity: parseInt(quantity) || 1,
                    farmer_id: farmerId,
                    description: description || 'Test description'
                }
            });
        });
        
    } catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
});

console.log('✅ Simple test add product endpoint added');
