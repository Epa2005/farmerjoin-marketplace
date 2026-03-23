// Enhanced ML API Routes with better question handling and results storage

const express = require('express');
const router = express.Router();
const mlService = require('./ml_service');
const db = require('./dbConnection');
const jwt = require('jsonwebtoken');

// Middleware to verify user token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    jwt.verify(token, 'secretkey', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// Enhanced learning table with response storage
const createEnhancedLearningTable = `
CREATE TABLE IF NOT EXISTS user_ml_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    ai_response TEXT,
    context VARCHAR(255),
    learning_data JSON,
    question_type VARCHAR(100),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_question_type (question_type)
);
`;

// Execute table creation
db.query(createEnhancedLearningTable, (err) => {
    if (err) {
        console.error('Error creating enhanced learning table:', err);
    } else {
        console.log('Enhanced ML interactions table created or already exists');
    }
});

// POST /api/ml/ask-question - Enhanced question handling
router.post('/ask-question', verifyToken, async (req, res) => {
    try {
        const { question, context } = req.body;
        const userId = req.user.userId;
        
        if (!question) {
            return res.status(400).json({ 
                success: false, 
                message: 'Question is required' 
            });
        }

        // Analyze question type
        const questionType = analyzeQuestionType(question);
        
        // Generate AI response
        const aiResponse = generateAIResponse(question, questionType);
        
        // Calculate confidence score
        const confidenceScore = calculateConfidenceScore(question, questionType);
        
        // Learn from user question
        const learningData = await mlService.askQuestion(question, context || `dashboard_user_${userId}`);
        
        // Store interaction in database
        const insertQuery = `
            INSERT INTO user_ml_interactions 
            (user_id, question, ai_response, context, learning_data, question_type, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [
            userId, 
            question, 
            aiResponse, 
            context || `dashboard_user_${userId}`, 
            JSON.stringify(learningData), 
            questionType, 
            confidenceScore
        ], (err, result) => {
            if (err) {
                console.error('Error storing ML interaction:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to store interaction' 
                });
            }
            
            res.json({
                success: true,
                message: 'Question processed successfully',
                data: {
                    id: result.insertId,
                    question: question,
                    response: aiResponse,
                    question_type: questionType,
                    confidence_score: confidenceScore,
                    learning_data: learningData,
                    timestamp: new Date()
                }
            });
        });
        
    } catch (error) {
        console.error('Error processing question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process question',
            error: error.message 
        });
    }
});

// GET /api/ml/question-history - Get user's question history with responses
router.get('/question-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 20, offset = 0, question_type } = req.query;
        
        let query = `
            SELECT id, question, ai_response, context, question_type, confidence_score, 
                   learning_data, created_at, updated_at
            FROM user_ml_interactions 
            WHERE user_id = ?
        `;
        const params = [userId];
        
        if (question_type) {
            query += ' AND question_type = ?';
            params.push(question_type);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        db.query(query, params, (err, results) => {
            if (err) {
                console.error('Error fetching question history:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch question history' 
                });
            }
            
            // Get total count for pagination
            const countQuery = 'SELECT COUNT(*) as total FROM user_ml_interactions WHERE user_id = ?';
            db.query(countQuery, [userId], (countErr, countResults) => {
                if (countErr) {
                    console.error('Error counting questions:', countErr);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to count questions' 
                    });
                }
                
                res.json({
                    success: true,
                    data: {
                        questions: results,
                        total: countResults[0].total,
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                });
            });
        });
        
    } catch (error) {
        console.error('Error getting question history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get question history',
            error: error.message 
        });
    }
});

// GET /api/ml/question-stats - Get user's question statistics
router.get('/question-stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const statsQuery = `
            SELECT 
                COUNT(*) as total_questions,
                COUNT(DISTINCT question_type) as unique_types,
                AVG(confidence_score) as avg_confidence,
                MAX(created_at) as last_question,
                question_type,
                COUNT(*) as type_count
            FROM user_ml_interactions 
            WHERE user_id = ?
            GROUP BY question_type
        `;
        
        db.query(statsQuery, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching question stats:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch question statistics' 
                });
            }
            
            const totalQuestions = results.reduce((sum, row) => sum + row.type_count, 0);
            const avgConfidence = results.reduce((sum, row) => sum + (row.avg_confidence || 0), 0) / results.length;
            const lastQuestion = results.reduce((latest, row) => 
                new Date(row.last_question) > new Date(latest) ? row.last_question : latest, 
                results[0]?.last_question || null
            );
            
            res.json({
                success: true,
                data: {
                    total_questions: totalQuestions,
                    unique_types: results.length,
                    avg_confidence: avgConfidence || 0,
                    last_question: lastQuestion,
                    question_breakdown: results.map(row => ({
                        type: row.question_type,
                        count: row.type_count,
                        confidence: row.avg_confidence || 0
                    }))
                }
            });
        });
        
    } catch (error) {
        console.error('Error getting question stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get question statistics',
            error: error.message 
        });
    }
});

// Helper functions
function analyzeQuestionType(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('price') || lowerQuestion.includes('cost') || lowerQuestion.includes('expensive')) {
        return 'price_inquiry';
    } else if (lowerQuestion.includes('quality') || lowerQuestion.includes('good') || lowerQuestion.includes('best')) {
        return 'quality_inquiry';
    } else if (lowerQuestion.includes('organic')) {
        return 'organic_inquiry';
    } else if (lowerQuestion.includes('bulk') || lowerQuestion.includes('quantity') || lowerQuestion.includes('large')) {
        return 'bulk_inquiry';
    } else if (lowerQuestion.includes('delivery') || lowerQuestion.includes('shipping') || lowerQuestion.includes('fast')) {
        return 'delivery_inquiry';
    } else if (lowerQuestion.includes('recommend') || lowerQuestion.includes('suggest')) {
        return 'recommendation_request';
    } else if (lowerQuestion.includes('market') || lowerQuestion.includes('trend')) {
        return 'market_inquiry';
    } else if (lowerQuestion.includes('supplier') || lowerQuestion.includes('farmer') || lowerQuestion.includes('seller')) {
        return 'supplier_inquiry';
    } else if (lowerQuestion.includes('payment') || lowerQuestion.includes('pay')) {
        return 'payment_inquiry';
    } else {
        return 'general_inquiry';
    }
}

function generateAIResponse(question, questionType) {
    const responses = {
        price_inquiry: "Based on current market analysis, I can help you get accurate pricing. Use the Price Predictor tool for specific quotes based on your quantity and location requirements.",
        quality_inquiry: "I've noted your preference for high-quality products! I'll prioritize premium suppliers and organic options in my recommendations.",
        organic_inquiry: "Great choice! I've recorded your preference for organic products. I'll highlight organic suppliers and sustainable farming options.",
        bulk_inquiry: "For bulk orders, I can help you find the best deals! Bulk purchases typically come with 10-20% discounts. Let me know your required quantity.",
        delivery_inquiry: "Delivery options vary by location. I can help you find suppliers with express delivery. Standard is 3-5 days, express available within 24-48 hours.",
        recommendation_request: "Based on your preferences and browsing history, I recommend checking the AI Recommendations panel for personalized suggestions.",
        market_inquiry: "Current market trends show stable prices with seasonal variations. Check the Market Insights section for detailed analysis.",
        supplier_inquiry: "I can help you find reliable suppliers! I consider ratings, delivery times, quality, and pricing in my recommendations.",
        payment_inquiry: "Multiple payment options are available including cash on delivery, bank transfers, mobile money, and secure online payments.",
        general_inquiry: "I'm here to help! I can assist with product recommendations, price predictions, and market insights. What specific information do you need?"
    };
    
    return responses[questionType] || responses.general_inquiry;
}

function calculateConfidenceScore(question, questionType) {
    let score = 0.5; // Base confidence
    
    // Increase confidence for specific questions
    if (question.length > 20) score += 0.1;
    if (question.includes('?')) score += 0.1;
    if (questionType !== 'general_inquiry') score += 0.2;
    
    // Check for specific keywords
    const specificKeywords = ['price', 'quality', 'organic', 'delivery', 'bulk', 'recommend'];
    const keywordCount = specificKeywords.filter(keyword => 
        question.toLowerCase().includes(keyword)
    ).length;
    score += Math.min(keywordCount * 0.05, 0.2);
    
    return Math.min(score, 1.0);
}

module.exports = router;
