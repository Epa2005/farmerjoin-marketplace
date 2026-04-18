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

        // Check user status in database to enforce ban/suspension
        db.query("SELECT user_id, role, status FROM users WHERE user_id = ?", [decoded.user_id], (err, result) => {
            if (err) {
                console.error('Database error checking user status:', err);
                return res.status(500).json({ message: "Authentication error" });
            }

            if (result.length === 0) {
                return res.status(401).json({ message: "User not found" });
            }

            const user = result[0];

            // Check if user is banned or suspended (case-insensitive)
            const userStatus = user.status ? user.status.toLowerCase() : 'inactive';
            if (userStatus !== 'active') {
                console.log(`User ${decoded.user_id} access denied - status: ${user.status}`);
                let message = "Account is inactive";
                if (userStatus === 'banned') {
                    message = "Your account has been banned. You no longer have access to the system.";
                } else if (userStatus === 'suspended') {
                    message = "Your account has been suspended. Contact support for assistance.";
                }
                return res.status(403).json({ message: message, status: user.status });
            }

            req.user = decoded;
            req.user.status = user.status;
            next();
        });
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

        // Check user status in database to enforce ban/suspension
        db.query("SELECT user_id, role, status FROM users WHERE user_id = ?", [decoded.user_id], (err, result) => {
            if (err) {
                console.error('Database error checking user status:', err);
                return res.status(500).json({ message: "Authentication error" });
            }

            if (result.length === 0) {
                return res.status(401).json({ message: "User not found" });
            }

            const user = result[0];

            // Check if user is banned or suspended (case-insensitive)
            const userStatus = user.status ? user.status.toLowerCase() : 'inactive';
            if (userStatus !== 'active') {
                console.log(`User ${decoded.user_id} access denied - status: ${user.status}`);
                let message = "Account is inactive";
                if (userStatus === 'banned') {
                    message = "Your account has been banned. You no longer have access to the system.";
                } else if (userStatus === 'suspended') {
                    message = "Your account has been suspended. Contact support for assistance.";
                }
                return res.status(403).json({ message: message, status: user.status });
            }

            req.user = decoded;
            req.user.status = user.status;
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get user statistics
router.get('/statistics', isAdminOrSubAdmin, (req, res) => {
    const queries = {
        total_users: 'SELECT COUNT(*) as count FROM users',
        activeUsers: 'SELECT COUNT(*) as count FROM users WHERE LOWER(status) = "active"',
        banned_users: 'SELECT COUNT(*) as count FROM users WHERE LOWER(status) = "banned"',
        suspended_users: 'SELECT COUNT(*) as count FROM users WHERE LOWER(status) = "suspended"',
        totalFarmers: 'SELECT COUNT(*) as count FROM users WHERE role = "farmer"',
        activeFarmers: 'SELECT COUNT(*) as count FROM users WHERE role = "farmer" AND LOWER(status) = "active"'
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
                    db.query('SELECT assigned_location FROM sub_admin_assignments WHERE sub_admin_id = ? AND is_active = TRUE', [req.user.user_id], (err, locationResult) => {
                        if (!err && locationResult.length > 0) {
                            results.myLocation = locationResult[0].assigned_location;
                        } else {
                            // Fallback: Check user's own location in users table
                            db.query('SELECT location FROM users WHERE user_id = ?', [req.user.user_id], (fallbackErr, fallbackResult) => {
                                if (!fallbackErr && fallbackResult.length > 0 && fallbackResult[0].location) {
                                    results.myLocation = fallbackResult[0].location;
                                } else {
                                    results.myLocation = 'Not assigned';
                                }
                                return res.json(results);
                            });
                            return;
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
        params.push(req.user.user_id, req.user.user_id, req.user.user_id);
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

// Ban user (accepts both PUT and POST for compatibility)
router.put('/:userId/ban', isAdmin, (req, res) => {
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
        
        db.query(logQuery, [userId, req.user.user_id, reason || 'No reason provided'], (err) => {
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

// Unban user (accepts both PUT and POST for compatibility)
router.put('/:userId/unban', isAdmin, (req, res) => {
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
        
        db.query(logQuery, [userId, req.user.user_id], (err) => {
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

// Suspend user (accepts both PUT and POST for compatibility)
router.put('/:userId/suspend', isAdmin, (req, res) => {
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
        
        db.query(logQuery, [userId, req.user.user_id, reason || 'No reason provided'], (err) => {
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

// Unsuspend user (accepts both PUT and POST for compatibility)
router.put('/:userId/unsuspend', isAdmin, (req, res) => {
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
        
        db.query(logQuery, [userId, req.user.user_id], (err) => {
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
    
    const { full_name, email, phone, password, province, district, sector, management_level = 'sector' } = req.body;
    
    // Validate required fields
    if (!full_name || !email || !phone || !password || !province || !district || !sector) {
        console.log('Missing fields:', { full_name: !!full_name, email: !!email, phone: !!phone, password: !!password, province: !!province, district: !!district, sector: !!sector });
        return res.status(400).json({ message: 'All fields are required (province, district, sector)' });
    }
    
    // Validate management_level
    if (!['province', 'district', 'sector'].includes(management_level)) {
        return res.status(400).json({ message: 'Invalid management_level. Must be province, district, or sector' });
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
                
                // Assign structured location to sub_admin with management level
                const assignmentQuery = `
                    INSERT INTO sub_admin_assignments (sub_admin_id, assigned_location, province, district, sector, management_level, assigned_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                
                const assignedBy = req.user.user_id;
                db.query(assignmentQuery, [subAdminId, structuredLocation, province, district, sector, management_level, assignedBy], (err, assignmentResult) => {
                    if (err) {
                        console.error('Failed to assign location:', err);
                        // Don't fail the entire operation if assignment fails
                    }
                    
                    return res.json({ 
                        message: 'Sub admin created successfully',
                        subAdminId: subAdminId,
                        location: structuredLocation,
                        management_level: management_level
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
    console.log('=== DEBUG: Managed Users Request ===');
    console.log('User ID:', req.user.user_id);
    console.log('User Role:', req.user.role);
    
    if (req.user.role !== 'sub_admin') {
        return res.status(403).json({ message: 'Access denied. Sub Admin required.' });
    }
    
    // First get sub_admin's assigned location and management level
    const locationQuery = `
        SELECT province, district, sector, management_level 
        FROM sub_admin_assignments 
        WHERE sub_admin_id = ? AND is_active = TRUE
        LIMIT 1
    `;
    
    db.query(locationQuery, [req.user.user_id], (err, locationResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch sub_admin location', error: err.message });
        }
        
        console.log('Location query result:', locationResult);
        console.log('Number of location assignments found:', locationResult.length);
        
        if (locationResult.length === 0) {
            console.log('No location assignment found in sub_admin_assignments for sub_admin:', req.user.user_id);
            
            // Fallback: Check if user has location data in users table
            const fallbackQuery = `
                SELECT province, district, sector 
                FROM users 
                WHERE user_id = ?
            `;
            
            db.query(fallbackQuery, [req.user.user_id], (fallbackErr, fallbackResult) => {
                if (fallbackErr) {
                    console.error('Fallback query error:', fallbackErr);
                    return res.json([]);
                }
                
                if (fallbackResult.length === 0) {
                    console.log('No location data found in users table either for sub_admin:', req.user.user_id);
                    return res.json([]);
                }
                
                const { province, district, sector } = fallbackResult[0];
                
                if (!province || !district || !sector) {
                    console.log('User has incomplete location data:', { province, district, sector });
                    return res.json([]);
                }
                
                // Use user's own location data
                console.log('Using fallback location from users table for sub_admin:', req.user.user_id);
                
                // Default to sector level for fallback
                const management_level = 'sector';
                
                const usersQuery = `
                    SELECT u.* 
                    FROM users u
                    WHERE u.province = ? 
                      AND u.district = ? 
                      AND u.sector = ? 
                      AND u.role IN ('farmer', 'cooperative')
                    ORDER BY u.created_at DESC
                `;
                
                db.query(usersQuery, [province, district, sector], (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Failed to fetch managed users', error: err.message });
                    }
                    
                    console.log(`Sub-admin ${req.user.user_id} fetched ${results.length} users using fallback location: ${province}, ${district}, ${sector}`);
                    return res.json({
                        users: results,
                        count: results.length,
                        management_level: management_level,
                        assigned_location: { province, district, sector }
                    });
                });
            });
            return;
        }
        
        const { province, district, sector, management_level } = locationResult[0];
        
        // Build query based on management level
        let whereConditions = [];
        let params = [];
        
        if (management_level === 'province') {
            whereConditions.push('u.province = ?');
            params.push(province);
        } else if (management_level === 'district') {
            whereConditions.push('u.province = ?');
            whereConditions.push('u.district = ?');
            params.push(province, district);
        } else {
            // sector level (default)
            whereConditions.push('u.province = ?');
            whereConditions.push('u.district = ?');
            whereConditions.push('u.sector = ?');
            params.push(province, district, sector);
        }
        
        // Add role filter
        whereConditions.push("u.role IN ('farmer', 'cooperative')");
        
        const usersQuery = `
            SELECT u.* 
            FROM users u
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY u.created_at DESC
        `;
        
        db.query(usersQuery, params, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch managed users', error: err.message });
            }
            
            console.log(`Sub-admin ${req.user.user_id} fetched ${results.length} users at ${management_level} level: ${province}, ${district}, ${sector}`);
            console.log('Query parameters used:', params);
            console.log('First few results:', results.slice(0, 2));
            
            const response = {
                users: results,
                count: results.length,
                management_level: management_level,
                assigned_location: { province, district, sector }
            };
            console.log('Final response being sent:', response);
            
            return res.json(response);
        });
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

// Delete user (admin only)
router.delete('/:userId', isAdmin, (req, res) => {
    const { userId } = req.params;
    
    console.log('=== USER DELETION REQUEST ===');
    console.log('User ID to delete:', userId);
    console.log('Admin ID:', req.user.user_id);
    
    // Validate userId
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if user exists
    db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, userResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userResult[0];
        
        // Prevent deleting the current admin
        if (userId == req.user.user_id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        // Prevent deleting super_admin
        if (user.role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot delete super_admin account' });
        }
        
        // Delete user (CASCADE will handle related records)
        db.query('DELETE FROM users WHERE user_id = ?', [userId], (err, deleteResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to delete user', error: err.message });
            }
            
            // Log the action
            const logQuery = `
                INSERT INTO user_management_logs (user_id, admin_id, action, reason, created_at)
                VALUES (?, ?, 'delete', 'User deleted by admin', NOW())
            `;
            
            db.query(logQuery, [userId, req.user.user_id], (err) => {
                if (err) {
                    console.error('Failed to log action:', err);
                }
            });
            
            console.log('User deleted successfully:', userId);
            return res.json({ 
                message: 'User deleted successfully',
                user: { userId, email: user.email, role: user.role }
            });
        });
    });
});

module.exports = router;
