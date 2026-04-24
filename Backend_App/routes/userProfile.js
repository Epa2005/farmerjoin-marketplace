const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const db = require('../dbConnection');

// Configure multer for profile photo uploads
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const fs = require('fs');
        const uploadDir = 'uploads/profiles';
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const imageFileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

const profileUpload = multer({ 
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: imageFileFilter
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        
        // Check user status in database
        db.query("SELECT user_id, role, status FROM users WHERE user_id = ?", [decoded.user_id], (err, result) => {
            if (err) {
                console.error('Database error checking user status:', err);
                return res.status(500).json({ message: "Authentication error" });
            }

            if (result.length === 0) {
                return res.status(401).json({ message: "User not found" });
            }

            const user = result[0];
            const userStatus = user.status ? user.status.toLowerCase() : 'inactive';
            if (userStatus !== 'active') {
                return res.status(403).json({ message: "Account is inactive" });
            }

            req.user = decoded;
            req.user.status = user.status;
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
    
    const query = `
        SELECT 
            user_id,
            full_name,
            email,
            phone,
            role,
            photo,
            status,
            created_at
        FROM users 
        WHERE user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch profile' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = results[0];
        // Add full image path if photo exists
        if (user.photo) {
            user.photo = user.photo.startsWith('http') ? user.photo : `http://localhost:5000/${user.photo}`;
        }
        
        res.json(user);
    });
});

// Update user profile with optional photo upload
router.put('/profile', authenticateToken, profileUpload.single('photo'), (req, res) => {
    const userId = req.user.user_id;
    const { full_name, phone, email } = req.body;
    
    // Build update query dynamically
    let updates = [];
    let values = [];
    
    if (full_name) {
        updates.push('full_name = ?');
        values.push(full_name);
    }
    
    if (phone) {
        updates.push('phone = ?');
        values.push(phone);
    }
    
    if (email) {
        updates.push('email = ?');
        values.push(email);
    }
    
    // Handle photo upload
    if (req.file) {
        updates.push('photo = ?');
        values.push(`uploads/profiles/${req.file.filename}`);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to update profile' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Fetch updated user data
        const selectQuery = `
            SELECT user_id, full_name, email, phone, role, photo, status 
            FROM users WHERE user_id = ?
        `;
        
        db.query(selectQuery, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Profile updated but failed to fetch updated data' });
            }
            
            const user = results[0];
            if (user.photo) {
                user.photo = user.photo.startsWith('http') ? user.photo : `http://localhost:5000/${user.photo}`;
            }
            
            res.json({
                message: 'Profile updated successfully',
                user: user
            });
        });
    });
});

// Update profile photo only
router.post('/profile/photo', authenticateToken, profileUpload.single('photo'), (req, res) => {
    const userId = req.user.user_id;
    
    if (!req.file) {
        return res.status(400).json({ message: 'No photo uploaded' });
    }
    
    const photoPath = `uploads/profiles/${req.file.filename}`;
    
    const query = 'UPDATE users SET photo = ? WHERE user_id = ?';
    
    db.query(query, [photoPath, userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to update profile photo' });
        }
        
        res.json({
            message: 'Profile photo updated successfully',
            photo: `http://localhost:5000/${photoPath}`
        });
    });
});

// Delete profile photo
router.delete('/profile/photo', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
    
    const query = 'UPDATE users SET photo = NULL WHERE user_id = ?';
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to remove profile photo' });
        }
        
        res.json({ message: 'Profile photo removed successfully' });
    });
});

module.exports = router;
