const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const db = require('./dbConnection');
const cors = require('cors');

const app = express();

// Configure CORS to allow requests from frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/products';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Add product endpoint (working version)
app.post('/farmer/products', upload.single('image'), (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        const farmerId = decoded.user_id;
        const { product_name, category, price, quantity, description } = req.body;
        
        // Get image from file upload
        const image = req.file ? req.file.filename : '';
        
        // Insert product
        const query = `
            INSERT INTO products (
                product_name, 
                category, 
                price, 
                quantity, 
                farmer_id, 
                image,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [
            product_name,
            category || 'general',
            parseFloat(price),
            parseInt(quantity) || 1,
            farmerId,
            image
        ];
        
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to add product' });
            }
            
            // Log product creation
            console.log(`Product added: ${product_name} by farmer ${farmerId}`);
            
            res.status(201).json({
                message: 'Product added successfully',
                product_id: result.insertId,
                product: {
                    product_id: result.insertId,
                    product_name,
                    category: category || 'general',
                    price: parseFloat(price),
                    quantity: parseInt(quantity) || 1,
                    farmer_id: farmerId,
                    image: image ? `uploads/products/${image}` : '',
                    created_at: new Date()
                }
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Add product server is running!' });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Add Product Server running on port ${PORT}`);
    console.log(`📊 Test endpoint: http://localhost:${PORT}/test`);
});
