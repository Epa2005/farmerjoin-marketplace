const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Generate unique session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract title from first user message
function generateTitle(message) {
    if (!message) return 'New Conversation';
    // Take first 40 characters or first sentence
    const title = message.split(/[.!?\n]/)[0].substring(0, 40);
    return title.length < message.length ? title + '...' : title;
}

// Get or create conversation
async function getOrCreateConversation(sessionId, userId, userEmail, userRole, firstMessage) {
    return new Promise((resolve, reject) => {
        if (sessionId) {
            // Check if conversation exists
            db.query(
                'SELECT * FROM ai_conversations WHERE session_id = ? AND user_id = ?',
                [sessionId, userId],
                (err, results) => {
                    if (err) return reject(err);
                    
                    if (results.length > 0) {
                        // Update last activity
                        db.query(
                            'UPDATE ai_conversations SET updated_at = NOW() WHERE conversation_id = ?',
                            [results[0].conversation_id]
                        );
                        resolve(results[0]);
                    } else {
                        // Create new conversation
                        createConversation();
                    }
                }
            );
        } else {
            createConversation();
        }
        
        function createConversation() {
            const newSessionId = generateSessionId();
            const title = generateTitle(firstMessage);
            
            db.query(
                `INSERT INTO ai_conversations (session_id, user_id, user_email, user_role, title, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [newSessionId, userId, userEmail, userRole, title],
                (err, result) => {
                    if (err) return reject(err);
                    
                    resolve({
                        conversation_id: result.insertId,
                        session_id: newSessionId,
                        user_id: userId,
                        title: title
                    });
                }
            );
        }
    });
}

// Store message in database
async function storeMessage(conversationId, role, content, structuredData = null, isFallback = false, language = 'en') {
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO ai_messages (conversation_id, role, content, structured_data, is_fallback, language, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [conversationId, role, content, structuredData ? JSON.stringify(structuredData) : null, isFallback ? 1 : 0, language],
            (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            }
        );
    });
}

// Get all conversations for user
router.get('/conversations', auth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        db.query(
            `SELECT conversation_id, session_id, title, created_at, updated_at,
                    (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = ai_conversations.conversation_id) as message_count
             FROM ai_conversations 
             WHERE user_id = ? AND is_active = 1
             ORDER BY updated_at DESC
             LIMIT 50`,
            [userId],
            (err, results) => {
                if (err) {
                    console.error('Error fetching conversations:', err);
                    return res.status(500).json({ message: 'Failed to fetch conversations' });
                }
                res.json(results);
            }
        );
    } catch (e) {
        console.error('Error in /conversations:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get specific conversation with messages
router.get('/conversations/:sessionId', auth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.user_id;
        
        // Get conversation
        db.query(
            'SELECT * FROM ai_conversations WHERE session_id = ? AND user_id = ? AND is_active = 1',
            [sessionId, userId],
            (err, convResults) => {
                if (err) {
                    console.error('Error fetching conversation:', err);
                    return res.status(500).json({ message: 'Failed to fetch conversation' });
                }
                
                if (convResults.length === 0) {
                    return res.status(404).json({ message: 'Conversation not found' });
                }
                
                const conversation = convResults[0];
                
                // Get messages
                db.query(
                    `SELECT message_id, role, content, structured_data, is_fallback, language, created_at
                     FROM ai_messages 
                     WHERE conversation_id = ?
                     ORDER BY created_at ASC`,
                    [conversation.conversation_id],
                    (err, msgResults) => {
                        if (err) {
                            console.error('Error fetching messages:', err);
                            return res.status(500).json({ message: 'Failed to fetch messages' });
                        }
                        
                        res.json({
                            conversation: conversation,
                            messages: msgResults.map(m => ({
                                ...m,
                                structured_data: m.structured_data ? JSON.parse(m.structured_data) : null,
                                text: m.content,
                                timestamp: new Date(m.created_at).getTime()
                            }))
                        });
                    }
                );
            }
        );
    } catch (e) {
        console.error('Error in /conversations/:sessionId:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// Store conversation message (called from agriProxy)
router.post('/store-message', async (req, res) => {
    try {
        const { sessionId, userId, userEmail, userRole, role, content, structuredData, isFallback, language, firstMessage } = req.body;
        
        if (!sessionId || !role || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const conversation = await getOrCreateConversation(
            sessionId, 
            userId, 
            userEmail, 
            userRole, 
            firstMessage || (role === 'user' ? content : null)
        );
        
        const messageId = await storeMessage(
            conversation.conversation_id,
            role,
            content,
            structuredData,
            isFallback,
            language
        );
        
        res.json({
            success: true,
            messageId,
            conversationId: conversation.conversation_id,
            sessionId: conversation.session_id
        });
    } catch (e) {
        console.error('Error storing message:', e);
        res.status(500).json({ message: 'Failed to store message' });
    }
});

// Delete conversation
router.delete('/conversations/:sessionId', auth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.user_id;
        
        db.query(
            'UPDATE ai_conversations SET is_active = 0 WHERE session_id = ? AND user_id = ?',
            [sessionId, userId],
            (err, result) => {
                if (err) {
                    console.error('Error deleting conversation:', err);
                    return res.status(500).json({ message: 'Failed to delete conversation' });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Conversation not found' });
                }
                
                res.json({ message: 'Conversation deleted successfully' });
            }
        );
    } catch (e) {
        console.error('Error in DELETE /conversations:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get conversation history for context
async function getConversationHistory(sessionId, limit = 10) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT m.role, m.content, m.structured_data
             FROM ai_messages m
             JOIN ai_conversations c ON m.conversation_id = c.conversation_id
             WHERE c.session_id = ?
             ORDER BY m.created_at DESC
             LIMIT ?`,
            [sessionId, limit],
            (err, results) => {
                if (err) return reject(err);
                resolve(results.reverse().map(m => ({
                    role: m.role,
                    content: m.content,
                    structured: m.structured_data ? JSON.parse(m.structured_data) : null
                })));
            }
        );
    });
}

module.exports = {
    router,
    getOrCreateConversation,
    storeMessage,
    getConversationHistory,
    generateSessionId
};
