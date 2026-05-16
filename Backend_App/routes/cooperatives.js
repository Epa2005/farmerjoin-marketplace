const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    
    try {
        // Verify JWT token
        const decoded = jwt.verify(token, 'secretkey');
        
        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        // Add user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cooperative-' + uniqueSuffix + '.jpg');
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Admin create cooperative endpoint
router.post('/admin/create-cooperative', isAdmin, (req, res) => {
    const { full_name, email, phone, cooperative_name, location } = req.body;
    
    // Generate a simple password
    const password = Math.random().toString(36).slice(-8);
    
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Password hashing error:', err);
            return res.status(500).json({ message: 'Password hashing failed' });
        }
        
        // Start transaction
        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            // Insert into users table
            const userQuery = `
                INSERT INTO users (full_name, email, phone, password, role, created_at)
                VALUES (?, ?, ?, ?, 'cooperative', NOW())
            `;
            
            db.query(userQuery, [full_name, email, phone, hashedPassword], (err, userResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error creating user:', err);
                        res.status(500).json({ message: 'Failed to create user account' });
                    });
                }
                
                const userId = userResult.insertId;
                
                // Insert into cooperatives table
                const cooperativeQuery = `
                    INSERT INTO cooperatives (user_id, cooperative_name, location, phone, description)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.query(cooperativeQuery, [userId, cooperative_name, location, phone, 'Cooperative description'], (err, cooperativeResult) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error creating cooperative:', err);
                            res.status(500).json({ message: 'Failed to create cooperative profile' });
                        });
                    }
                    
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', commitErr);
                                res.status(500).json({ message: 'Failed to complete cooperative creation' });
                            });
                        }
                        
                        res.json({ 
                            message: 'Cooperative account created successfully',
                            password: password,
                            userId: userId,
                            cooperativeId: cooperativeResult.insertId
                        });
                    });
                });
            });
        });
    });
});

// Middleware to check if user is admin
const isCooperative = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    
    try {
        const decoded = jwt.verify(token, 'secretkey');
        
        if (decoded.role !== 'cooperative') {
            return res.status(403).json({ message: 'Cooperative access required' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get cooperative profile
router.get('/profile', isCooperative, (req, res) => {
    const query = `
        SELECT c.*, u.full_name, u.email, u.photo as user_photo
        FROM cooperatives c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.user_id = ${req.user.user_id}
    `;
    
    db.query(query, [req.user.user_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch cooperative data' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Cooperative not found' });
        }
        
        const cooperative = results[0];
        cooperative.profile_photo = cooperative.profile_photo || cooperative.user_photo;
        
        res.json(cooperative);
    });
});

// Update cooperative profile
router.put('/profile', isCooperative, upload.single('profile_photo'), (req, res) => {
    try {
        const { cooperative_name, description, location, phone } = req.body;
        
        let updateFields = [];
        let values = [];
        
        if (cooperative_name) {
            updateFields.push('cooperative_name = ?');
            values.push(cooperative_name);
        }
        if (description) {
            updateFields.push('description = ?');
            values.push(description);
        }
        if (location) {
            updateFields.push('location = ?');
            values.push(location);
        }
        if (phone) {
            updateFields.push('phone = ?');
            values.push(phone);
        }
        
        // Handle profile photo update
        if (req.file) {
            updateFields.push('profile_photo = ?');
            values.push(`/uploads/profiles/${req.file.filename}`);
        }
        
        if (updateFields.length > 0) {
            values.push(req.user.user_id);
            const query = `UPDATE cooperatives SET ${updateFields.join(', ')} WHERE user_id = ?`;
            
            db.query(query, values, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to update cooperative profile' });
                }
                
                res.json({ message: 'Profile updated successfully' });
            });
        } else {
            res.json({ message: 'No changes to update' });
        }
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all cooperatives (admin only)
router.get('/admin/cooperatives', isAdmin, (req, res) => {
    const query = `
        SELECT c.*, u.full_name, u.email, u.phone as user_phone, u.created_at as user_created_at
        FROM cooperatives c
        JOIN users u ON c.user_id = u.user_id
        WHERE u.role = 'cooperative'
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch cooperatives' });
        }
        res.json(results);
    });
});

// Get cooperative's products
router.get('/products', isCooperative, (req, res) => {
    const query = `
        SELECT p.* 
        FROM products p
        JOIN cooperatives c ON p.cooperative_id = c.cooperative_id
        WHERE c.user_id = ?
        ORDER BY p.created_at DESC
    `;
    
    db.query(query, [req.user.user_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch cooperative products' });
        }
        res.json(results);
    });
});

// Update cooperative (admin only)
router.put('/admin/:cooperativeId', isAdmin, (req, res) => {
    const { cooperativeId } = req.params;
    const { full_name, email, phone, cooperative_name, description, location } = req.body;
    
    // Start transaction for safe update
    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        // Get cooperative's user_id
        db.query('SELECT user_id FROM cooperatives WHERE cooperative_id = ?', [cooperativeId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error fetching cooperative:', err);
                    res.status(500).json({ message: 'Failed to fetch cooperative' });
                });
            }
            
            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ message: 'Cooperative not found' });
                });
            }
            
            const userId = results[0].user_id;
            
            // Update users table
            const userUpdateQuery = `
                UPDATE users 
                SET full_name = ?, email = ?, phone = ?
                WHERE user_id = ?
            `;
            
            db.query(userUpdateQuery, [full_name, email, phone, userId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error updating user:', err);
                        res.status(500).json({ message: 'Failed to update user info' });
                    });
                }
                
                // Update cooperatives table
                const cooperativeUpdateQuery = `
                    UPDATE cooperatives 
                    SET cooperative_name = ?, description = ?, location = ?, phone = ?
                    WHERE cooperative_id = ?
                `;
                
                db.query(cooperativeUpdateQuery, [cooperative_name, description, location, phone, cooperativeId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error updating cooperative:', err);
                            res.status(500).json({ message: 'Failed to update cooperative profile' });
                        });
                    }
                    
                    // Commit transaction
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', commitErr);
                                res.status(500).json({ message: 'Failed to complete update' });
                            });
                        }
                        
                        res.json({ message: 'Cooperative account updated successfully' });
                    });
                });
            });
        });
    });
});

// Delete cooperative (admin only)
router.delete('/:cooperativeId', isAdmin, (req, res) => {
    const { cooperativeId } = req.params;
    
    // Start transaction for safe deletion
    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        // First get the user_id from cooperatives table
        db.query('SELECT user_id FROM cooperatives WHERE cooperative_id = ?', [cooperativeId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error fetching cooperative:', err);
                    res.status(500).json({ message: 'Failed to fetch cooperative' });
                });
            }
            
            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ message: 'Cooperative not found' });
                });
            }
            
            const userId = results[0].user_id;
            
            // Delete from cooperatives table
            db.query('DELETE FROM cooperatives WHERE cooperative_id = ?', [cooperativeId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error deleting cooperative:', err);
                        res.status(500).json({ message: 'Failed to delete cooperative' });
                    });
                }
                
                // Delete from users table
                db.query('DELETE FROM users WHERE user_id = ?', [userId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error deleting user:', err);
                            res.status(500).json({ message: 'Failed to delete user account' });
                        });
                    }
                    
                    // Commit transaction
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', commitErr);
                                res.status(500).json({ message: 'Failed to complete deletion' });
                            });
                        }
                        
                        res.json({ message: 'Cooperative account deleted successfully' });
                    });
                });
            });
        });
    });
});

module.exports = router;
