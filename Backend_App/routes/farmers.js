const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const router = express.Router();

// Middleware to check if user is admin or sub_admin
const isAdminOrSubAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    
    try {
        // Verify JWT token
        const decoded = jwt.verify(token, 'secretkey');
        
        // Check if user is admin or sub_admin
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
        cb(null, 'profile-' + uniqueSuffix + '.jpg');
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Admin endpoints
// Get all farmers (admin only)
router.get('/admin/farmers', isAdmin, (req, res) => {
    const query = `
        SELECT f.*, u.full_name, u.email, u.phone, u.created_at
        FROM farmers f
        JOIN users u ON f.user_id = u.user_id
        WHERE u.role = 'farmer'
        ORDER BY u.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch farmers' });
        }
        
        res.json(results);
    });
});

// Create new farmer account (admin or sub-admin)
router.post('/admin/create-farmer', isAdminOrSubAdmin, (req, res) => {
    const { full_name, email, phone, cooperative_name, location, province, district, sector } = req.body;
    
    console.log('=== DEBUG: Create Farmer Request ===');
    console.log('User ID:', req.user.user_id);
    console.log('User Role:', req.user.role);
    console.log('Farmer Location Data:', { province, district, sector, location });
    
    // If sub-admin, validate location matches their assignment
    if (req.user.role === 'sub_admin') {
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
            
            if (locationResult.length === 0) {
                console.log('No location assignment found for sub_admin:', req.user.user_id);
                return res.status(403).json({ message: 'Sub-admin has no assigned location. Contact administrator.' });
            }
            
            const { province: assignedProvince, district: assignedDistrict, sector: assignedSector } = locationResult[0];
            console.log('Sub-admin assigned location:', { assignedProvince, assignedDistrict, assignedSector });
            
            // Validate location matches
            if (province !== assignedProvince || district !== assignedDistrict || sector !== assignedSector) {
                console.log('Location mismatch. Sub-admin can only create farmers in:', { assignedProvince, assignedDistrict, assignedSector });
                return res.status(403).json({ 
                    message: `You can only register farmers in your assigned location: ${assignedProvince}, ${assignedDistrict}, ${assignedSector}` 
                });
            }
            
            // Location validated, proceed with farmer creation
            createFarmerAccount(req, res, { full_name, email, phone, cooperative_name, location, province, district, sector });
        });
        return;
    }
    
    // Admin can create farmers anywhere
    createFarmerAccount(req, res, { full_name, email, phone, cooperative_name, location, province, district, sector });
});

// Helper function to create farmer account after validation
const createFarmerAccount = (req, res, { full_name, email, phone, cooperative_name, location, province, district, sector }) => {
    console.log('Proceeding with farmer creation for:', req.user.role);
    
    // Generate a simple password
    const password = Math.random().toString(36).slice(-8);
    
    // Hash the password
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
            
            // Insert into users table with location fields
            const userQuery = `
                INSERT INTO users (full_name, email, phone, password, role, province, district, sector, created_at)
                VALUES (?, ?, ?, ?, 'farmer', ?, ?, ?, NOW())
            `;
            
            db.query(userQuery, [full_name, email, phone, hashedPassword, province, district, sector], (err, userResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error creating user:', err);
                        res.status(500).json({ message: 'Failed to create user account' });
                    });
                }
                
                const userId = userResult.insertId;
                
                // Insert into farmers table
                const farmerQuery = `
                    INSERT INTO farmers (user_id, location, farm_type, description)
                    VALUES (?, ?, ?, ?)
                `;
                
                db.query(farmerQuery, [userId, location, cooperative_name, 'Cooperative Farmer'], (err, farmerResult) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error creating farmer:', err);
                            res.status(500).json({ message: 'Failed to create farmer profile' });
                        });
                    }
                    
                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', commitErr);
                                res.status(500).json({ message: 'Failed to complete farmer creation' });
                            });
                        }
                        
                        res.json({ 
                            message: 'Farmer account created successfully',
                            password: password,
                            userId: userId,
                            farmerId: farmerResult.insertId
                        });
                    });
                });
            });
        });
    });
};

// Get farmer by ID
router.get('/:farmerId', (req, res) => {
    const { farmerId } = req.params;
    
    const query = `
        SELECT f.*, u.full_name, u.email, u.photo as user_photo
        FROM farmers f
        JOIN users u ON f.user_id = u.user_id
        WHERE f.farmer_id = ?
    `;
    
    db.query(query, [farmerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch farmer data' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        
        const farmer = results[0];
        // Map profile photo from either farmers table or users table
        farmer.profile_photo = farmer.profile_photo || farmer.user_photo;
        
        res.json(farmer);
    });
});

// Update farmer profile
router.put('/:farmerId', upload.single('profile_photo'), (req, res) => {
    try {
        const { farmerId } = req.params;
        const { full_name, farm_name, bio, location, email, phone } = req.body;
        
        let updateFields = [];
        let values = [];
        
        // Update farmers table
        if (farm_name) {
            updateFields.push('farm_name = ?');
            values.push(farm_name);
        }
        if (bio) {
            updateFields.push('bio = ?');
            values.push(bio);
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
            values.push(farmerId);
            const farmerQuery = `UPDATE farmers SET ${updateFields.join(', ')} WHERE farmer_id = ?`;
            
            db.query(farmerQuery, values, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to update farmer profile' });
                }
            });
        }
        
        // Update users table for full_name and email
        if (full_name || email) {
            let userFields = [];
            let userValues = [];
            
            if (full_name) {
                userFields.push('full_name = ?');
                userValues.push(full_name);
            }
            if (email) {
                userFields.push('email = ?');
                userValues.push(email);
            }
            
            if (userFields.length > 0) {
                userValues.push(farmerId);
                const userQuery = `
                    UPDATE users 
                    SET ${userFields.join(', ')} 
                    WHERE user_id = (SELECT user_id FROM farmers WHERE farmer_id = ?)
                `;
                
                db.query(userQuery, userValues, (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Failed to update user data' });
                    }
                });
            }
        }
        
        res.json({ message: 'Profile updated successfully' });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get farmer's products
router.get('/:farmerId/products', (req, res) => {
    const { farmerId } = req.params;
    
    const query = 'SELECT * FROM products WHERE farmer_id = ? ORDER BY created_at DESC';
    
    db.query(query, [farmerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch farmer products' });
        }
        res.json(results);
    });
});

// Update farmer (admin or sub_admin with location validation)
router.put('/admin/:farmerId', isAdminOrSubAdmin, (req, res) => {
    const { farmerId } = req.params;
    const { full_name, email, phone, farm_name, bio, location, province, district, sector } = req.body;
    
    console.log('=== FARMER UPDATE REQUEST ===');
    console.log('Farmer ID:', farmerId);
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.user_id);
    
    // For sub-admins, validate that the farmer being updated is within their assigned location
    if (req.user.role === 'sub_admin') {
        // First get the farmer's current location
        const farmerQuery = `
            SELECT u.province, u.district, u.sector 
            FROM users u
            JOIN farmers f ON u.user_id = f.user_id
            WHERE f.farmer_id = ?
        `;
        
        db.query(farmerQuery, [farmerId], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch farmer location' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer not found' });
            }
            
            const farmerLocation = farmerResult[0];
            
            // Get sub_admin's assigned location
            const locationQuery = `
                SELECT province, district, sector 
                FROM sub_admin_assignments 
                WHERE sub_admin_id = ? AND is_active = TRUE
                LIMIT 1
            `;
            
            db.query(locationQuery, [req.user.user_id], (err, locationResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to fetch sub_admin location' });
                }
                
                if (locationResult.length === 0) {
                    return res.status(403).json({ message: 'No location assigned to sub-admin' });
                }
                
                const assignedLocation = locationResult[0];
                
                // Validate that the farmer's location matches the sub-admin's assigned location
                if (farmerLocation.province !== assignedLocation.province || 
                    farmerLocation.district !== assignedLocation.district || 
                    farmerLocation.sector !== assignedLocation.sector) {
                    return res.status(403).json({ 
                        message: 'Access denied. You can only update farmers within your assigned location.',
                        farmerLocation: farmerLocation,
                        assignedLocation: assignedLocation
                    });
                }
                
                // Location validated, proceed with farmer update
                updateFarmerWithValidation(farmerLocation);
            });
        });
    } else {
        // Admin can update farmers anywhere
        updateFarmerWithValidation();
    }
    
    function updateFarmerWithValidation(currentLocation = null) {
        // Start transaction for safe update
        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            // Get farmer's user_id
            db.query('SELECT user_id FROM farmers WHERE farmer_id = ?', [farmerId], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error fetching farmer:', err);
                        res.status(500).json({ message: 'Failed to fetch farmer' });
                    });
                }
                
                if (results.length === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ message: 'Farmer not found' });
                    });
                }
                
                const userId = results[0].user_id;
                
                // For sub-admins, prevent changing location outside their assignment
                let updateProvince = province;
                let updateDistrict = district;
                let updateSector = sector;
                
                if (req.user.role === 'sub_admin' && currentLocation) {
                    // Sub-admins cannot change the location
                    updateProvince = currentLocation.province;
                    updateDistrict = currentLocation.district;
                    updateSector = currentLocation.sector;
                }
                
                // Update users table
                const userUpdateQuery = `
                    UPDATE users 
                    SET full_name = ?, email = ?, phone = ?, province = ?, district = ?, sector = ?
                    WHERE user_id = ?
                `;
                
                db.query(userUpdateQuery, [full_name, email, phone, updateProvince, updateDistrict, updateSector, userId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error updating user:', err);
                            res.status(500).json({ message: 'Failed to update user info' });
                        });
                    }
                    
                    // Update farmers table
                    const farmerUpdateQuery = `
                        UPDATE farmers 
                        SET farm_name = ?, bio = ?, location = ?
                        WHERE farmer_id = ?
                    `;
                    
                    const structuredLocation = (updateProvince && updateDistrict && updateSector) 
                        ? `${updateProvince},${updateDistrict},${updateSector}` 
                        : location || 'Location not set';
                    
                    db.query(farmerUpdateQuery, [farm_name, bio, structuredLocation, farmerId], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error updating farmer:', err);
                                res.status(500).json({ message: 'Failed to update farmer profile' });
                            });
                        }
                        
                        // Commit transaction
                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => {
                                    console.error('Commit error:', commitErr);
                                    res.status(500).json({ message: 'Failed to commit transaction' });
                                });
                            }
                            
                            res.json({ 
                                message: 'Farmer updated successfully',
                                farmerId: farmerId
                            });
                        });
                    });
                });
            });
        });
    }
});

// Delete farmer (admin or sub_admin with location validation)
router.delete('/:farmerId', isAdminOrSubAdmin, (req, res) => {
    const { farmerId } = req.params;
    
    console.log('=== FARMER DELETE REQUEST ===');
    console.log('Farmer ID:', farmerId);
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.user_id);
    
    // For sub-admins, validate that the farmer being deleted is within their assigned location
    if (req.user.role === 'sub_admin') {
        // First get the farmer's current location
        const farmerQuery = `
            SELECT u.province, u.district, u.sector 
            FROM users u
            JOIN farmers f ON u.user_id = f.user_id
            WHERE f.farmer_id = ?
        `;
        
        db.query(farmerQuery, [farmerId], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch farmer location' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer not found' });
            }
            
            const farmerLocation = farmerResult[0];
            
            // Get sub_admin's assigned location
            const locationQuery = `
                SELECT province, district, sector 
                FROM sub_admin_assignments 
                WHERE sub_admin_id = ? AND is_active = TRUE
                LIMIT 1
            `;
            
            db.query(locationQuery, [req.user.user_id], (err, locationResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to fetch sub_admin location' });
                }
                
                if (locationResult.length === 0) {
                    return res.status(403).json({ message: 'No location assigned to sub-admin' });
                }
                
                const assignedLocation = locationResult[0];
                
                // Validate that the farmer's location matches the sub-admin's assigned location
                if (farmerLocation.province !== assignedLocation.province || 
                    farmerLocation.district !== assignedLocation.district || 
                    farmerLocation.sector !== assignedLocation.sector) {
                    return res.status(403).json({ 
                        message: 'Access denied. You can only delete farmers within your assigned location.',
                        farmerLocation: farmerLocation,
                        assignedLocation: assignedLocation
                    });
                }
                
                // Location validated, proceed with farmer deletion
                deleteFarmerWithValidation();
            });
        });
    } else {
        // Admin can delete farmers anywhere
        deleteFarmerWithValidation();
    }
    
    function deleteFarmerWithValidation() {
        // Start transaction for safe deletion
        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            // Get farmer's user_id
            db.query('SELECT user_id FROM farmers WHERE farmer_id = ?', [farmerId], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error fetching farmer:', err);
                        res.status(500).json({ message: 'Failed to fetch farmer' });
                    });
                }
                
                if (results.length === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ message: 'Farmer not found' });
                    });
                }
                
                const userId = results[0].user_id;
                
                // Delete from farmers table
                db.query('DELETE FROM farmers WHERE farmer_id = ?', [farmerId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error deleting farmer:', err);
                            res.status(500).json({ message: 'Failed to delete farmer' });
                        });
                    }
                    
                    // Delete from users table
                    db.query('DELETE FROM users WHERE user_id = ?', [userId], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error deleting user:', err);
                                res.status(500).json({ message: 'Failed to delete user' });
                            });
                        }
                        
                        // Commit transaction
                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => {
                                    console.error('Commit error:', commitErr);
                                    res.status(500).json({ message: 'Failed to commit transaction' });
                                });
                            }
                            
                            res.json({ 
                                message: 'Farmer deleted successfully',
                                farmerId: farmerId
                            });
                        });
                    });
                });
            });
        });
    }
});
module.exports = router;
