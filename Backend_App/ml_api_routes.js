const express = require('express');
const router = express.Router();
const mlService = require('./ml_service');
const db = require('./dbConnection');

// Middleware to verify user token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// Get user features from database
async function getUserFeatures(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT u.*, b.company_name, b.location as buyer_location, f.farm_type, f.location as farm_location
            FROM users u
            LEFT JOIN buyers b ON u.user_id = b.user_id
            LEFT JOIN farmers f ON u.user_id = f.user_id
            WHERE u.user_id = ?
        `;
        
        db.query(query, [userId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (results.length === 0) {
                resolve(null);
                return;
            }
            
            const user = results[0];
            
            // Get user's order history
            const orderQuery = `
                SELECT COUNT(*) as total_orders, 
                       SUM(oi.quantity) as total_quantity,
                       AVG(oi.price) as avg_price,
                       MAX(o.order_date) as last_order_date
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                WHERE o.buyer_id = ?
            `;
            
            db.query(orderQuery, [userId], (err, orderResults) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const orderData = orderResults[0] || {};
                
                // Create feature vector
                const features = [
                    orderData.avg_price || 0,
                    orderData.total_quantity || 0,
                    user.company_name ? user.company_name.length : 0,
                    hash(user.role) % 1000,
                    hash(user.buyer_location || user.farm_location || '') % 1000,
                    hash(user.farm_type || '') % 1000,
                    new Date().getMonth() + 1,
                    new Date().getDay(),
                    new Date().getHours()
                ];
                
                resolve(features);
            });
        });
    });
}

// Helper function to hash strings
function hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// GET /api/ml/recommendations - Get product recommendations for user
router.get('/recommendations', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const topN = parseInt(req.query.top_n) || 5;
        
        // Get user features from database
        const userFeatures = await getUserFeatures(userId);
        if (!userFeatures) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get recommendations from ML model
        const recommendations = await mlService.getRecommendations(userFeatures, topN);
        
        res.json({
            success: true,
            recommendations: recommendations,
            user_id: userId
        });
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get recommendations',
            error: error.message 
        });
    }
});

// POST /api/ml/predict-price - Predict price for a product
router.post('/predict-price', verifyToken, async (req, res) => {
    try {
        const { product_name, category, quantity, location, farm_type } = req.body;
        
        // Create feature vector for prediction
        const features = [
            0, // price (will be predicted)
            quantity || 0,
            product_name ? product_name.length : 0,
            hash(category || '') % 1000,
            hash(location || '') % 1000,
            hash(farm_type || '') % 1000,
            new Date().getMonth() + 1,
            new Date().getDay(),
            new Date().getHours()
        ];
        
        // Get price prediction from ML model
        const predictedPrice = await mlService.predictPrice(features);
        
        res.json({
            success: true,
            predicted_price: predictedPrice,
            product_name: product_name,
            features: features
        });
        
    } catch (error) {
        console.error('Error predicting price:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to predict price',
            error: error.message 
        });
    }
});

// POST /api/ml/learn - Learn from user question
router.post('/learn', verifyToken, async (req, res) => {
    try {
        const { question, context } = req.body;
        const userId = req.user.userId;
        
        if (!question) {
            return res.status(400).json({ 
                success: false, 
                message: 'Question is required' 
            });
        }
        
        // Learn from user question
        const learningData = await mlService.learnFromQuestion(question, context || `user_${userId}`);
        
        // Store learning data in database (optional)
        const insertQuery = `
            INSERT INTO user_learning_data (user_id, question, context, learning_data, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        db.query(insertQuery, [userId, question, context, JSON.stringify(learningData)], (err) => {
            if (err) {
                console.error('Error storing learning data:', err);
            }
        });
        
        res.json({
            success: true,
            message: 'Learning data processed successfully',
            learning_data: learningData
        });
        
    } catch (error) {
        console.error('Error learning from question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process learning data',
            error: error.message 
        });
    }
});

// GET /api/ml/market-insights/:product - Get market insights for a product
router.get('/market-insights/:product', verifyToken, async (req, res) => {
    try {
        const productName = req.params.product;
        
        // Get market insights from ML model
        const insights = await mlService.getMarketInsights(productName);
        
        res.json({
            success: true,
            product: productName,
            insights: insights
        });
        
    } catch (error) {
        console.error('Error getting market insights:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get market insights',
            error: error.message 
        });
    }
});

// GET /api/ml/user-analytics - Get user analytics and preferences
router.get('/user-analytics', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user's learning history
        const query = `
            SELECT question, context, learning_data, created_at
            FROM user_learning_data
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        `;
        
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error getting user analytics:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to get user analytics' 
                });
            }
            
            res.json({
                success: true,
                user_id: userId,
                learning_history: results,
                total_questions: results.length
            });
        });
        
    } catch (error) {
        console.error('Error getting user analytics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user analytics',
            error: error.message 
        });
    }
});

module.exports = router;
