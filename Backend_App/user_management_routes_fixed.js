const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('./dbConnection');

// Middleware to check if user is admin or sub_admin
const isAdminOrSubAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'student');
        if (decoded.role !== 'admin' && decoded.role !== 'sub_admin') {
            return res.status(403).json({ message: 'Access denied. Admin or Sub Admin required.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'student');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin required.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get user statistics
router.get('/statistics', isAdminOrSubAdmin, (req, res) => {
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        activeUsers: 'SELECT COUNT(*) as count FROM users WHERE status = "active"',
        bannedUsers: 'SELECT COUNT(*) as count FROM users WHERE status = "banned"',
        suspendedUsers: 'SELECT COUNT(*) as count FROM users WHERE status = "suspended"',
        totalFarmers: 'SELECT COUNT(*) as count FROM users WHERE role = "farmer"',
        activeFarmers: 'SELECT COUNT(*) as count FROM users WHERE role = "farmer" AND status = "active"'
    };
    
    const results = {};
    let completed = 0;
    
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`Error in ${key}:`, err);
                results[key] = 0;
            } else {
                results[key] = result[0].count;
            }
            
            completed++;
            if (completed === Object.keys(queries).length) {
                // Get sub_admin specific location if user is sub_admin
                if (req.user.role === 'sub_admin') {
                    db.query('SELECT assigned_location FROM sub_admin_assignments WHERE sub_admin_id = ? AND is_active = TRUE', [req.user.userId], (err, locationResult) => {
                        if (!err && locationResult.length > 0) {
                            results.myLocation = locationResult[0].assigned_location;
                        } else {
                            results.myLocation = 'Not assigned';
                        }
                        return res.json(results);
                    });
                } else {
                    return res.json(results);
                }
            }
        });
    });
});

// Get all users with enhanced filtering for sub_admin
router.get('/', isAdminOrSubAdmin, (req, res) => {
    let query = `
        SELECT u.* 
        FROM users u
    `;
    
    const params = [];
    
    // If user is sub_admin, only show users from their assigned location (province, district, sector)
    if (req.user.role === 'sub_admin') {
        query += ` WHERE u.province IN (
            SELECT province FROM sub_admin_assignments 
            WHERE sub_admin_id = ? AND is_active = TRUE
        ) AND u.district IN (
            SELECT district FROM sub_admin_assignments 
            WHERE sub_admin_id = ? AND is_active = TRUE
        ) AND u.sector IN (
            SELECT sector FROM sub_admin_assignments 
            WHERE sub_admin_id = ? AND is_active = TRUE
        )`;
        params.push(req.user.userId, req.user.userId, req.user.userId);
    }
    
    query += ` ORDER BY u.created_at DESC`;
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
        }
        return res.json(results);
    });
});

// Ban user
router.post('/:userId/ban', isAdmin, (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Update user status to banned
    db.query('UPDATE users SET status = "banned" WHERE user_id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to ban user', error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log the action
        const logQuery = `
            INSERT INTO user_management_logs (user_id, admin_id, action, reason, created_at)
            VALUES (?, ?, 'ban', ?, NOW())
        `;
        
        db.query(logQuery, [userId, req.user.userId, reason || 'No reason provided'], (err) => {
            if (err) {
                console.error('Failed to log action:', err);
            }
        });
        
        return res.json({ 
            message: 'User banned successfully',
            user: { userId, status: 'banned' }
        });
    });
});

// Unban user
router.post('/:userId/unban', isAdmin, (req, res) => {
    const { userId } = req.params;
    
    // Update user status to active
    db.query('UPDATE users SET status = "active" WHERE user_id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to unban user', error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log the action
        const logQuery = `
            INSERT INTO user_management_logs (user_id, admin_id, action, reason, created_at)
            VALUES (?, ?, 'unban', 'User unbanned by admin', NOW())
        `;
        
        db.query(logQuery, [userId, req.user.userId], (err) => {
            if (err) {
                console.error('Failed to log action:', err);
            }
        });
        
        return res.json({ 
            message: 'User unbanned successfully',
            user: { userId, status: 'active' }
        });
    });
});

// Suspend user
router.post('/:userId/suspend', isAdmin, (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Update user status to suspended
    db.query('UPDATE users SET status = "suspended" WHERE user_id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to suspend user', error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log the action
        const logQuery = `
            INSERT INTO user_management_logs (user_id, admin_id, action, reason, created_at)
            VALUES (?, ?, 'suspend', ?, NOW())
        `;
        
        db.query(logQuery, [userId, req.user.userId, reason || 'No reason provided'], (err) => {
            if (err) {
                console.error('Failed to log action:', err);
            }
        });
        
        return res.json({ 
            message: 'User suspended successfully',
            user: { userId, status: 'suspended' }
        });
    });
});

// Unsuspend user
router.post('/:userId/unsuspend', isAdmin, (req, res) => {
    const { userId } = req.params;
    
    // Update user status to active
    db.query('UPDATE users SET status = "active" WHERE user_id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to unsuspend user', error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log the action
        const logQuery = `
            INSERT INTO user_management_logs (user_id, admin_id, action, reason, created_at)
            VALUES (?, ?, 'unsuspend', 'User unsuspended by admin', NOW())
        `;
        
        db.query(logQuery, [userId, req.user.userId], (err) => {
            if (err) {
                console.error('Failed to log action:', err);
            }
        });
        
        return res.json({ 
            message: 'User unsuspended successfully',
            user: { userId, status: 'active' }
        });
    });
});

// Create sub_admin account (admin only)
router.post('/sub-admin/create', isAdmin, (req, res) => {
    console.log('=== SUB-ADMIN CREATION REQUEST ===');
    console.log('Request body:', req.body);
    
    const { full_name, email, phone, password, province, district, sector } = req.body;
    
    // Validate required fields
    if (!full_name || !email || !phone || !password || !province || !district || !sector) {
        console.log('Missing fields:', { full_name: !!full_name, email: !!email, phone: !!phone, password: !!password, province: !!province, district: !!district, sector: !!sector });
        return res.status(400).json({ message: 'All fields are required (province, district, sector)' });
    }
    
    // Create structured location string
    const structuredLocation = `${province},${district},${sector}`;
    
    // Check if email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        // Hash password
        const bcrypt = require('bcryptjs');
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ message: 'Error creating account' });
            }
            
            // Create sub_admin user with structured location
            const userQuery = `
                INSERT INTO users (full_name, email, phone, password, location, province, district, sector, role, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sub_admin', 'active')
            `;
            
            db.query(userQuery, [full_name, email, phone, hashedPassword, structuredLocation, province, district, sector], (err, userResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to create sub_admin', error: err.message });
                }
                
                const subAdminId = userResult.insertId;
                
                // Assign structured location to sub_admin
                const assignmentQuery = `
                    INSERT INTO sub_admin_assignments (sub_admin_id, assigned_location, province, district, sector, assigned_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                const assignedBy = req.user.userId;
                db.query(assignmentQuery, [subAdminId, structuredLocation, province, district, sector, assignedBy], (err, assignmentResult) => {
                    if (err) {
                        console.error('Failed to assign location:', err);
                        // Don't fail the entire operation if assignment fails
                    }
                    
                    return res.json({ 
                        message: 'Sub admin created successfully',
                        subAdminId: subAdminId,
                        location: structuredLocation
                    });
                });
            });
        });
    });
});

// Get sub_admin assignments
router.get('/sub-admin/assignments', isAdmin, (req, res) => {
    const query = `
        SELECT 
            saa.*,
            u.full_name,
            u.email,
            u.phone,
            u.created_at as sub_admin_created_at,
            creator.full_name as creator_name,
            creator.email as creator_email
        FROM sub_admin_assignments saa
        JOIN users u ON saa.sub_admin_id = u.user_id
        JOIN users creator ON saa.assigned_by = creator.user_id
        ORDER BY saa.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch assignments', error: err.message });
        }
        return res.json(results);
    });
});

// Get users managed by current sub_admin
router.get('/managed-users', isAdminOrSubAdmin, (req, res) => {
    if (req.user.role !== 'sub_admin') {
        return res.status(403).json({ message: 'Access denied. Sub Admin required.' });
    }
    
    const query = `
        SELECT u.*, 
               saa.assigned_location,
               saa.created_at as assignment_date
        FROM users u
        JOIN sub_admin_assignments saa ON u.location = saa.assigned_location AND saa.is_active = TRUE
        WHERE saa.sub_admin_id = ? AND u.role IN ('farmer', 'cooperative')
        ORDER BY u.created_at DESC
    `;
    
    db.query(query, [req.user.userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch managed users', error: err.message });
        }
        return res.json(results);
    });
});

// Get user management logs
router.get('/logs', isAdmin, (req, res) => {
    const { userId, action, limit = 50 } = req.query;
    
    let query = `
        SELECT uml.*, u.full_name, u.email
        FROM user_management_logs uml
        JOIN users u ON uml.user_id = u.user_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (userId) {
        conditions.push('uml.user_id = ?');
        params.push(userId);
    }
    
    if (action) {
        conditions.push('uml.action = ?');
        params.push(action);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY uml.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
        }
        return res.json(results);
    });
});

module.exports = router;
