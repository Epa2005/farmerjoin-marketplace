// Add this to the main server to debug the JWT issue
const express = require('express');
const jwt = require('jsonwebtoken');

// Add a test endpoint to the main server
app.post('/debug-jwt-endpoint', (req, res) => {
    console.log('🔍 Debug JWT endpoint called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        console.log('JWT Secret being used:', process.env.JWT_SECRET || 'secretkey');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        console.log('Token decoded successfully:', decoded);
        res.json({ 
            message: 'Token is valid in main server', 
            decoded: decoded
        });
    } catch (error) {
        console.error('JWT verification failed in main server:', error);
        res.status(401).json({ 
            message: 'Invalid token in main server', 
            error: error.message
        });
    }
});

console.log('Debug JWT endpoint added to main server');
