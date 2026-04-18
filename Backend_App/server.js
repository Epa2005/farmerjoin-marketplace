// Load environment variables
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./dbConnection");
const multer = require('multer');
const axios = require('axios'); // Add axios for web scraping
const helmet = require('helmet');

// Import authentication middleware
const auth = require('./middleware/auth');

// Helper function to normalize text to title case (e.g., "kigali" -> "Kigali", "KIGALI" -> "Kigali")
const toTitleCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

// Import mobile money checkout routes
const mobileMoneyRoutes = require('./mobileMoneyCheckout');

// Import SMS service for notifications
const smsService = require('./services/smsService');

// Import AI Rwanda router
const aiRouter = require('./ai-rwanda/routes/ai.routes');

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

// Import security middleware
const {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  validateInput,
  validateRegistration,
  validateLogin,
  validateProduct,
  helmetConfig,
  corsOptions,
  validateFileUpload,
  sanitizeQuery
} = require('./middleware/security');

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(sanitizeQuery);

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount mobile money checkout routes
app.use('/api', mobileMoneyRoutes);

// Mount AI Rwanda router
app.use('/api/ai', aiRouter);

// Secure session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'student',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Import user management routes
const userManagementRoutes = require('./user_management_routes');
app.use('/api/users', userManagementRoutes);

// Static files with CORS headers
app.use("/uploads", (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express.static("uploads", {
    maxAge: '1d',
    etag: true
}));
app.use("/uploads/images", (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express.static("uploads/images", {
    maxAge: '1d',
    etag: true
}));
app.use("/uploads/admin", (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express.static("uploads/admin", {
    maxAge: '1d',
    etag: true
}));

// Configure multer for secure file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function (req, file, cb) {
        // Generate secure filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, `product-${uniqueSuffix}.${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
        files: 1 // Limit to 1 file per request
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = process.env.ALLOWED_FILE_TYPES ? 
            process.env.ALLOWED_FILE_TYPES.split(',') : 
            ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(ext)) {
            return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
        cb(null, true);
    }
});

// Admin upload storage configuration
const adminStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const fs = require('fs');
        const adminUploadDir = 'uploads/admin';
        
        // Create admin directory if it doesn't exist
        if (!fs.existsSync(adminUploadDir)) {
            fs.mkdirSync(adminUploadDir, { recursive: true });
        }
        
        cb(null, adminUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, `admin-${uniqueSuffix}.${ext}`);
    }
});

const adminUpload = multer({ 
    storage: adminStorage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
        files: 1 // Limit to 1 file per request
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = process.env.ALLOWED_FILE_TYPES ? 
            process.env.ALLOWED_FILE_TYPES.split(',') : 
            ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(ext)) {
            return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
        cb(null, true);
    }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
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

            // Add user info to request
            req.user = decoded;
            req.user.status = user.status;
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// ============= AUTHENTICATION ROUTES =============

// REGISTER with security improvements - Buyer Only Registration (temporarily without validation)
app.post("/auth/register", registerLimiter, async (req, res) => {
    console.log('=== REGISTRATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { full_name, email, phone, password } = req.body;
    
    // Basic validation
    if (!full_name || !email || !phone || !password) {
        console.log('Missing required fields:', { full_name: !!full_name, email: !!email, phone: !!phone, password: !!password });
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Force role to be buyer only
    const role = "buyer";
    console.log('Processing registration for:', { full_name, email, phone, role: 'buyer' });
    
    // Check if user already exists
    db.query("SELECT user_id FROM users WHERE email = ?", [email], async (err, existingUser) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (existingUser.length > 0) {
            console.log('Email already registered:', email);
            return res.status(409).json({ message: 'Email already registered' });
        }
        
        // Hash password with secure rounds
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashed = await bcrypt.hash(password, bcryptRounds);

        // Start transaction for data consistency
        db.beginTransaction(async (err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            try {
                // Insert user with buyer role
                db.query(
                    "INSERT INTO users (full_name,email,phone,password,role,created_at) VALUES (?,?,?,?,?,NOW())",
                    [full_name, email, phone, hashed, role],
                    (err, result) => {
                        if (err) {
                            console.error('User insertion error:', err);
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Registration failed' });
                            });
                        }

                        const userId = result.insertId;
                        console.log('User created with ID:', userId);

                        // Insert buyer profile
                        db.query("INSERT INTO buyers (user_id) VALUES (?)", [userId], (err) => {
                            if (err) {
                                console.error('Buyer profile insertion error:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Profile creation failed' });
                                });
                            }

                            db.commit((commitErr) => {
                                if (commitErr) {
                                    console.error('Commit error:', commitErr);
                                    return db.rollback(() => {
                                        res.status(500).json({ message: 'Registration failed' });
                                    });
                                }

                                // Log security event
                                console.log(`New buyer registered: ${email}, User ID: ${userId}`);
                                
                                res.status(201).json({ 
                                    message: "Buyer registration successful",
                                    user_id: userId,
                                    role: "buyer"
                                });
                            });
                        });
                    }
                );
            } catch (error) {
                console.error('Registration error:', error);
                db.rollback();
                res.status(500).json({ message: 'Registration failed' });
            }
        });
    });
});

// LOGIN with security improvements
app.post("/auth/login", loginLimiter, validateInput(validateLogin), (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        console.log('LOGIN ATTEMPT - Email:', email);
        console.log('LOGIN ATTEMPT - Users found:', result.length);
        
        if (result.length === 0) {
            // Log failed login attempt
            console.warn(`Failed login attempt for email: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = result[0];
        console.log('LOGIN ATTEMPT - User found:', user);
        console.log('LOGIN ATTEMPT - Stored password hash:', user.password);
        
        try {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                // Log failed login attempt
                console.warn(`Failed login attempt for email: ${email}`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Generate JWT token with expiration
            const token = jwt.sign(
                { 
                    user_id: user.user_id, 
                    role: user.role,
                    email: user.email
                },
                process.env.JWT_SECRET || 'secretkey',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Log successful login
            console.log(`User logged in: ${email}, Role: ${user.role}`);

            res.json({ 
                token,
                user: {
                    user_id: user.user_id,
                    role: user.role,
                    full_name: user.full_name,
                    email: user.email
                }
            });
        } catch (compareError) {
            console.error('Password comparison error:', compareError);
            return res.status(500).json({ message: 'Authentication error' });
        }
    });
});

// FORGOT PASSWORD - STEP 1: Verify email (for buyers, farmers, and cooperatives)
app.post("/auth/forgot-password/verify", (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists and is a buyer, farmer, or cooperative
    db.query(
        "SELECT * FROM users WHERE email = ? AND role IN ('buyer', 'farmer', 'cooperative')",
        [email],
        (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "No account found with this email" });
            }

            const user = result[0];
            
            // Generate a reset token (valid for 1 hour)
            const resetToken = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
            
            // Store reset token in database (you might want to add these columns to users table)
            // For now, we'll return token directly (in production, email it)
            res.json({
                message: "Email verified. You can now reset your password.",
                resetToken: resetToken,
                email: user.email,
                fullName: user.full_name,
                userId: user.user_id,
                role: user.role
            });
        }
    );
});

// FORGOT PASSWORD - STEP 2: Reset password (for buyers, farmers, and cooperatives)
app.post("/auth/forgot-password/reset", (req, res) => {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword || !resetToken) {
        return res.status(400).json({ message: "Email, new password, and reset token are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash new password
    bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
            console.error("Error hashing password:", hashErr);
            return res.status(500).json({ message: "Error processing password" });
        }

        // Update user's password (for buyers, farmers, and cooperatives)
        db.query(
            "UPDATE users SET password = ? WHERE email = ? AND role IN ('buyer', 'farmer', 'cooperative')",
            [hashedPassword, email],
            (updateErr, result) => {
                if (updateErr) {
                    console.error("Error updating password:", updateErr);
                    return res.status(500).json({ message: "Error updating password" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "User not found" });
                }

                res.json({
                    message: "Password reset successfully! You can now login with your new password."
                });
            }
        );
    });
});

// ============= ADMIN ROUTES =============

// Get all farmers (admin only)
app.get('/farmers/admin/farmers', isAdmin, (req, res) => {
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

// Create new farmer account (admin only)
app.post('/farmers/admin/create-farmer', isAdminOrSubAdmin, (req, res) => {
    console.log('=== FARMER CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.user_id);
    
    const { full_name, email, phone, password, cooperative_name, location, province, district, sector } = req.body;

    console.log('Original location input:', { province, district, sector });

    // Normalize location fields to title case for consistency
    const normalizedProvince = toTitleCase(province);
    const normalizedDistrict = toTitleCase(district);
    const normalizedSector = toTitleCase(sector);

    console.log('Normalized location values:', { normalizedProvince, normalizedDistrict, normalizedSector });

    // Validate required fields including password
    if (!full_name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Full name, email, phone, and password are required' });
    }
    
    // For sub-admins, validate that the farmer's location matches their assigned location
    if (req.user.role === 'sub_admin') {
        if (!normalizedProvince || !normalizedDistrict || !normalizedSector) {
            return res.status(400).json({ message: 'Province, district, and sector are required for sub-admin farmer creation' });
        }
        
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
                        return res.status(500).json({ message: 'Failed to fetch sub_admin location' });
                    }
                    
                    if (fallbackResult.length === 0) {
                        console.log('No location data found in users table either for sub_admin:', req.user.user_id);
                        return res.status(403).json({ message: 'No location assigned to sub-admin. Cannot create farmers.' });
                    }
                    
                    const { province: assignedProvince, district: assignedDistrict, sector: assignedSector } = fallbackResult[0];

                    if (!assignedProvince || !assignedDistrict || !assignedSector) {
                        console.log('User has incomplete location data:', { province: assignedProvince, district: assignedDistrict, sector: assignedSector });
                        return res.status(403).json({ message: 'Sub-admin has incomplete location data. Cannot create farmers.' });
                    }

                    // Use user's own location data
                    console.log('Using fallback location from users table for sub_admin:', req.user.user_id);

                    const assignedLocation = { province: assignedProvince, district: assignedDistrict, sector: assignedSector };

                    console.log('FALLBACK - Assigned location:', assignedLocation);
                    console.log('FALLBACK - Comparison:', {
                        provinceMatch: normalizedProvince.toLowerCase() === assignedLocation.province.toLowerCase(),
                        districtMatch: normalizedDistrict.toLowerCase() === assignedLocation.district.toLowerCase(),
                        sectorMatch: normalizedSector.toLowerCase() === assignedLocation.sector.toLowerCase()
                    });

                    // Validate that the farmer's location matches the sub-admin's location (case-insensitive)
                    if (normalizedProvince.toLowerCase() !== assignedLocation.province.toLowerCase() ||
                        normalizedDistrict.toLowerCase() !== assignedLocation.district.toLowerCase() ||
                        normalizedSector.toLowerCase() !== assignedLocation.sector.toLowerCase()) {
                        return res.status(403).json({
                            message: 'Access denied. You can only create farmers within your assigned location.',
                            assignedLocation: assignedLocation,
                            requestedLocation: { province: normalizedProvince, district: normalizedDistrict, sector: normalizedSector }
                        });
                    }
                    
                    // Proceed with farmer creation
                    createFarmerWithValidation();
                });
                return;
            }
            
            const { province: assignedProvince, district: assignedDistrict, sector: assignedSector } = locationResult[0];

            const assignedLocation = { province: assignedProvince, district: assignedDistrict, sector: assignedSector };

            console.log('Assigned location:', assignedLocation);
            console.log('Comparison:', {
                provinceMatch: normalizedProvince.toLowerCase() === assignedLocation.province.toLowerCase(),
                districtMatch: normalizedDistrict.toLowerCase() === assignedLocation.district.toLowerCase(),
                sectorMatch: normalizedSector.toLowerCase() === assignedLocation.sector.toLowerCase()
            });

            // Validate that the farmer's location matches the sub-admin's assigned location (case-insensitive)
            if (normalizedProvince.toLowerCase() !== assignedLocation.province.toLowerCase() ||
                normalizedDistrict.toLowerCase() !== assignedLocation.district.toLowerCase() ||
                normalizedSector.toLowerCase() !== assignedLocation.sector.toLowerCase()) {
                return res.status(403).json({
                    message: 'Access denied. You can only create farmers within your assigned location.',
                    assignedLocation: assignedLocation,
                    requestedLocation: { province: normalizedProvince, district: normalizedDistrict, sector: normalizedSector }
                });
            }
            
            // Location validated, proceed with farmer creation
            createFarmerWithValidation();
        });
    } else {
        // Admin can create farmers anywhere
        createFarmerWithValidation();
    }
    
    function createFarmerWithValidation() {
        // Hash the provided password
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
                
                // Create structured location string if provided
                const structuredLocation = (normalizedProvince && normalizedDistrict && normalizedSector) ? `${normalizedProvince},${normalizedDistrict},${normalizedSector}` : location || 'Location not set';

                // Insert into users table with structured location
                const userQuery = `
                    INSERT INTO users (full_name, email, phone, password, role, province, district, sector, location, created_at)
                    VALUES (?, ?, ?, ?, 'farmer', ?, ?, ?, ?, NOW())
                `;

                db.query(userQuery, [full_name, email, phone, hashedPassword, normalizedProvince || null, normalizedDistrict || null, normalizedSector || null, structuredLocation], (err, userResult) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error creating user:', err);
                            res.status(500).json({ message: 'Failed to create user account' });
                        });
                    }
                    
                    const userId = userResult.insertId;

                    // Insert into farmers table with normalized location
                    const farmerQuery = `
                        INSERT INTO farmers (user_id, location, farm_type, description, province, district, sector)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                db.query(farmerQuery, [userId, structuredLocation, cooperative_name, 'Cooperative Farmer', normalizedProvince, normalizedDistrict, normalizedSector], (err, farmerResult) => {
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
                            userId: userId,
                            farmerId: farmerResult.insertId,
                            credentials: {
                                email: email,
                                password: password // Return the password that was set by admin
                            }
                        });
                    });
                });
            });
        });
    });
    }
});

// Create new cooperative account (admin only)
app.post('/cooperative/admin/create-cooperative', isAdmin, (req, res) => {
    const { full_name, email, phone, password, cooperative_name, location } = req.body;
    
    // Validate required fields including password
    if (!full_name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Full name, email, phone, and password are required' });
    }
    
    // Hash the provided password
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
                    INSERT INTO cooperatives (user_id, cooperative_name, location, description)
                    VALUES (?, ?, ?, ?)
                `;
                
                db.query(cooperativeQuery, [userId, cooperative_name, location, 'Agricultural Cooperative'], (err, cooperativeResult) => {
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
                            userId: userId,
                            cooperativeId: cooperativeResult.insertId,
                            credentials: {
                                email: email,
                                password: password // Return the password that was set by admin
                            }
                        });
                    });
                });
            });
        });
    });
});

// ============= LEGACY ROUTES (for compatibility) =============

// Legacy login (session-based)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    connection.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
        if (err) {
            console.error('query error', err);
            return res.status(500).json({ message: 'Database error' });
        }
        else if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        else { 
            const user = result[0];
            
            try {
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Invalid password' });
                }
                
                // Create session
                req.session.user = {
                    user_id: user.user_id,
                    role: user.role,
                    full_name: user.full_name,
                    email: user.email
                };
                
                res.json({ 
                    message: 'Login successful',
                    user: {
                        user_id: user.user_id,
                        role: user.role,
                        full_name: user.full_name,
                        email: user.email
                    }
                });
            } catch (compareError) {
                console.error('Password comparison error:', compareError);
                return res.status(500).json({ message: 'Authentication error' });
            }
        }
    });
});

// Legacy create account (username-based)
app.post('/create_account', (req, res) => {
    const { username } = req.body;
    connection.query('SELECT * FROM users WHERE username=?', [username], (err, results) => {
        if (err) {
            console.error('query error', err);
        }
        else if (results.length > 0) {
            res.json({ msg: ' already exist! try another!' });
        }
        else {
            const { username, password } = req.body;
            if (!username || !password) {
                res.json({ msg: 'username and password is required!' });
            } else {
                bcrypt.hash(password, 10, (err, hashedpassword) => {
                    if (err) throw err;
                    else {
                        connection.query('INSERT INTO users (username,password) VALUES(?,?)', [username, hashedpassword], (err, results) => {
                            if (err) {
                                console.error('queryerror', err);
                            }
                            else {
                                res.json({ msg: 'welcome! your account created succesfuly!' });
                            }
                        });
                    }
                });
            }
        }
    });
});

// Get all users (for admin user management)
app.get('/users', (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
        }

        // Calculate statistics
        const totalUsers = results.length;
        const totalFarmers = results.filter(u => u.role === 'farmer').length;
        const totalBuyers = results.filter(u => u.role === 'buyer').length;
        const totalSubAdmins = results.filter(u => u.role === 'sub_admin').length;
        const totalAdmins = results.filter(u => u.role === 'admin').length;

        // Get total products count
        db.query("SELECT COUNT(*) as count FROM products", (err, productResult) => {
            if (err) {
                console.error('Database error fetching products:', err);
                return res.status(500).json({ message: 'Failed to fetch products count', error: err.message });
            }

            // Get total orders count
            db.query("SELECT COUNT(*) as count FROM orders", (err, orderResult) => {
                if (err) {
                    console.error('Database error fetching orders:', err);
                    return res.status(500).json({ message: 'Failed to fetch orders count', error: err.message });
                }

                const stats = {
                    totalUsers,
                    totalFarmers,
                    totalBuyers,
                    totalSubAdmins,
                    totalAdmins,
                    totalProducts: productResult[0].count,
                    totalOrders: orderResult[0].count,
                    users: results // Include users array for user management
                };

                return res.json(stats);
            });
        });
    });
});

// Delete user
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE user_id=?', [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to delete user', error: err.message });
        } else {
            return res.json({ message: "User deleted successfully" });
        }
    });
});

// ============= PRODUCT ROUTES =============

// Add new product with security improvements
app.post('/products/add', upload.single('image'), validateFileUpload, validateInput(validateProduct), (req, res) => {
    const { 
        product_name, 
        category, 
        price, 
        quantity, 
        farmer_id
    } = req.body;
    
    // Get image from file upload
    const image = req.file ? req.file.filename : '';
    
    // Verify farmer exists and is active
    db.query(
        "SELECT u.user_id FROM users u JOIN farmers f ON u.user_id = f.user_id WHERE u.user_id = ?",
        [farmer_id],
        (err, farmerCheck) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerCheck.length === 0) {
                return res.status(400).json({ message: 'Invalid or inactive farmer ID' });
            }
            
            // Insert product into database with prepared statement
            const query = `
                INSERT INTO products (
                    product_name, 
                    category, 
                    price, 
                    quantity, 
                    farmer_id, 
                    image,
                    status,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
            `;
            
            const values = [
                product_name,
                category || 'general',
                parseFloat(price),
                parseInt(quantity) || 1,
                parseInt(farmer_id),
                image
            ];
            
            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        message: 'Failed to add product', 
                        error: 'Database operation failed'
                    });
                }
                
                // Log product creation
                console.log(`Product added: ${product_name} by farmer ${farmer_id}`);
                
                res.status(201).json({
                    message: 'Product added successfully',
                    productId: result.insertId,
                    product: {
                        product_id: result.insertId,
                        product_name,
                        category: category || 'general',
                        price: parseFloat(price),
                        quantity: parseInt(quantity) || 1,
                        farmer_id: parseInt(farmer_id),
                        image: image ? `uploads/products/${image}` : '',
                        status: 'active',
                        created_at: new Date()
                    }
                });
            });
        }
    );
});

// Get individual product details
app.get('/products/:productId', (req, res) => {
    const { productId } = req.params;
    
    const query = `
        SELECT 
            p.*,
            u.full_name as farmer_name,
            u.email as farmer_email,
            u.phone as farmer_phone
        FROM products p
        LEFT JOIN users u ON p.farmer_id = u.user_id
        WHERE p.product_id = ?
    `;
    
    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch product details' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(results[0]);
    });
});

// Delete user (admin only)
app.delete('/users/:userId', isAdmin, (req, res) => {
    const { userId } = req.params;
    
    console.log('DELETING USER - userId:', userId);
    console.log('DELETING USER - Request from admin:', req.user?.full_name);
    
    // First check if user exists and get their role
    const checkQuery = 'SELECT user_id, role FROM users WHERE user_id = ?';
    db.query(checkQuery, [userId], (err, userResult) => {
        if (err) {
            console.error('Database error checking user:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (userResult.length === 0) {
            console.log('USER NOT FOUND for deletion:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('USER FOUND FOR DELETION:', userResult[0]);
        
        // Get farmer_id if user is a farmer, to delete their products first
        const getFarmerIdQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        db.query(getFarmerIdQuery, [userId], (err, farmerResult) => {
            if (err) {
                console.error('Error getting farmer_id:', err);
            }
            
            const farmerId = farmerResult.length > 0 ? farmerResult[0].farmer_id : null;
            
            // Start cascade deletion process
            const deleteRelatedRecords = () => {
                console.log('STARTING CASCADE DELETION for user:', userId, 'farmer_id:', farmerId);
                
                // Delete in correct order to respect foreign key constraints
                const deleteSteps = [
                    // 1. Delete cart items for this user (if buyer)
                    { query: 'DELETE FROM cart WHERE buyer_id = ?', params: [userId] },
                    // 2. Delete order items for this user's products (if farmer)
                    { query: 'DELETE oi FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE p.farmer_id = ?', params: [farmerId] },
                    // 3. Delete orders for this user (if buyer)
                    { query: 'DELETE FROM orders WHERE buyer_id = ?', params: [userId] },
                    // 4. Get product images for cleanup (if farmer)
                    { 
                        query: 'SELECT image FROM products WHERE farmer_id = ? AND image IS NOT NULL', 
                        params: [farmerId],
                        isImageCleanup: true
                    },
                    // 5. Delete products for this user (if farmer)
                    { query: 'DELETE FROM products WHERE farmer_id = ?', params: [farmerId] },
                    // 6. Delete farmer profile (if farmer)
                    { query: 'DELETE FROM farmers WHERE user_id = ?', params: [userId] },
                    // 7. Finally delete the user
                    { query: 'DELETE FROM users WHERE user_id = ?', params: [userId] }
                ];
                
                let currentStep = 0;
                
                const executeNextStep = () => {
                    if (currentStep < deleteSteps.length) {
                        const step = deleteSteps[currentStep];
                        console.log(`EXECUTING STEP ${currentStep + 1}:`, step.query);
                        console.log('PARAMETERS:', step.params);
                        
                        db.query(step.query, step.params, (err, result) => {
                            if (err) {
                                console.error(`ERROR IN STEP ${currentStep + 1}:`, err);
                                console.error('ERROR CODE:', err.code);
                                console.error('ERROR MESSAGE:', err.message);
                                return res.status(500).json({ 
                                    message: `Failed to delete user at step ${currentStep + 1}`,
                                    step: currentStep + 1,
                                    error: err.message 
                                });
                            }
                            
                            // Handle image cleanup step
                            if (step.isImageCleanup && result && result.length > 0) {
                                const fs = require('fs');
                                const path = require('path');
                                result.forEach(row => {
                                    if (row.image) {
                                        const fullPath = path.join(__dirname, row.image);
                                        fs.unlink(fullPath, (unlinkErr) => {
                                            if (unlinkErr) {
                                                console.error('Error deleting image file:', unlinkErr);
                                            } else {
                                                console.log('Image file deleted successfully:', fullPath);
                                            }
                                        });
                                    }
                                });
                            }
                            
                            console.log(`STEP ${currentStep + 1} COMPLETED:`, result);
                            currentStep++;
                            executeNextStep();
                        });
                    } else {
                        console.log('CASCADE DELETION COMPLETED for user:', userId);
                        res.json({ message: 'User and all related records deleted successfully' });
                    }
                };
                
                executeNextStep();
            };
            
            deleteRelatedRecords();
        });
    });
});

// Suspend user (admin only)
app.put('/users/:userId/suspend', isAdmin, (req, res) => {
    const { userId } = req.params;
    
    const query = 'UPDATE users SET status = ? WHERE user_id = ?';
    
    db.query(query, ['suspended', userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to suspend user' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User suspended successfully' });
    });
});

// Activate user (admin only)
app.put('/users/:userId/activate', isAdmin, (req, res) => {
    const { userId } = req.params;
    
    const query = 'UPDATE users SET status = ? WHERE user_id = ?';
    
    db.query(query, ['active', userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to activate user' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User activated successfully' });
    });
});

// Get all products (public endpoint) with optional farmer filtering
app.get('/products', (req, res) => {
    const { farmer_id } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('PRODUCTS ENDPOINT - farmer_id from query:', farmer_id);
    
    let query = `
        SELECT 
            p.*,
            u.full_name as farmer_name,
            u.email as farmer_email,
            u.phone as farmer_phone,
            f.location as farm_location,
            f.farm_name
        FROM products p
        LEFT JOIN farmers f ON p.farmer_id = f.farmer_id
        LEFT JOIN users u ON f.user_id = u.user_id
    `;
    let params = [];
    
    // If user is authenticated farmer, automatically filter by their farmer_id
    if (token && !farmer_id) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
            if (decoded.role === 'farmer') {
                const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
                db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
                    if (!err && farmerResult.length > 0) {
                        query += ' WHERE p.farmer_id = ?';
                        params.push(farmerResult[0].farmer_id);
                        console.log('PRODUCTS - Auto-filtering for authenticated farmer:', farmerResult[0].farmer_id);
                        executeProductsQuery(query, params, res);
                        return;
                    }
                });
            }
        } catch (err) {
            // Token invalid, continue with public view
            console.log('PRODUCTS - Invalid token, showing public view');
        }
    }
    
    // If farmer_id is provided, filter by that farmer
    if (farmer_id) {
        query += ' WHERE p.farmer_id = ?';
        params.push(parseInt(farmer_id));
        console.log('PRODUCTS - Added WHERE clause for farmer_id:', farmer_id);
    }
    
    executeProductsQuery(query, params, res);
});

function executeProductsQuery(query, params, res) {
    query += ' ORDER BY p.created_at DESC';
    console.log('PRODUCTS - Final query:', query);
    console.log('PRODUCTS - Final params:', params);
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            console.error('Failed query:', query);
            console.error('Failed params:', params);
            return res.status(500).json({ message: 'Failed to fetch products' });
        }
        
        // Add full image path to each product
        const productsWithImagePaths = results.map(product => ({
            ...product,
            image: product.image ? `uploads/products/${product.image}` : null
        }));
        
        console.log(`Products query results:`, productsWithImagePaths.length, 'products');
        res.json(productsWithImagePaths);
    });
}

// Get reviews for a farmer
app.get('/reviews', (req, res) => {
    const { farmer_id } = req.query;
    
    if (!farmer_id) {
        return res.status(400).json({ message: 'Farmer ID is required' });
    }
    
    const query = `
        SELECT 
            r.*,
            u.full_name as reviewer_name,
            u.email as reviewer_email
        FROM reviews r
        LEFT JOIN users u ON r.buyer_id = u.user_id
        WHERE r.farmer_id = ?
        ORDER BY r.created_at DESC
    `;
    
    db.query(query, [farmer_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch reviews' });
        }
        
        res.json(results);
    });
});

// Get admin settings
app.get('/admin/settings', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Create settings table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                siteName VARCHAR(255),
                siteDescription TEXT,
                contactEmail VARCHAR(255),
                contactPhone VARCHAR(50),
                maintenanceMode BOOLEAN DEFAULT false,
                allowRegistrations BOOLEAN DEFAULT true,
                emailNotifications BOOLEAN DEFAULT true,
                maxFileSize INT DEFAULT 5,
                allowedFileTypes VARCHAR(255),
                systemTimezone VARCHAR(100),
                defaultLanguage VARCHAR(10) DEFAULT 'en',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        db.query(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating settings table:', err);
                // Return default settings even if table creation fails
                return res.json({
                    siteName: "FarmerJoin",
                    siteDescription: "Agricultural Management System",
                    contactEmail: "admin@farmerjoin.com",
                    contactPhone: "+250 788 123 456",
                    maintenanceMode: false,
                    allowRegistrations: true,
                    emailNotifications: true,
                    maxFileSize: 5,
                    allowedFileTypes: "jpg,jpeg,png,gif,webp",
                    systemTimezone: "Africa/Kigali",
                    defaultLanguage: "en"
                });
            }

            // Query settings from database or return defaults
            const query = 'SELECT * FROM settings WHERE id = 1';
            db.query(query, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    // Return default settings if table doesn't exist
                    return res.json({
                        siteName: "FarmerJoin",
                        siteDescription: "Agricultural Management System",
                        contactEmail: "admin@farmerjoin.com",
                        contactPhone: "+250 788 123 456",
                        maintenanceMode: false,
                        allowRegistrations: true,
                        emailNotifications: true,
                        maxFileSize: 5,
                        allowedFileTypes: "jpg,jpeg,png,gif,webp",
                        systemTimezone: "Africa/Kigali",
                        defaultLanguage: "en"
                    });
                }

                if (results.length === 0) {
                    // Return default settings if no settings exist
                    return res.json({
                        siteName: "FarmerJoin",
                        siteDescription: "Agricultural Management System",
                        contactEmail: "admin@farmerjoin.com",
                        contactPhone: "+250 788 123 456",
                        maintenanceMode: false,
                        allowRegistrations: true,
                        emailNotifications: true,
                        maxFileSize: 5,
                        allowedFileTypes: "jpg,jpeg,png,gif,webp",
                        systemTimezone: "Africa/Kigali",
                        defaultLanguage: "en"
                    });
                }

                res.json(results[0]);
            });
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Update admin settings
app.put('/admin/settings', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const settings = req.body;

        // Create settings table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                siteName VARCHAR(255),
                siteDescription TEXT,
                contactEmail VARCHAR(255),
                contactPhone VARCHAR(50),
                maintenanceMode BOOLEAN DEFAULT false,
                allowRegistrations BOOLEAN DEFAULT true,
                emailNotifications BOOLEAN DEFAULT true,
                maxFileSize INT DEFAULT 5,
                allowedFileTypes VARCHAR(255),
                systemTimezone VARCHAR(100),
                defaultLanguage VARCHAR(10) DEFAULT 'en',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        db.query(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating settings table:', err);
                return res.status(500).json({ message: 'Failed to create settings table' });
            }

            // Upsert settings
            const upsertQuery = `
                INSERT INTO settings (id, siteName, siteDescription, contactEmail, contactPhone, maintenanceMode, allowRegistrations, emailNotifications, maxFileSize, allowedFileTypes, systemTimezone, defaultLanguage)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                siteName = VALUES(siteName),
                siteDescription = VALUES(siteDescription),
                contactEmail = VALUES(contactEmail),
                contactPhone = VALUES(contactPhone),
                maintenanceMode = VALUES(maintenanceMode),
                allowRegistrations = VALUES(allowRegistrations),
                emailNotifications = VALUES(emailNotifications),
                maxFileSize = VALUES(maxFileSize),
                allowedFileTypes = VALUES(allowedFileTypes),
                systemTimezone = VALUES(systemTimezone),
                defaultLanguage = VALUES(defaultLanguage)
            `;

            const params = [
                settings.siteName,
                settings.siteDescription,
                settings.contactEmail,
                settings.contactPhone,
                settings.maintenanceMode,
                settings.allowRegistrations,
                settings.emailNotifications,
                settings.maxFileSize,
                settings.allowedFileTypes,
                settings.systemTimezone,
                settings.defaultLanguage
            ];

            db.query(upsertQuery, params, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to save settings' });
                }

                res.json({ message: 'Settings saved successfully' });
            });
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Update product stock when added to cart
app.put('/products/:productId/stock', (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }
    
    const query = 'UPDATE products SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?';
    
    db.query(query, [quantity, productId, quantity], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to update stock' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Insufficient stock or product not found' });
        }
        
        res.json({ 
            message: 'Stock updated successfully',
            affectedRows: result.affectedRows
        });
    });
});

// Get all farmers for buyers
app.get('/buyer/farmers', (req, res) => {
    const query = `
        SELECT 
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            f.location,
            f.farm_type,
            f.description
        FROM users u
        JOIN farmers f ON u.user_id = f.user_id
        WHERE u.role = 'farmer'
        ORDER BY u.full_name ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch farmers' });
        }
        res.json(results);
    });
});

// Get all carts (for farmers to view buyer carts)
app.get('/carts', (req, res) => {
    const query = `
        SELECT 
            c.*,
            u.full_name as buyer_name,
            u.email as buyer_email,
            u.phone as buyer_phone
        FROM carts c
        LEFT JOIN users u ON c.buyer_id = u.user_id
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch carts' });
        }
        res.json(results);
    });
});

// Get farmer profile (authenticated)
app.get('/farmer/profile', (req, res) => {
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
        
        const query = `
            SELECT f.*, u.full_name, u.email, u.phone, u.photo as profile_photo
            FROM farmers f
            JOIN users u ON f.user_id = u.user_id
            WHERE f.user_id = ? AND u.role = 'farmer'
        `;
        
        db.query(query, [farmerId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch profile' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            res.json(results[0]);
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Upload profile photo
app.post('/farmer/upload-profile-photo', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No photo uploaded' });
    }
    
    const photoUrl = `/uploads/${req.file.filename}`;
    
    // Update user's photo in database
    const query = 'UPDATE users SET photo = ? WHERE user_id = ?';
    // This would need farmer authentication middleware to get user_id
    
    res.json({ 
        message: 'Profile photo uploaded successfully',
        url: photoUrl
    });
});

// Add sample data for testing
app.get('/add-sample-data', (req, res) => {
    // Add sample farmers with locations
    const sampleFarmers = [
        ['Kigali, Rwanda', 'Vegetable Farm', 'Fresh vegetables grown locally'],
        ['Kigali, Rwanda', 'Fruit Farm', 'Tropical fruits and berries'],
        ['Musanze, Rwanda', 'Coffee Plantation', 'Premium Arabica coffee'],
        ['Rubavu, Rwanda', 'Tea Farm', 'Organic tea leaves']
    ];

    sampleFarmers.forEach((farmer, index) => {
        // First create a user
        db.query(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [`Farmer ${index + 1}`, `farmer${index + 1}@test.com`, '$2a$10$N9qo8uLOickgx2ZERZx6Jd/6B7uL3Nq4cKuY0Sx6aM', 'farmer'],
            (err, userResult) => {
                if (!err && userResult.insertId) {
                    // Then create farmer profile
                    db.query(
                        'INSERT INTO farmers (user_id, location, farm_type, description) VALUES (?, ?, ?, ?)',
                        [userResult.insertId, farmer[0], farmer[1], farmer[2]]
                    );
                }
            }
        );
    });

    res.json({ message: 'Sample data added successfully' });
});

// Test database connection
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 as test', (err, results) => {
        if (err) {
            console.error('Database test error:', err);
            return res.status(500).json({ error: 'Database connection failed', details: err.message });
        }
        res.json({ message: 'Database connected successfully', results });
    });
});

// Test if farmers table exists
app.get('/test-farmers', (req, res) => {
    db.query('SELECT * FROM farmers LIMIT 1', (err, results) => {
        if (err) {
            console.error('Farmers table error:', err);
            return res.status(500).json({ error: 'Farmers table not accessible', details: err.message });
        }
        res.json({ message: 'Farmers table accessible', count: results.length, results });
    });
});

// ============= PUBLIC FARMERS ROUTES =============

// Get all farmers (public endpoint for buyer dashboard)
app.get('/farmers', (req, res) => {
    const query = `
        SELECT 
            f.farmer_id,
            f.user_id,
            f.location as farmer_location,
            f.farm_type,
            f.description,
            f.latitude,
            f.longitude,
            u.full_name,
            u.email,
            u.phone,
            u.photo as profile_photo,
            u.created_at
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

// Get individual farmer details with their products
app.get('/farmers/:farmerId', (req, res) => {
    const farmerId = req.params.farmerId;
    
    // Get farmer details
    const farmerQuery = `
        SELECT 
            f.farmer_id,
            f.user_id,
            f.location as farmer_location,
            f.farm_type,
            f.description,
            f.latitude,
            f.longitude,
            u.full_name,
            u.email,
            u.phone,
            u.photo as profile_photo,
            u.created_at
        FROM farmers f
        JOIN users u ON f.user_id = u.user_id
        WHERE u.role = 'farmer' AND f.farmer_id = ?
    `;
    
    db.query(farmerQuery, [farmerId], (err, farmerResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch farmer details' });
        }
        
        if (farmerResults.length === 0) {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        
        const farmer = farmerResults[0];
        
        // Get farmer's products
        const productsQuery = `
            SELECT 
                p.product_id,
                p.product_name,
                p.category,
                p.price,
                p.quantity,
                p.image,
                p.created_at
            FROM products p
            WHERE p.farmer_id = ?
            ORDER BY p.created_at DESC
        `;
        
        db.query(productsQuery, [farmerId], (err, productResults) => {
            if (err) {
                console.error('Products query error:', err);
                // If products table doesn't exist or has error, continue without products
                res.json({
                    ...farmer,
                    products: []
                });
                return;
            }
            
            // Return farmer data with products
            res.json({
                ...farmer,
                products: productResults || []
            });
        });
    });
});

// Debug endpoint to test products table
app.get('/debug-products', (req, res) => {
    console.log('Testing products table...');
    
    // Test if products table exists
    db.query('SHOW TABLES LIKE "products"', (err, results) => {
        if (err) {
            console.error('Error checking products table:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        if (results.length === 0) {
            return res.json({ message: 'Products table does not exist' });
        }
        
        // Get table structure
        db.query('DESCRIBE products', (err, structure) => {
            if (err) {
                return res.status(500).json({ error: 'Error getting table structure', details: err.message });
            }
            
            // Get all products
            db.query('SELECT * FROM products LIMIT 5', (err, products) => {
                if (err) {
                    return res.status(500).json({ error: 'Error getting products', details: err.message });
                }
                
                res.json({
                    tableExists: true,
                    structure: structure,
                    sampleProducts: products
                });
            });
        });
    });
});

// Enhanced Learning ML System with Internet Data
const questionHistory = [];
const responsePatterns = new Map();
const internetDataCache = new Map();
const learningMetrics = {
    totalQuestions: 0,
    successfulInteractions: 0,
    failedInteractions: 0,
    learningRate: 0,
    internetQueries: 0,
    cacheHits: 0,
    confidence: 0,
    avgProcessingTime: 0,
    kinyarwandaQuestions: 0,
    englishQuestions: 0,
    contextStats: {},
    patternEffectiveness: 0,
    lastUpdated: new Date().toISOString()
};

// Internet data sources for farming information
const internetSources = {
    weather: 'https://api.openweathermap.org/data/2.5/weather?q=Kigali,RW&appid=demo',
    marketPrices: 'https://worldbank.org/api/v1/country/RWA/indicator/FP.CPI.TOTL.ZG?format=json',
    farmingNews: 'https://newsapi.org/v2/everything?q=farming+Rwanda&apiKey=demo',
    cropCalendar: 'https://api.fao.org/faostat/v1/en/data/QC/FAO/Area/1920?format=json'
};

// Initialize learning patterns with internet data
const initializeLearningPatterns = () => {
    // Price-related patterns
    responsePatterns.set('price', [
        { keywords: ['price', 'cost', 'igiciro', 'amafaranga', 'value', 'worth', 'ibiraranguwo', 'ubworozi'], responses: ['Our prices vary by season and product quality. Contact farmers directly for current pricing.', 'Igiciro cyarihwa nigihe igihe na season na quality ya product. Twandikire abafarmero kugirango amakuru y\'ikiciro.'] },
        { keywords: ['expensive', 'ihari', 'gato', 'kibiri', 'bikuruye', 'bikennye'], responses: ['Some premium products may cost more due to quality and farming methods.', 'Bimwe muri products zimwe bishashwe ku kudura no kubwira ubuziranwe.'] }
    ]);
    
    // Product-related patterns
    responsePatterns.set('product', [
        { keywords: ['product', 'available', 'ibikomoka', 'ibikura', 'available', 'what', 'available', 'ibintu', 'imbuto', 'ibikorwa'], responses: ['We have a variety of fresh products available including vegetables, fruits, and grains. Check farmer profiles for specific items.', 'Dufite ibintu byinshi bita harimo nka vegetables, fruits, na grains. Reba amaprofayili ya buri mweru.'] },
        { keywords: ['vegetable', 'imbuto', 'fruits', 'ibiribwa', 'ibyimwa', 'imboga', 'imbuto y\'imbuto'], responses: ['Our farmers offer fresh seasonal vegetables and fruits grown locally.', 'Abafarmero bacu imbuto nshya imbuto zirihwa z\'umwaka.'] }
    ]);
    
    // Farmer-related patterns
    responsePatterns.set('farmer', [
        { keywords: ['farmer', 'contact', 'abafarmero', 'find', 'shaka', 'ubuhinzi', 'uhinzi', 'abavumbi', 'aburimyi'], responses: ['You can contact farmers through their profiles or use the messaging system on their product pages.', 'Ushobora kumurongo w\'abafarmero muri profile zawu cyangwa ukoreshe messaging system ku mbuga ya product.'] },
        { keywords: ['best', 'recommend', 'bihindagwa', 'top', 'nziza', 'byiza', 'byiza cyane', 'rebera'], responses: ['For the best recommendations, I suggest looking at farmers near your location who have high ratings and good reviews.', 'Kugirango abafarmero baturiye hafi kandi w\'ibitegezo niniyagira hamwe na rating nziza na reviews nziza.'] }
    ]);
    
    // Delivery patterns
    responsePatterns.set('delivery', [
        { keywords: ['delivery', 'shipping', 'akagaburira', 'transport', 'kugaburira', 'kwohereza', 'kwitwara', 'akaburiro'], responses: ['Delivery options depend on your location and the farmer\'s availability. Most farmers offer local delivery within major cities.', 'Amahitamo yo akagaburira agenda ku location yawe na uwihangwe w\'abafarmero. Benshi muri major cities bakora akagaburira hafi.'] }
    ]);
    
    // Quality patterns
    responsePatterns.set('quality', [
        { keywords: ['organic', 'quality', 'imyorohere', 'fresh', 'natural', 'kigihanga', 'imyunyu-ngugu', 'bikire', 'bimaze', 'umusaruro'], responses: ['Many of our farmers practice organic farming methods. Check individual farmer profiles for their specific certifications and practices.', 'Benshi muri bafarmero bensha kurima organike. Reba amaprofayili ya buri mweru kugirango ibyangombwa na certifications.'] }
    ]);
    
    // Seasonal patterns
    responsePatterns.set('season', [
        { keywords: ['season', 'when', 'igihe', 'time', 'igihe cyo', 'igihe gito', 'umwaka', 'igihe cy\'umwaka', 'season'], responses: ['Different products are available in different seasons. Currently, we have fresh vegetables and year-round greenhouse crops.', 'Ibintu bitandukanya muri season zitandukanye. Noneha, dufite vegetables n\'ibimwa byumva mu greenhouse.'] }
    ]);
    
    // Help patterns (new for Kinyarwanda)
    responsePatterns.set('help', [
        { keywords: ['help', 'ufasha', 'tubafasha', 'fasa', 'mbufashije', 'ndashaka ufasha', 'ufashije', 'gufasha'], responses: ['I can help you with finding farmers, products, and agricultural information. Please tell me what you need assistance with.', 'Nshobora kugufasha kubona abafarmero, ibikomoka, n\'amakuru y\'ubuhinzi. Wibagireho ibyo ushaka kufashwa.'] }
    ]);
    
    // How-to patterns (new for Kinyarwanda)
    responsePatterns.set('how', [
        { keywords: ['how', 'wige', 'uburyo', 'nibwo', 'akaburi', 'nigute', 'urabanza', 'urakora', 'gukora'], responses: ['To help you with how-to questions, please be specific about what action you want to take.', 'Kugirango ndakubashe kubwira uburyo, wibagireho ibyo ushaka gukora byimazeyo.'] }
    ]);
    
    // What patterns (new for Kinyarwanda)
    responsePatterns.set('what', [
        { keywords: ['what', 'iki', 'ni iki', 'ibiki', 'nibi', 'byo', 'ni ibiki', 'icyo'], responses: ['For what-is questions, I can help you understand our products, services, and farming practices.', 'Kubijambo bya ni iki, nshobora kugufasha kumenya ibikomoka, serivisi, n\'ubuhinzi.'] }
    ]);
    
    // Where patterns (new for Kinyarwanda)
    responsePatterns.set('where', [
        { keywords: ['where', 'he', 'ihe', 'hehe', 'ahari', 'ahari hatandukanye', 'kubona'], responses: ['You can find products on our platform and contact farmers directly.', 'Washobora kubona ibikomoka ku mbuga yacu no kumurongo w\'abafarmero.'] }
    ]);
    
    // Buy patterns (new for Kinyarwanda)
    responsePatterns.set('buy', [
        { keywords: ['buy', 'purchase', 'kugura', 'gura', 'kugura', 'kugurisha', 'kuguriraho', 'kuvana'], responses: ['For buying assistance, I can help you find products and understand the purchasing process.', 'Muri kugura, nshobora kugufasha kubona ibikomoka no kumenya process yo kugura.'] }
    ]);
    
    // NEW: Planting/Farming Season patterns (Teaching the model)
    responsePatterns.set('planting', [
        { keywords: ['plant', 'planting', 'season', 'tomatoes', 'when', 'timing', 'tima', 'gukora', 'ubuhinzi'], responses: ['The best time to plant tomatoes is during the dry season (June-August) for optimal growth. Start seeds indoors 6-8 weeks before transplanting.', 'Igihe cyiza cyo guhinga tomati ni muri season yiza idahinduka. Tangira imbuto mu rugo mbere yiminsi 6-8 yo guhindura aho bihingwa.'] },
        { keywords: ['harvest', 'collect', 'gukura', 'gusukura', 'umusaruro', 'timing'], responses: ['Most vegetables are ready for harvest 60-90 days after planting. Check for full color and firmness.', 'Imbuto zikunze kugurwa iminsi 60-90 nyuma yo guhinga. Reba ibara nukuba zikomeye.'] }
    ]);
    
    // NEW: Market Price patterns (Teaching the model)
    responsePatterns.set('market', [
        { keywords: ['market', 'price', 'sell', 'cost', 'isoko', 'igiciro', 'gucururiza', 'value'], responses: ['Market prices vary by season. Organic tomatoes typically sell for 500-800 RWF per kg, while conventional ones sell for 300-500 RWF per kg.', 'Amacuru muri isoko ahinduka na season. Tomati zikungahanga zikurwa hagati ya 500-800 RWF/kg, tomati zisanzwe zigurwa hagati ya 300-500 RWF/kg.'] },
        { keywords: ['organic', 'premium', 'quality', 'kigihanga', 'nziza', 'value'], responses: ['Organic products typically command 20-30% higher prices due to their quality and certification requirements.', 'Productions zikungahanga zigurwa amafaranga arenga 20-30% menshi kubera ubuziranze nibyangombwa byakenerwa.'] }
    ]);
    
    // NEW: Weather patterns (Teaching the model)
    responsePatterns.set('weather', [
        { keywords: ['weather', 'rain', 'sun', 'temperature', 'imvura', 'izuba', 'ubushyuhe', 'climate'], responses: ['Rwanda has two rainy seasons (March-May and September-November) and two dry seasons. Plan your farming accordingly.', 'Rwanda ifise imvira ebyiri (Mutarama-Gicurasi na Nzeri-Gicurasi) nigihe ebyiri cyiza gihinga. Gira plan yo guhinga ukurikije ibi.'] },
        { keywords: ['irrigation', 'water', 'amazi', 'gukanya', 'mitungo'], responses: 'Drip irrigation is most efficient for vegetable farming. Water plants early morning or late evening to reduce evaporation.' }
    ]);
};

// Fetch real-time data from internet sources
const fetchInternetData = async (sourceType) => {
    const cacheKey = `${sourceType}_${new Date().toISOString().split('T')[0]}`;
    
    // Check cache first
    if (internetDataCache.has(cacheKey)) {
        learningMetrics.cacheHits++;
        return internetDataCache.get(cacheKey);
    }
    
    try {
        const response = await axios.get(internetSources[sourceType], {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        learningMetrics.internetQueries++;
        
        // Cache the data
        internetDataCache.set(cacheKey, response.data);
        
        // Clean old cache entries (keep only last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        for (const [key, value] of internetDataCache) {
            const keyDate = new Date(key.split('_')[1]);
            if (keyDate < sevenDaysAgo) {
                internetDataCache.delete(key);
            }
        }
        
        return response.data;
    } catch (error) {
        console.log(`Internet fetch failed for ${sourceType}:`, error.message);
        return null;
    }
};

// Process internet data for learning
const processInternetData = (data, sourceType) => {
    if (!data) return null;
    
    switch (sourceType) {
        case 'weather':
            return {
                type: 'weather',
                data: {
                    temperature: data.main?.temp,
                    humidity: data.main?.humidity,
                    description: data.weather?.[0]?.description,
                    location: data.name
                },
                insights: generateWeatherInsights(data)
            };
        
        case 'marketPrices':
            return {
                type: 'marketPrices',
                data: data[1]?.slice(-5), // Last 5 years of data
                insights: generatePriceInsights(data)
            };
        
        case 'farmingNews':
            return {
                type: 'farmingNews',
                data: data.articles?.slice(0, 10), // Top 10 articles
                insights: generateNewsInsights(data.articles)
            };
        
        case 'cropCalendar':
            return {
                type: 'cropCalendar',
                data: data.data?.slice(-20), // Recent crop data
                insights: generateCropInsights(data.data)
            };
        
        default:
            return null;
    }
};

// Generate insights from weather data
const generateWeatherInsights = (weatherData) => {
    const insights = [];
    const temp = weatherData.main?.temp;
    const humidity = weatherData.main?.humidity;
    
    if (temp > 25) {
        insights.push('High temperatures - good for heat-resistant crops like tomatoes and peppers');
    } else if (temp < 15) {
        insights.push('Cooler temperatures - ideal for leafy greens and root vegetables');
    }
    
    if (humidity > 70) {
        insights.push('High humidity - watch for fungal diseases, ensure good ventilation');
    } else if (humidity < 40) {
        insights.push('Low humidity - increase irrigation for moisture-loving crops');
    }
    
    return insights;
};

// Generate insights from market price data
const generatePriceInsights = (priceData) => {
    const insights = [];
    const recentPrices = priceData?.slice(-3);
    
    if (recentPrices && recentPrices.length > 1) {
        const trend = recentPrices[recentPrices.length - 1].value - recentPrices[0].value;
        if (trend > 0) {
            insights.push('Market prices trending upward - good time to sell premium products');
        } else {
            insights.push('Market prices stable or declining - focus on volume sales');
        }
    }
    
    insights.push('Current market conditions favor organic and locally grown products');
    return insights;
};

// Generate insights from farming news
const generateNewsInsights = (articles) => {
    const insights = [];
    const keywords = ['organic', 'sustainable', 'technology', 'climate', 'market'];
    
    articles?.forEach(article => {
        const title = article.title?.toLowerCase() || '';
        keywords.forEach(keyword => {
            if (title.includes(keyword)) {
                insights.push(`Recent focus on ${keyword} in farming - consider adapting practices`);
            }
        });
    });
    
    return insights;
};

// Generate insights from crop calendar data
const generateCropInsights = (cropData) => {
    const insights = [];
    
    // Analyze crop trends
    insights.push('Seasonal planting calendars show optimal times for different crops');
    insights.push('Crop rotation practices improve soil health and yields');
    insights.push('Drought-resistant varieties gaining popularity');
    
    return insights;
};

// Enhanced learning function with comprehensive data capture
const learnFromInteractionEnhanced = async (question, interactionData, rating = null) => {
    const startTime = Date.now();
    const learningId = `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store comprehensive interaction
    const baseInteraction = {
        learningId: learningId,
        question: question.toLowerCase(),
        questionOriginal: interactionData.questionOriginal,
        questionWords: interactionData.questionWords,
        questionAnalysis: interactionData.questionAnalysis,
        context: interactionData.context,
        detectedLanguage: interactionData.detectedLanguage,
        parameterLanguage: interactionData.parameterLanguage,
        rating: rating,
        timestamp: interactionData.timestamp,
        userAgent: interactionData.userAgent,
        ip: interactionData.ip,
        sessionId: interactionData.sessionId,
        internetData: null,
        processingTime: 0
    };
    
    // Fetch relevant internet data based on question keywords
    const questionWords = question.toLowerCase().split(' ');
    let internetInsights = [];
    let internetQueries = 0;
    
    // Comprehensive keyword-based internet data fetching
    const internetDataChecks = [
        {
            keywords: ['weather', 'rain', 'temperature', 'climate', 'imvura', 'ubushyuhe', 'sunny', 'cold', 'hot'],
            type: 'weather',
            fetch: () => fetchInternetData('weather')
        },
        {
            keywords: ['price', 'cost', 'market', 'igiciro', 'isoko', 'expensive', 'cheap', 'value'],
            type: 'marketPrices',
            fetch: () => fetchInternetData('marketPrices')
        },
        {
            keywords: ['farming', 'agriculture', 'crop', 'ubuhinzi', 'imbuto', 'planting', 'harvest', 'season'],
            type: 'farmingNews',
            fetch: () => fetchInternetData('farmingNews')
        },
        {
            keywords: ['calendar', 'season', 'time', 'igihe', 'timing', 'when', 'schedule'],
            type: 'cropCalendar',
            fetch: () => fetchInternetData('cropCalendar')
        }
    ];
    
    // Execute relevant internet data fetches
    for (const check of internetDataChecks) {
        if (questionWords.some(word => check.keywords.includes(word))) {
            internetQueries++;
            try {
                const data = await check.fetch();
                if (data) {
                    const processed = processInternetData(data, check.type);
                    internetInsights.push(...(processed.insights || []));
                    baseInteraction.internetData = processed.data;
                }
            } catch (error) {
                console.error(`Internet data fetch error for ${check.type}:`, error.message);
                baseInteraction.internetData = { error: check.type, message: error.message };
            }
        }
    }
    
    // Enhanced pattern analysis
    const matchedPatterns = [];
    let totalPatternScore = 0;
    
    // Find matching patterns with enhanced scoring
    for (const [category, patterns] of responsePatterns) {
        for (const pattern of patterns) {
            const matchCount = pattern.keywords.filter(keyword => 
                questionWords.some(word => word.includes(keyword))
            ).length;
            
            if (matchCount > 0) {
                const score = matchCount / pattern.keywords.length;
                matchedPatterns.push({ 
                    category, 
                    pattern, 
                    matchCount, 
                    score,
                    confidence: Math.min(score * 100, 100)
                });
                totalPatternScore += score;
            }
        }
    }
    
    // Calculate learning metrics
    const processingTime = Date.now() - startTime;
    const learningScore = totalPatternScore + (internetInsights.length * 0.2) + (rating ? rating * 0.1 : 0);
    const confidence = Math.min(learningScore, 1.0);
    
    // Update pattern effectiveness based on success
    matchedPatterns.forEach(({ category, pattern, score }) => {
        if (!responsePatterns.has(category)) {
            responsePatterns.set(category, responsePatterns.get(category));
        }
        
        const patterns = responsePatterns.get(category);
        const patternIndex = patterns.findIndex(p => p.keywords.some(k => 
            questionWords.some(w => w.includes(k))
        ));
        
        if (patternIndex !== -1) {
            // Move successful patterns to top based on score
            const pattern = patterns[patternIndex];
            patterns.splice(patternIndex, 1);
            patterns.unshift(pattern);
            
            // Update pattern effectiveness
            pattern.effectiveness = (pattern.effectiveness || 0) + score;
            pattern.usageCount = (pattern.usageCount || 0) + 1;
        }
    });
    
    // Update comprehensive learning metrics
    learningMetrics.totalQuestions++;
    learningMetrics.internetQueries += internetQueries;
    learningMetrics.learningRate = learningScore;
    learningMetrics.confidence = confidence;
    learningMetrics.avgProcessingTime = (learningMetrics.avgProcessingTime + processingTime) / 2;
    
    // Store interaction with full learning data
    baseInteraction.matchedPatterns = matchedPatterns;
    baseInteraction.internetInsights = internetInsights;
    baseInteraction.processingTime = processingTime;
    baseInteraction.learningScore = learningScore;
    baseInteraction.confidence = confidence;
    baseInteraction.internetQueries = internetQueries;
    
    // Keep only last 500 interactions in memory (increased for better learning)
    if (questionHistory.length > 500) {
        questionHistory.splice(0, questionHistory.length - 500);
    }
    
    return { 
        matchedPatterns, 
        internetInsights, 
        learningScore,
        confidence,
        processingTime,
        internetQueries,
        learningId,
        improvement: learningScore > 0.7 ? 'Excellent learning with high confidence' : 
                   learningScore > 0.5 ? 'Good learning with moderate confidence' : 
                   learningScore > 0.3 ? 'Basic learning with low confidence' : 'Learning needs improvement'
    };
};

// Update learning metrics from interactions
const updateLearningMetrics = (interaction) => {
    if (interaction.success) {
        learningMetrics.successfulInteractions = (learningMetrics.successfulInteractions || 0) + 1;
    } else {
        learningMetrics.failedInteractions = (learningMetrics.failedInteractions || 0) + 1;
    }
    
    // Update language statistics
    if (interaction.detectedLanguage === 'rw') {
        learningMetrics.kinyarwandaQuestions = (learningMetrics.kinyarwandaQuestions || 0) + 1;
    } else {
        learningMetrics.englishQuestions = (learningMetrics.englishQuestions || 0) + 1;
    }
    
    // Update context statistics
    const context = interaction.context || 'general';
    learningMetrics.contextStats = learningMetrics.contextStats || {};
    learningMetrics.contextStats[context] = (learningMetrics.contextStats[context] || 0) + 1;
    
    // Update pattern effectiveness
    if (interaction.learning && interaction.learning.patternsMatched > 0) {
        learningMetrics.patternEffectiveness = (learningMetrics.patternEffectiveness || 0) + 
            (interaction.learning.patternsMatched * 0.1);
    }
};

const generateIntelligentResponse = async (question, language = 'en') => {
    const questionWords = question.toLowerCase().split(' ');
    const lowerQuestion = question.toLowerCase();
    // ... rest of the code remains the same ...
    
    // Check for exact matches in history
    const exactMatch = questionHistory.find(h => 
        h.question === lowerQuestion && h.rating && h.rating > 3
    );
    
    if (exactMatch) {
        return exactMatch.response;
    }
    
    // Enhanced question analysis for better matching
    const questionAnalysis = analyzeQuestionIntent(question, questionWords);
    
    // Use detected language if available
    const responseLanguage = questionAnalysis.language || language;
    
    // Find best matching pattern with enhanced scoring
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [category, patterns] of responsePatterns) {
        for (const pattern of patterns) {
            // Enhanced keyword matching with partial matches and synonyms
            const keywordScore = calculateKeywordMatch(questionWords, pattern.keywords);
            const intentScore = calculateIntentMatch(questionAnalysis, category);
            
            // Combined scoring with intent analysis
            const score = (keywordScore * 0.7) + (intentScore * 0.3) + (Math.random() * 0.1);
            
            if (score > bestScore && score > 0.3) { // Minimum threshold
                bestScore = score;
                bestMatch = { category, pattern, score };
            }
        }
    }
    
    if (bestMatch) {
        // Use learned response or pattern response
        const responses = bestMatch.pattern.responses;
        const responseIndex = responseLanguage === 'rw' ? 1 : 0;
        let baseResponse = responses[responseIndex] || responses[0];
        
        // Add internet insights if available
        const recentInteraction = questionHistory[questionHistory.length - 1];
        if (recentInteraction?.internetData && recentInteraction.internetData.length > 0) {
            const insight = recentInteraction.internetData[0];
            baseResponse += ` ${insight}`;
        }
        
        return baseResponse;
    }
    
    // Enhanced fallback with better question understanding
    return generateContextualFallback(question, questionAnalysis, responseLanguage);
};

// Enhanced question intent analysis
const analyzeQuestionIntent = (question, questionWords) => {
    const intent = {
        type: 'unknown',
        urgency: 'low',
        specificity: 'low',
        context: 'general',
        language: 'en'
    };
    
    // Enhanced language detection - more comprehensive Kinyarwanda word list
    const kinyarwandaWords = [
        // Question words (exact matches only)
        'ni', 'wige', 'he', 'ryari', 'kuba', 'ushobora', 'ufasha', 'tubafasha', 'iki', 'ibiki', 'icyo', 'byo', 'nibi', 'nigute', 'niba', 'nibaza', 'urabaza', 'utazi',
        // Common words (exact matches only)
        'igiciro', 'amafaranga', 'kugura', 'gura', 'kubona', 'abafarmero', 'ibikomoka', 'imbuto', 'ibiribwa', 'ubuhinzi', 'akagaburira',
        // Verbs and actions (exact matches only)
        'ufasha', 'tubafasha', 'fasa', 'mbufashije', 'gufasha', 'kugura', 'gura', 'kugurisha', 'kuvana', 'kurimbura', 'kureba', 'kumenya', 'kubwira', 'gukora', 'gushaka', 'kubona',
        // Descriptors (exact matches only)
        'nziza', 'byiza', 'rebera', 'bikennye', 'bikuruye', 'bimaze', 'bikire', 'kigihanga', 'imyorohere', 'bikora', 'bibi', 'bimwe',
        // Location and time (exact matches only)
        'ahari', 'ryari', 'igihe', 'nonaha', 'vuba', 'hano', 'hafi', 'kure', 'mu', 'ku', 'wa',
        // Products and farming (exact matches only)
        'imbuto', 'imboga', 'ibikomoka', 'ibikura', 'ibintu', 'ibikorwa', 'ikawa', 'umuneke', 'tomati', 'karoti', 'ibitoki', 'umuceri', 'inyama', 'amata',
        // Quality and characteristics (exact matches only)
        'imyunyu-ngugu', 'kigihanga', 'imyorohere', 'bikire', 'bimaze', 'umusaruro', 'ubuziranze', 'gusukura', 'gukunda',
        // Communication (exact matches only)
        'kumurongo', 'twandikire', 'tandikana', 'kubwiriza', 'kumva', 'vuga', 'saba', 'ubwira',
        // General words (exact matches only)
        'yego', 'oya', 'nta', 'nka', 'kandi', 'cyane', 'gato', 'kinini', 'buri', 'amaze', 'mazeza', 'komeza', 'subiramo', 'nibyo',
        // Personal pronouns (exact matches only)
        'njye', 'we', 'yewe', 'bawe', 'twe', 'bo', 'abo', 'iyi', 'uri', 'turi', 'buri',
        // Common phrases (exact matches only)
        'murakoze', 'amakuru', 'meze', 'wige', 'uri', 'wari', 'uzaba', 'uzaba', 'urakoze', 'wakora', 'wabaye',
        // Additional common words
        'sawa', 'yego', 'nta', 'bibazo', 'ikibazo', 'ubuzima', 'akazi', 'ishuri', 'umuryango', 'inzu', 'umuhanda',
        // Numbers and quantities
        'rimwe', 'ebiri', 'eshatu', 'ine', 'itanu', 'gatandatu', 'karindwi', 'izana', 'icyenda', 'cumi',
        // Time related
        'uyu', 'munsi', 'ejo', 'kare', 'nimugoroba', 'nimuganga', 'ejenosi', 'saa', 'umunota',
        // Common verbs
        'inja', 'vuga', 'kora', 'genda', 'injira', 'sohoka', 'fata', 'tanga', 'teka', 'soma', 'andika',
        // Food and daily life
        'imboga', 'ifungure', 'inyama', 'amafu', 'amata', 'umuceri', 'umutsima', 'isosi', 'ikivuguto',
        // Nature and environment
        'umusanga', 'ishyamba', 'umugezi', 'inzu', 'umurima', 'umudugudu', 'umujyi', 'igihugu',
        // Family and people
        'umuryango', 'ababyeyi', 'abana', 'umukobwa', 'umuhungu', 'umugabo', 'umugore', 'umusaza', 'umukuru'
    ];
    
    // Count Kinyarwanda words for better detection - use exact matching only
    const kinyarwandaCount = questionWords.filter(word => 
        kinyarwandaWords.includes(word)
    ).length;
    
    // If more than 1 Kinyarwanda word detected, classify as Kinyarwanda
    if (kinyarwandaCount >= 1) {
        intent.language = 'rw';
    }
    
    // Question type detection (enhanced for Kinyarwanda)
    if (question.includes('how') || question.includes('wige') || question.includes('uburyo') || question.includes('nigute') || question.includes('akaburi')) {
        intent.type = 'how_to';
    } else if (question.includes('what') || question.includes('iki') || question.includes('ni iki') || question.includes('ibiki') || question.includes('icyo') || question.includes('byo') || question.includes('nibi')) {
        intent.type = 'what_is';
    } else if (question.includes('where') || question.includes('he') || question.includes('ihe') || question.includes('hehe') || question.includes('ahari')) {
        intent.type = 'where_find';
    } else if (question.includes('when') || question.includes('ryari') || question.includes('igihe') || question.includes('igihe cyo')) {
        intent.type = 'when_time';
    } else if (question.includes('why') || question.includes('kuba') || question.includes('ite') || question.includes('kuba')) {
        intent.type = 'why_reason';
    } else if (question.includes('can') || question.includes('ushobora') || question.includes('wibashoboka') || question.includes('bishoboka')) {
        intent.type = 'can_i';
    } else if (question.includes('help') || question.includes('ufasha') || question.includes('tubafasha') || question.includes('fasa') || question.includes('mbufashije') || question.includes('gufasha')) {
        intent.type = 'help_request';
    }
    
    // Urgency detection (enhanced for Kinyarwanda)
    if (questionWords.some(word => ['urgent', 'now', 'immediately', 'hanya', 'nonaha', 'burundu', 'burundu', 'akanya', 'vuba'].includes(word))) {
        intent.urgency = 'high';
    } else if (questionWords.some(word => ['soon', 'quickly', 'vuba', 'biga', 'akanya', 'vuba'].includes(word))) {
        intent.urgency = 'medium';
    }
    
    // Specificity detection (enhanced for Kinyarwanda)
    const specificTerms = ['tomato', 'carrot', 'coffee', 'banana', 'tomatoes', 'imbuto', 'ikawa', 'umuneke', 'tomati', 'karoti', 'ibikomoka', 'imboga'];
    if (questionWords.some(word => specificTerms.some(term => word.includes(term)))) {
        intent.specificity = 'high';
    } else if (questionWords.some(word => ['product', 'crop', 'item', 'ibikomoka', 'imbuto', 'ibintu', 'ibikorwa'].includes(word))) {
        intent.specificity = 'medium';
    }
    
    // Context detection (enhanced for Kinyarwanda)
    if (questionWords.some(word => ['price', 'cost', 'igiciro', 'amafaranga', 'ibiraranguwo', 'ubworozi'].includes(word))) {
        intent.context = 'pricing';
    } else if (questionWords.some(word => ['buy', 'purchase', 'kugura', 'gura', 'kugurisha', 'kuvana', 'gura'].includes(word))) {
        intent.context = 'buying';
    } else if (questionWords.some(word => ['sell', 'market', 'kwica', 'isoko', 'gucururiza', 'kugurisha'].includes(word))) {
        intent.context = 'selling';
    } else if (questionWords.some(word => ['contact', 'reach', 'communication', 'kumurongo', 'twandikire', 'kumurongo', 'tandikana'].includes(word))) {
        intent.context = 'contact';
    }
    
    return intent;
};

// Enhanced keyword matching with synonyms and partial matches
const calculateKeywordMatch = (questionWords, patternKeywords) => {
    let matchCount = 0;
    
    for (const keyword of patternKeywords) {
        // Exact match
        if (questionWords.includes(keyword)) {
            matchCount += 1;
        }
        // Partial match
        else if (questionWords.some(word => word.includes(keyword) || keyword.includes(word))) {
            matchCount += 0.7;
        }
        // Synonym matching
        else {
            const synonyms = getSynonyms(keyword);
            if (synonyms.some(synonym => questionWords.includes(synonym))) {
                matchCount += 0.5;
            }
        }
    }
    
    return matchCount / patternKeywords.length;
};

// Intent matching for better context understanding
const calculateIntentMatch = (questionAnalysis, category) => {
    const intentScores = {
        'price': questionAnalysis.context === 'pricing' ? 0.8 : 0.2,
        'product': questionAnalysis.specificity === 'high' ? 0.7 : 0.3,
        'farmer': questionAnalysis.context === 'contact' ? 0.8 : 0.4,
        'delivery': questionAnalysis.type === 'where_find' ? 0.6 : 0.3,
        'quality': questionAnalysis.specificity === 'high' ? 0.6 : 0.4,
        'season': questionAnalysis.type === 'when_time' ? 0.8 : 0.3,
        'help': questionAnalysis.type === 'help_request' ? 0.9 : 0.2,
        'how': questionAnalysis.type === 'how_to' ? 0.9 : 0.2,
        'what': questionAnalysis.type === 'what_is' ? 0.9 : 0.2,
        'where': questionAnalysis.type === 'where_find' ? 0.9 : 0.2,
        'buy': questionAnalysis.context === 'buying' ? 0.9 : 0.3
    };
    
    return intentScores[category] || 0.3;
};

// Synonym dictionary for better matching
const getSynonyms = (keyword) => {
    const synonyms = {
        'price': ['cost', 'igiciro', 'amafaranga', 'value', 'worth', 'ibiraranguwo', 'ubworozi'],
        'product': ['item', 'good', 'ibikomoka', 'imbuto', 'commodity', 'ibintu', 'ibikorwa', 'imboga'],
        'farmer': ['grower', 'producer', 'abafarmero', 'cultivator', 'abavumbi', 'aburimyi'],
        'delivery': ['shipping', 'transport', 'akagaburira', 'distribution', 'kugaburira', 'kwohereza', 'kwitwara'],
        'quality': ['standard', 'grade', 'imyorohere', 'condition', 'kigihanga', 'imyunyu-ngugu', 'bikire', 'bimaze'],
        'season': ['time', 'period', 'igihe', 'seasonal', 'timing', 'igihe cyo', 'igihe gito', 'umwaka'],
        'organic': ['natural', 'chemical-free', 'kigihanga', 'eco-friendly', 'kigihanga', 'imyunyu-ngugu'],
        'available': ['in stock', 'ready', 'kiboneka', 'accessible', 'bikora', 'bikumbi'],
        'contact': ['reach', 'communicate', 'kumurongo', 'message', 'twandikire', 'tandikana', 'kumurongo'],
        'best': ['top', 'quality', 'nziza', 'premium', 'excellent', 'byiza', 'byiza cyane', 'rebera'],
        'help': ['assist', 'support', 'ufasha', 'tubafasha', 'fasa', 'mbufashije', 'gufasha'],
        'how': ['method', 'way', 'wige', 'uburyo', 'nibwo', 'akaburi', 'nigute'],
        'what': ['which', 'iki', 'ni iki', 'ibiki', 'nibi', 'byo', 'icyo'],
        'where': ['location', 'he', 'ihe', 'hehe', 'ahari', 'ahari hatandukanye'],
        'buy': ['purchase', 'kugura', 'gura', 'kugurisha', 'kuguriraho', 'kuvana']
    };
    
    return synonyms[keyword] || [];
};

// Enhanced contextual fallback responses
const generateContextualFallback = (question, questionAnalysis, language) => {
    const { type, context, specificity } = questionAnalysis;
    
    if (language === 'rw') {
        switch (type) {
            case 'help_request':
                return 'Nshobora kugufasha! Wibagireho ibyo ushaka kumenya byimazeyo kugirango nkubashe gutanga amakuru azwi neza.';
            case 'how_to':
                return 'Kugirango ndakubashe kubwira uburyo, wibagireho ibyo ushaka gukora byimazeyo - nka kugura, kujya no kumurongo w\'abafarmero.';
            case 'what_is':
                return 'Yandikise ibyo ushaka kumenya byimazeyo. Nshobora kugufasha kumenya ibikomoka, ibiciro, n\'abafarmero.';
            case 'where_find':
                return 'Washobora kubona ibikomoka ku mbuga yacu, cyangwa ukanda kumurongo w\'abafarmero hafi yawe.';
            case 'when_time':
                return 'Igihe kigira igihugu n\'ibyo wifuza. Wibagireho ibyo ushaga kumenya.';
            default:
                return 'Nshobora kugufasha kubona abafarmero, ibikomoka, n\'amakuru y\'ubuhinzi. Wibagireho ibyo ushaka kureba neza.';
        }
    } else {
        switch (type) {
            case 'help_request':
                return 'I can definitely help you! Please tell me specifically what you need assistance with - whether it\'s finding products, contacting farmers, or getting farming information.';
            case 'how_to':
                return 'To help you with "how to" questions, please be specific about what action you want to take - such as how to buy, how to contact farmers, or how to find specific products.';
            case 'what_is':
                return 'For "what is" questions, I can help you understand our products, services, farming practices, and pricing. What specifically would you like to know about?';
            case 'where_find':
                return 'You can find products on our platform, contact farmers directly, or visit local markets. What are you looking for specifically?';
            case 'when_time':
                return 'Timing depends on what you need. For seasonal products, market availability, or delivery times, please specify what you\'re asking about.';
            default:
                if (context === 'pricing') {
                    return 'For pricing information, I can help you understand current market rates, product costs, and factors affecting prices. What specific pricing information do you need?';
                } else if (context === 'buying') {
                    return 'For buying assistance, I can help you find products, contact farmers, and understand the purchasing process. What would you like to buy?';
                } else if (context === 'contact') {
                    return 'For contact information, I can help you reach farmers, find contact details, and understand communication methods. Who do you want to contact?';
                } else {
                    return 'I can help you with finding farmers, products, and agricultural information. Please be more specific about what you need assistance with.';
                }
        }
    }
};

// Enhanced Learning ML endpoint with Internet Data
app.post('/ml/ask-question', async (req, res) => {
    const { question, context, language = 'en', rating } = req.body;
    
    if (!question || !question.trim()) {
        return res.status(400).json({ 
            success: false, 
            error: 'Question is required' 
        });
    }
    
    try {
        // Analyze question to detect language automatically
        const questionWords = question.toLowerCase().split(' ');
        const questionAnalysis = analyzeQuestionIntent(question, questionWords);
        
        // Force use detected language for Kinyarwanda questions
        const detectedLanguage = questionAnalysis.language === 'rw' ? 'rw' : language;
        
        // Capture user interaction data for learning
        const interactionData = {
            question: question.toLowerCase(),
            questionOriginal: question,
            questionWords: questionWords,
            questionAnalysis: questionAnalysis,
            context: context || 'general',
            detectedLanguage: detectedLanguage,
            parameterLanguage: language,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            sessionId: req.headers['x-session-id'] || 'anonymous'
        };
        
        // Learn from this interaction with internet data
        const learning = await learnFromInteractionEnhanced(question, interactionData, rating);
        
        // Generate intelligent response with internet insights using detected language
        const response = await generateIntelligentResponse(question, detectedLanguage);
        
        // Store the enhanced interaction with full learning data
        const fullInteraction = {
            ...interactionData,
            response: response,
            rating: rating,
            learning: {
                patternsMatched: learning.matchedPatterns.length,
                internetInsights: learning.internetInsights.length,
                learningScore: learning.learningScore,
                improvement: learning.improvement,
                confidence: learning.confidence
            },
            internetData: learning.internetInsights,
            responseLanguage: detectedLanguage,
            processingTime: learning.processingTime,
            success: true
        };
        
        questionHistory.push(fullInteraction);
        
        // Update learning metrics
        updateLearningMetrics(fullInteraction);
        
        res.json({ 
            success: true, 
            data: { 
                response: response,
                timestamp: new Date().toISOString(),
                language: detectedLanguage,
                detectedLanguage: questionAnalysis.language,
                learning: {
                    patternsMatched: learning.matchedPatterns.length,
                    internetInsights: learning.internetInsights.length,
                    totalInteractions: questionHistory.length,
                    learningRate: learningMetrics.learningRate,
                    internetQueries: learningMetrics.internetQueries,
                    cacheHits: learningMetrics.cacheHits,
                    improvement: learning.improvement,
                    confidence: learning.confidence,
                    processingTime: learning.processingTime
                },
                internetData: learning.internetInsights,
                learningId: learning.learningId
            }
        });
    } catch (error) {
        console.error('ML Learning Error:', error);
        
        // Fallback to basic response if learning fails
        const questionAnalysis = analyzeQuestionIntent(question, question.toLowerCase().split(' '));
        const detectedLanguage = questionAnalysis.language === 'rw' ? 'rw' : language;
        const fallbackResponse = generateIntelligentResponse(question, detectedLanguage);
        
        // Store failed interaction for learning
        const failedInteraction = {
            question: question.toLowerCase(),
            questionOriginal: question,
            response: fallbackResponse,
            error: error.message,
            timestamp: new Date().toISOString(),
            context: context || 'general',
            detectedLanguage: detectedLanguage,
            success: false
        };
        
        questionHistory.push(failedInteraction);
        
        res.json({ 
            success: true, 
            data: { 
                response: fallbackResponse,
                timestamp: new Date().toISOString(),
                language: detectedLanguage,
                detectedLanguage: questionAnalysis.language,
                learning: {
                    patternsMatched: 0,
                    internetInsights: 0,
                    totalInteractions: questionHistory.length,
                    learningRate: learningMetrics.learningRate,
                    internetQueries: learningMetrics.internetQueries,
                    cacheHits: learningMetrics.cacheHits,
                    improvement: 'Response generated using fallback learning (system error)',
                    confidence: 0.3,
                    processingTime: 0
                },
                internetData: [],
                error: error.message
            }
        });
    }
});

// Get comprehensive learning statistics with internet data
app.get('/ml/stats', (req, res) => {
    const stats = {
        totalQuestions: questionHistory.length,
        patternsLearned: responsePatterns.size,
        internetQueries: learningMetrics.internetQueries,
        cacheHits: learningMetrics.cacheHits,
        learningRate: learningMetrics.learningRate,
        recentQuestions: questionHistory.slice(-10).map(q => ({
            question: q.question,
            response: q.response,
            rating: q.rating,
            internetData: q.internetData?.length || 0,
            timestamp: q.timestamp
        })),
        topCategories: Array.from(responsePatterns.keys()),
        internetDataSources: Object.keys(internetSources),
        cacheSize: internetDataCache.size,
        learningMetrics: learningMetrics
    };
    
    res.json(stats);
});

// Rate response for enhanced learning
app.post('/ml/rate-response', (req, res) => {
    const { questionIndex, rating } = req.body;
    
    if (questionIndex >= 0 && questionIndex < questionHistory.length) {
        questionHistory[questionIndex].rating = rating;
        
        // Re-train patterns with new rating
        const interaction = questionHistory[questionIndex];
        learnFromInteraction(interaction.question, interaction.response, rating);
    }
    
    res.json({ 
        success: true, 
        message: 'Response rated successfully',
        learningMetrics: learningMetrics
    });
});

// Clear learning data and cache
app.post('/ml/reset-learning', (req, res) => {
    questionHistory.length = 0;
    internetDataCache.clear();
    learningMetrics.totalQuestions = 0;
    learningMetrics.internetQueries = 0;
    learningMetrics.cacheHits = 0;
    learningMetrics.learningRate = 0;
    
    // Re-initialize patterns
    initializeLearningPatterns();
    
    res.json({ 
        success: true, 
        message: 'Learning data and cache cleared successfully' 
    });
});

// Force refresh internet data
app.post('/ml/refresh-internet-data', async (req, res) => {
    try {
        // Clear cache to force refresh
        internetDataCache.clear();
        
        // Fetch fresh data from all sources
        const weatherData = await fetchInternetData('weather');
        const priceData = await fetchInternetData('marketPrices');
        const newsData = await fetchInternetData('farmingNews');
        const cropData = await fetchInternetData('cropCalendar');
        
        const refreshedData = {
            weather: weatherData ? 'success' : 'failed',
            marketPrices: priceData ? 'success' : 'failed',
            farmingNews: newsData ? 'success' : 'failed',
            cropCalendar: cropData ? 'success' : 'failed',
            timestamp: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            message: 'Internet data refreshed',
            data: refreshedData,
            metrics: learningMetrics
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to refresh internet data',
            details: error.message
        });
    }
});

// Add sample products for testing
app.get('/add-sample-products', (req, res) => {
    // ... (rest of the code remains the same)
    const sampleProducts = [
        [41, 'Tomatoes', 'Vegetables', '2.50', 100, 'Fresh organic tomatoes from our garden', 'uploads/products/tomato.jpg'],
        [41, 'Carrots', 'Vegetables', '1.80', 80, 'Sweet and crunchy carrots', 'uploads/products/carrot.jpg'],
        [41, 'Lettuce', 'Vegetables', '3.20', 50, 'Fresh green lettuce', 'uploads/products/lettuce.jpg'],
        [40, 'Coffee Beans', 'Coffee', '15.00', 30, 'Premium Arabica coffee beans', 'uploads/products/coffee.jpg'],
        [40, 'Bananas', 'Fruits', '1.50', 120, 'Sweet ripe bananas', 'uploads/products/banana.jpg']
    ];

    sampleProducts.forEach((product, index) => {
        db.query(
            'INSERT INTO products (farmer_id, product_name, category, price, quantity, description, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            product,
            (err, result) => {
                if (err) {
                    console.error('Error adding sample product:', err);
                } else {
                    console.log(`Added sample product ${index + 1}`);
                }
            }
        );
    });

    res.json({ message: 'Sample products added successfully' });
});

// ============= BUYER ROUTES =============

// Add latitude and longitude columns to farmers table
app.get('/add-coordinates', (req, res) => {
    // Add latitude and longitude columns to farmers table
    const alterTableQuery = `
        ALTER TABLE farmers 
        ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
        ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL
    `;
    
    db.query(alterTableQuery, (err, result) => {
        if (err) {
            console.error('Error adding coordinates columns:', err);
            return res.status(500).json({ message: 'Failed to add coordinate columns', error: err.message });
        }
        
        // Update sample farmers with coordinates (Rwanda cities)
        const farmerCoordinates = [
            { location: 'Kigali, Rwanda', lat: -1.9441, lng: 30.0619 },
            { location: 'Musanze, Rwanda', lat: -1.5080, lng: 29.6327 },
            { location: 'Rubavu, Rwanda', lat: -1.5179, lng: 29.2518 },
            { location: 'Huye, Rwanda', lat: -2.6037, lng: 29.7464 },
            { location: 'Gitarama, Rwanda', lat: -2.0744, lng: 29.7567 }
        ];
        
        farmerCoordinates.forEach(coord => {
            db.query(
                'UPDATE farmers f JOIN users u ON f.user_id = u.user_id SET f.latitude = ?, f.longitude = ? WHERE f.location LIKE ?',
                [coord.lat, coord.lng, `%${coord.location.split(',')[0]}%`]
            );
        });
        
        res.json({ message: 'Coordinate columns added and sample data updated successfully' });
    });
});

// Get coordinates for a location (geocoding simulation)
const getLocationCoordinates = (location) => {
    // Rwanda major city coordinates
    const coordinates = {
        'kigali': { lat: -1.9441, lng: 30.0619 },
        'musanze': { lat: -1.5080, lng: 29.6327 },
        'rubavu': { lat: -1.5179, lng: 29.2518 },
        'huye': { lat: -2.6037, lng: 29.7464 },
        'gitarama': { lat: -2.0744, lng: 29.7567 },
        'byumba': { lat: -1.7464, lng: 30.0670 },
        'nyagatare': { lat: -1.3079, lng: 30.3310 },
        'nyabugogo': { lat: -1.9536, lng: 30.0589 },
        'kicukiro': { lat: -1.9590, lng: 30.1045 },
        'gasabo': { lat: -1.9110, lng: 30.0995 },
        'nyarugenge': { lat: -1.9891, lng: 30.0585 }
    };
    
    const locationLower = location.toLowerCase();
    
    // Check for exact city match
    for (const city in coordinates) {
        if (locationLower.includes(city)) {
            return coordinates[city];
        }
    }
    
    // Default to Kigali if no match found
    return coordinates['kigali'];
};

// Calculate distance using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Get nearest farmers based on buyer location with real distance calculation
app.get('/buyers/nearest-farmers', (req, res) => {
    const { location, limit = 10 } = req.query;
    
    if (!location) {
        return res.status(400).json({ message: 'Location is required' });
    }

    console.log('Searching for farmers near:', location);

    // Get buyer's coordinates
    const buyerCoords = getLocationCoordinates(location);
    console.log('Buyer coordinates:', buyerCoords);

    // Query to get farmers with their coordinates
    const query = `
        SELECT 
            f.farmer_id,
            f.location as farmer_location,
            f.farm_type,
            f.description,
            f.latitude,
            f.longitude,
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            u.photo as profile_photo
        FROM farmers f
        JOIN users u ON f.user_id = u.user_id
        WHERE u.role = 'farmer' 
        AND f.location IS NOT NULL 
        AND f.location != ''
        ORDER BY u.created_at DESC
        LIMIT ?
    `;

    db.query(query, [parseInt(limit)], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch nearest farmers', error: err.message });
        }

        console.log('Found farmers:', results.length);

        // Calculate real distances for each farmer
        const farmersWithDistance = results.map(farmer => {
            let distance = null;
            let distanceCategory = 'Unknown';
            
            if (farmer.latitude && farmer.longitude) {
                // Calculate real distance using Haversine formula
                distance = calculateDistance(
                    buyerCoords.lat, buyerCoords.lng,
                    farmer.latitude, farmer.longitude
                );
                
                // Categorize distance
                if (distance === 0) distanceCategory = 'Same location';
                else if (distance < 10) distanceCategory = 'Very close';
                else if (distance < 25) distanceCategory = 'Nearby';
                else if (distance < 50) distanceCategory = 'Close';
                else if (distance < 100) distanceCategory = 'Same region';
                else distanceCategory = 'Distant';
            } else {
                // Fallback to text-based matching for farmers without coordinates
                const buyerLocation = location.toLowerCase();
                const farmerLocation = (farmer.farmer_location || '').toLowerCase();
                
                if (buyerLocation === farmerLocation) {
                    distanceCategory = 'Same location';
                    distance = 0;
                } else if (buyerLocation.includes(farmerLocation) || farmerLocation.includes(buyerLocation)) {
                    distanceCategory = 'Very close';
                    distance = 5;
                } else {
                    distanceCategory = 'Unknown';
                    distance = 999;
                }
            }
            
            return {
                ...farmer,
                distance: distance,
                distanceCategory: distanceCategory,
                buyerCoordinates: buyerCoords
            };
        });

        // Sort by distance (null distances go to the end)
        farmersWithDistance.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });

        res.json({
            message: `Found ${farmersWithDistance.length} farmers near ${location}`,
            farmers: farmersWithDistance,
            buyerLocation: location,
            buyerCoordinates: buyerCoords
        });
    });
});

// Update buyer location
app.put('/buyers/location', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        
        if (decoded.role !== 'buyer') {
            return res.status(403).json({ message: 'Buyer access required' });
        }

        const { location, district, sector } = req.body;
        const buyerId = decoded.user_id;

        // Update buyer's location, district, and sector in the users table
        const query = `
            UPDATE users
            SET location = ?, district = ?, sector = ?
            WHERE user_id = ? AND role = 'buyer'
        `;

        db.query(query, [location, district, sector, buyerId], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to update location' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Buyer not found' });
            }

            res.json({ 
                message: 'Location updated successfully',
                location: location,
                district: district,
                sector: sector
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get buyer's current location
app.get('/buyers/location', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'buyer') {
            return res.status(403).json({ message: 'Buyer access required' });
        }

        const buyerId = decoded.user_id;
        
        // Get buyer's location, district, and sector from the users table
        const query = `
            SELECT u.full_name, u.email, u.phone, u.created_at as member_since,
                   u.location, u.district, u.sector
            FROM users u
            WHERE u.user_id = ? AND u.role = 'buyer'
        `;
        
        db.query(query, [buyerId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch buyer data' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ message: 'Buyer profile not found' });
            }
            
            const buyer = results[0];
            
            // Return buyer data with location, district, and sector
            res.json({
                full_name: buyer.full_name,
                email: buyer.email,
                phone: buyer.phone,
                member_since: buyer.member_since,
                location: buyer.location || 'Not specified',
                district: buyer.district || '',
                sector: buyer.sector || ''
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

        // ============= BUYER DASHBOARD ROUTES =============

// Get buyer dashboard data (secured)
app.get('/buyer/dashboard', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'buyer') {
            return res.status(403).json({ message: 'Buyer access required' });
        }

        const buyerId = decoded.user_id;
    
    const query = `
        SELECT 
            u.user_id as buyer_id,
            u.full_name,
            u.email,
            u.phone,
            u.created_at as member_since
        FROM users u
        WHERE u.user_id = ? AND u.role = 'buyer'
    `;
    
    db.query(query, [buyerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch buyer data' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Buyer profile not found' });
        }
        
        res.json(results[0]);
    });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get available products for buyer (secured)
app.get('/buyer/products', auth.requireRole(['buyer']), (req, res) => {
    const { category, min_price, max_price, search } = req.query;
    
    let query = `
        SELECT 
            p.*,
            u.full_name as farmer_name,
            u.email as farmer_email,
            u.phone as farmer_phone,
            f.location as farm_location,
            f.farm_type
        FROM products p
        JOIN farmers f ON p.farmer_id = f.farmer_id
        JOIN users u ON f.user_id = u.user_id
        WHERE p.quantity > 0
    `;
    
    const params = [];
    
    if (category && category !== 'all') {
        query += ' AND p.category = ?';
        params.push(category);
    }
    
    if (min_price) {
        query += ' AND p.price >= ?';
        params.push(parseFloat(min_price));
    }
    
    if (max_price) {
        query += ' AND p.price <= ?';
        params.push(parseFloat(max_price));
    }
    
    if (search) {
        query += ' AND (p.product_name LIKE ? OR p.category LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch products' });
        }
        
        // Add full image path to each product
        const productsWithImagePaths = results.map(product => ({
            ...product,
            image: product.image ? `uploads/products/${product.image}` : null
        }));
        
        console.log('Buyer products with image paths:', productsWithImagePaths);
        res.json(productsWithImagePaths);
    });
});

// Get product details for buyer (secured)
app.get('/buyer/products/:productId', auth.requireRole(['buyer']), (req, res) => {
    const { productId } = req.params;
    
    // Validate product ID
    if (!parseInt(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const query = `
        SELECT 
            p.*,
            u.full_name as farmer_name,
            u.email as farmer_email,
            u.phone as farmer_phone,
            f.location as farm_location,
            f.farm_name,
            f.farm_type,
            f.description as farm_description
        FROM products p
        JOIN farmers f ON p.farmer_id = f.farmer_id
        JOIN users u ON f.user_id = u.user_id
        WHERE p.product_id = ?
    `;
    
    db.query(query, [parseInt(productId)], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch product details' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Add full image path to product
        const productWithImagePath = {
            ...results[0],
            image: results[0].image ? `uploads/products/${results[0].image}` : null
        };
        
        console.log('Product detail with image path:', productWithImagePath);
        res.json(productWithImagePath);
    });
});

// Add product to cart (secured) with immediate stock reduction and notification
app.post('/buyer/cart/add', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'buyer') {
            return res.status(403).json({ message: 'Buyer access required' });
        }

        const buyerId = decoded.user_id;
        const { product_id, quantity } = req.body;
        
        // Validate input
        if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Product ID and valid quantity are required' });
        }
        
        // Start transaction for stock reduction
        db.beginTransaction(async (err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            try {
                // Check if product exists and has sufficient stock
                const checkQuery = `
                    SELECT p.*, f.user_id as farmer_user_id
                    FROM products p
                    LEFT JOIN farmers f ON p.farmer_id = f.user_id
                    WHERE p.product_id = ?
                `;
                
                const product = await new Promise((resolve, reject) => {
                    db.query(checkQuery, [parseInt(product_id)], (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0]);
                    });
                });

                console.log('=== DEBUG: Cart Add Stock Check ===');
                console.log('Product ID:', product_id);
                console.log('Requested Quantity:', quantity);
                console.log('Product found:', !!product);
                console.log('Product quantity:', product?.quantity);

                if (!product) {
                    await new Promise((resolve, reject) => {
                        db.rollback(() => {
                            resolve();
                        });
                    });
                    return res.status(404).json({ message: 'Product not found' });
                }
                
                // Check if item already in cart
                const cartQuery = 'SELECT * FROM cart WHERE buyer_id = ? AND product_id = ?';
                const cartResults = await new Promise((resolve, reject) => {
                    db.query(cartQuery, [buyerId, parseInt(product_id)], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
                
                if (cartResults.length > 0) {
                    // Update existing cart item
                    const newQuantity = cartResults[0].quantity + parseInt(quantity);
                    
                    const updateQuery = 'UPDATE cart SET quantity = ?, updated_at = NOW() WHERE cart_id = ?';
                    await new Promise((resolve, reject) => {
                        db.query(updateQuery, [newQuantity, cartResults[0].cart_id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    // Create notification for farmer
                    createCartNotification(buyerId, product.farmer_user_id, parseInt(product_id), newQuantity);
                    
                    await new Promise((resolve, reject) => {
                        db.commit((err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    res.json({ 
                        message: 'Cart updated successfully', 
                        quantity: newQuantity
                    });
                } else {
                    // Add new item to cart
                    const insertQuery = `
                        INSERT INTO cart (buyer_id, product_id, quantity, price_at_time, created_at)
                        VALUES (?, ?, ?, ?, NOW())
                    `;
                    
                    await new Promise((resolve, reject) => {
                        db.query(insertQuery, [buyerId, parseInt(product_id), parseInt(quantity), product.price], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    // Create notification for farmer
                    createCartNotification(buyerId, product.farmer_user_id, parseInt(product_id), parseInt(quantity));
                    
                    await new Promise((resolve, reject) => {
                        db.commit((err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    res.json({ 
                        message: 'Product added to cart successfully',
                        stockReduced: true,
                        newStock: newStock
                    });
                }
            } catch (error) {
                await new Promise((resolve, reject) => {
                    db.rollback(() => {
                        resolve();
                    });
                });
                throw error;
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

function createProductWithFarmerId(farmerId, req, res) {
    const { product_name, category, price, quantity, description } = req.body;
    const image = req.file ? req.file.filename : '';
    
    // Insert farmer with consistent farmer_id
    const query = `
        INSERT INTO farmers (
            user_id, 
            location, 
            farm_type, 
            description
        ) VALUES (?, ?, ?, ?)
    `;
    
    // After insertion, update farmer_id to match user_id
    const updateQuery = 'UPDATE farmers SET farmer_id = ? WHERE user_id = ?';
    
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
            console.error('Failed query:', query);
            console.error('Failed values:', values);
            return res.status(500).json({ message: 'Failed to add product' });
        }
        
        // Execute update to ensure farmer_id = user_id consistency
        db.query(updateQuery, [decoded.user_id, decoded.user_id], (err) => {
            if (err) {
                console.error('Error fixing farmer_id:', err);
            } else {
                console.log('FARMER_ID FIXED AUTOMATICALLY');
            }
        });
        
        // Log product creation with full details
        console.log('PRODUCT CREATED SUCCESSFULLY:');
        console.log('- Product ID:', result.insertId);
        console.log('- Product Name:', product_name);
        console.log('- Farmer ID (consistent):', farmerId);
        console.log('- Values inserted:', values);
        
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
}

// Helper function to create cart notification
function createCartNotification(buyerId, farmerId, productId, quantity) {
    // Get buyer and product info for notification
    const infoQuery = `
        SELECT u.full_name as buyer_name, p.product_name
        FROM users u
        JOIN products p ON u.user_id = ? AND p.product_id = ?
    `;
    
    db.query(infoQuery, [buyerId, productId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Failed to get notification info:', err);
            return;
        }
        
        const { buyer_name, product_name } = results[0];
        
        // Insert notification
        const notificationQuery = `
            INSERT INTO notifications (farmer_id, buyer_id, product_id, type, title, message, created_at)
            VALUES (?, ?, ?, 'cart_add', 'Product Added to Cart', ?, NOW())
        `;
        
        const message = `${buyer_name} added ${product_name} to their cart (Quantity: ${quantity})`;
        
        db.query(notificationQuery, [farmerId, buyerId, productId, message], (err) => {
            if (err) {
                console.error('Failed to create notification:', err);
            } else {
                console.log(`Cart notification created for farmer ${farmerId}`);
            }
        });
    });
}

// Helper function to create order notification
function createOrderNotification(buyerId, farmerId, orderId, productId, quantity, productName) {
    // Get buyer name for notification
    const buyerQuery = 'SELECT full_name FROM users WHERE user_id = ?';
    
    db.query(buyerQuery, [buyerId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Failed to get buyer info for notification:', err);
            return;
        }
        
        const buyer_name = results[0].full_name;
        
        // Insert notification
        const notificationQuery = `
            INSERT INTO notifications (farmer_id, buyer_id, product_id, order_id, type, title, message, created_at)
            VALUES (?, ?, ?, ?, 'order_placed', 'New Order Received', ?, NOW())
        `;
        
        const message = `${buyer_name} placed an order for ${productName} (Quantity: ${quantity}, Order #${orderId})`;
        
        db.query(notificationQuery, [farmerId, buyerId, productId, orderId, message], (err) => {
            if (err) {
                console.error('Failed to create order notification:', err);
            } else {
                console.log(`Order notification created for farmer ${farmerId} - Order #${orderId}`);
            }
        });
    });
}

// Debug endpoint to check farmers table
app.get('/debug/farmers', (req, res) => {
    const query = 'SELECT * FROM farmers';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error checking farmers table:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('FARMERS TABLE DEBUG:', results);
        res.json(results);
    });
});

// Admin image upload endpoint
app.post('/admin/upload-image', adminUpload.single('image'), (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const { category = 'dashboard' } = req.body;
        const filename = req.file.filename;
        const originalName = req.file.originalname;
        const path = `uploads/admin/${filename}`;

        // Insert image record into database
        const query = `
            INSERT INTO admin_images (
                original_name,
                filename,
                path,
                category,
                uploaded_by,
                created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const values = [
            originalName,
            filename,
            path,
            category,
            decoded.user_id
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database error saving image:', err);
                return res.status(500).json({ message: 'Failed to save image information' });
            }

            console.log('ADMIN IMAGE UPLOADED:', {
                id: result.insertId,
                original_name: originalName,
                filename: filename,
                path: path,
                category: category,
                uploaded_by: decoded.user_id
            });

            res.status(201).json({
                message: 'Image uploaded successfully',
                image: {
                    id: result.insertId,
                    original_name: originalName,
                    filename: filename,
                    path: path,
                    category: category,
                    uploaded_by: decoded.user_id,
                    created_at: new Date()
                }
            });
        });

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get admin images endpoint
app.get('/admin/images', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const query = `
            SELECT 
                id,
                original_name,
                filename,
                path,
                category,
                uploaded_by,
                created_at
            FROM admin_images
            ORDER BY created_at DESC
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error fetching images:', err);
                return res.status(500).json({ message: 'Failed to fetch images' });
            }

            console.log('ADMIN IMAGES RETRIEVED:', results.length, 'images');
            res.json({ images: results });
        });

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Delete admin image endpoint
app.delete('/admin/images/:imageId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { imageId } = req.params;

        // First get the image info to delete the file
        const getImageQuery = 'SELECT * FROM admin_images WHERE id = ?';
        db.query(getImageQuery, [imageId], (err, imageResult) => {
            if (err) {
                console.error('Database error getting image:', err);
                return res.status(500).json({ message: 'Failed to get image information' });
            }

            if (imageResult.length === 0) {
                return res.status(404).json({ message: 'Image not found' });
            }

            const image = imageResult[0];

            // Delete from database
            const deleteQuery = 'DELETE FROM admin_images WHERE id = ?';
            db.query(deleteQuery, [imageId], (err, result) => {
                if (err) {
                    console.error('Database error deleting image:', err);
                    return res.status(500).json({ message: 'Failed to delete image' });
                }

                console.log('ADMIN IMAGE DELETED:', {
                    id: imageId,
                    filename: image.filename,
                    path: image.path
                });

                res.json({ message: 'Image deleted successfully' });
            });
        });

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Admin dashboard farmers endpoint (for AdminDashboard.jsx)
app.get('/admin/farmers', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const query = `
            SELECT f.*, u.full_name, u.email, u.phone, u.created_at
            FROM farmers f
            JOIN users u ON f.user_id = u.user_id
            WHERE u.role = 'farmer'
            ORDER BY u.created_at DESC
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error fetching farmers:', err);
                return res.status(500).json({ message: 'Failed to fetch farmers' });
            }

            console.log('ADMIN FARMERS RETRIEVED:', results.length, 'farmers');
            res.json({ farmers: results });
        });

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Farmer notifications endpoint - view orders for their products (renamed to avoid conflict with actual notifications)
app.get('/farmer/order-notifications', (req, res) => {
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

        const query = `
            SELECT
                o.order_id,
                o.buyer_id,
                o.total_amount,
                o.delivery_address,
                o.payment_method,
                o.status as order_status,
                o.created_at as order_date,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.product_name,
                u.full_name as buyer_name,
                u.email as buyer_email,
                u.phone as buyer_phone
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE p.farmer_id = ?
            ORDER BY o.created_at DESC
        `;

        db.query(query, [farmerId], (err, results) => {
            if (err) {
                console.error('Database error fetching farmer notifications:', err);
                return res.status(500).json({ message: 'Failed to fetch notifications' });
            }

            console.log('FARMER NOTIFICATIONS RETRIEVED:', results.length, 'notifications for farmer', farmerId);
            res.json({ notifications: results });
        });

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Admin order management endpoint - view all orders
app.get('/admin/orders', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const query = `
            SELECT 
                o.order_id,
                o.buyer_id,
                o.total_amount,
                o.delivery_address,
                o.payment_method,
                o.status as order_status,
                o.created_at as order_date,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.product_name,
                p.farmer_id,
                u.full_name as buyer_name,
                u.email as buyer_email,
                u.phone as buyer_phone,
                fu.full_name as farmer_name,
                fu.email as farmer_email
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            JOIN users u ON o.buyer_id = u.user_id
            JOIN farmers f ON p.farmer_id = f.farmer_id
            JOIN users fu ON f.user_id = fu.user_id
            ORDER BY o.created_at DESC
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error fetching admin orders:', err);
                return res.status(500).json({ message: 'Failed to fetch orders' });
            }

            console.log('ADMIN ORDERS RETRIEVED:', results.length, 'orders');
            res.json({ orders: results });
        });

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get admin images for home page slider (public endpoint)
app.get('/admin/images/slider', (req, res) => {
    const query = `
        SELECT id, original_name, filename, path, category, created_at
        FROM admin_images 
        WHERE category = 'dashboard'
        ORDER BY created_at DESC
        LIMIT 10
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error fetching slider images:', err);
            return res.status(500).json({ message: 'Failed to fetch slider images' });
        }

        // Add full URL to each image
        const imagesWithUrls = results.map(image => ({
            ...image,
            url: `http://localhost:5000/${image.path}`
        }));

        console.log('SLIDER IMAGES RETRIEVED:', imagesWithUrls.length, 'images');
        res.json({ images: imagesWithUrls });
    });
});

// Get available farmers for buyers (secured)
app.get('/buyer/farmers', auth.requireRole(['buyer']), (req, res) => {
    // Ensure district and sector columns exist in users table
    const alterTableQuery = `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS district VARCHAR(100) DEFAULT '',
        ADD COLUMN IF NOT EXISTS sector VARCHAR(100) DEFAULT ''
    `;
    
    db.query(alterTableQuery, (err) => {
        if (err) {
            console.error('Error adding district/sector columns:', err);
        }
    });
    
    const query = `
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            u.district,
            u.sector,
            f.location,
            f.province,
            f.district as farmer_district,
            f.sector as farmer_sector,
            f.cell,
            f.farm_name,
            f.farmer_id,
            COUNT(p.product_id) as product_count
        FROM users u
        JOIN farmers f ON u.user_id = f.user_id
        LEFT JOIN products p ON f.farmer_id = p.farmer_id AND p.quantity > 0
        WHERE u.role = 'farmer' AND u.status = 'active'
        GROUP BY u.user_id, u.full_name, u.email, u.phone, u.district, u.sector, f.location, f.province, f.district, f.sector, f.cell, f.farm_name, f.farmer_id
        ORDER BY product_count DESC, f.location ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch farmers' });
        }
        
        console.log('BUYER FARMERS - Raw results:', results);
        console.log('BUYER FARMERS - Query executed:');
        console.log('BUYER FARMERS - Expected: user_id 106 should have farmer_id 45');
        
        results.forEach((farmer, index) => {
            console.log(`FARMER ${index + 1}:`);
            console.log('- user_id:', farmer.user_id);
            console.log('- farmer_id:', farmer.farmer_id);
            console.log('- full_name:', farmer.full_name);
            console.log('- farmer_id type:', typeof farmer.farmer_id);
            console.log('- farmer_id exists:', farmer.hasOwnProperty('farmer_id'));
            console.log('- Complete farmer object:', farmer);
            
            // Special debugging for user_id 110
            if (farmer.user_id === 110) {
                console.log('*** DEBUGGING FARMER 110 ***');
                console.log('- Found in /buyer/farmers endpoint');
                console.log('- farmer_id returned:', farmer.farmer_id);
                console.log('- This should be used for product filtering');
            }
        });
        
        // Additional debugging: Check farmers table directly for user_id 106
        const checkFarmersQuery = 'SELECT * FROM farmers WHERE user_id = 106';
        db.query(checkFarmersQuery, (err, farmerCheck) => {
            if (err) {
                console.error('Error checking farmers table:', err);
            } else {
                console.log('FARMERS TABLE - Direct check for user_id 106:', farmerCheck);
            }
        });
        
        // Check what farmer_id berwutete's products actually have
        const checkProductsQuery = 'SELECT DISTINCT farmer_id FROM products WHERE farmer_id IN (SELECT farmer_id FROM farmers WHERE user_id = 106)';
        db.query(checkProductsQuery, (err, productCheck) => {
            if (err) {
                console.error('Error checking products table:', err);
            } else {
                console.log('PRODUCTS TABLE - farmer_id for user_id 106:', productCheck);
            }
        });
        
        // Add distance calculation (mock for now)
        const farmersWithDistance = results.map(farmer => ({
            ...farmer,
            distance: 'Near you' // In real app, calculate based on buyer location
        }));
        
        res.json(farmersWithDistance);
    });
});

// Get buyer's cart (secured)
app.get('/buyer/cart', auth.requireRole(['buyer']), (req, res) => {
    const buyerId = req.user.user_id;
    
    const query = `
        SELECT 
            c.*,
            p.product_name,
            p.category,
            p.image,
            u.full_name as farmer_name,
            f.location as farm_location
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        JOIN users u ON p.farmer_id = u.user_id
        JOIN farmers f ON p.farmer_id = f.user_id
        WHERE c.buyer_id = ?
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, [buyerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch cart' });
        }
        
        res.json(results);
    });
});

// Remove item from cart (secured)
app.delete('/buyer/cart/:cartId', auth.requireRole(['buyer']), (req, res) => {
    const buyerId = req.user.user_id;
    const { cartId } = req.params;
    
    if (!parseInt(cartId)) {
        return res.status(400).json({ message: 'Invalid cart ID' });
    }
    
    // Start transaction to restore stock
    db.beginTransaction(async (err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        try {
            // Get cart item details before deletion
            const getCartItemQuery = `
                SELECT c.product_id, c.quantity, p.quantity as current_stock
                FROM cart c
                JOIN products p ON c.product_id = p.product_id
                WHERE c.cart_id = ? AND c.buyer_id = ?
            `;
            
            const cartItem = await new Promise((resolve, reject) => {
                db.query(getCartItemQuery, [parseInt(cartId), buyerId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });
            
            if (!cartItem) {
                await new Promise((resolve) => {
                    db.rollback(() => resolve());
                });
                return res.status(404).json({ message: 'Cart item not found' });
            }
            
            // Delete cart item
            const deleteQuery = 'DELETE FROM cart WHERE cart_id = ? AND buyer_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteQuery, [parseInt(cartId), buyerId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // Commit transaction
            await new Promise((resolve, reject) => {
                db.commit((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            res.json({ 
                message: 'Item removed from cart successfully'
            });
            
        } catch (error) {
            // Rollback transaction on error
            await new Promise((resolve) => {
                db.rollback(() => resolve());
            });
            
            console.error('Error removing from cart:', error);
            res.status(500).json({ message: 'Failed to remove from cart' });
        }
    });
});

// Remove item from cart by product ID (alternative endpoint)
app.delete('/buyer/cart/product/:productId', auth.requireRole(['buyer']), (req, res) => {
    const buyerId = req.user.user_id;
    const { productId } = req.params;
    
    if (!parseInt(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    // Start transaction to restore stock
    db.beginTransaction(async (err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        try {
            // Get cart item details before deletion
            const getCartItemQuery = `
                SELECT c.cart_id, c.quantity, p.quantity as current_stock
                FROM cart c
                JOIN products p ON c.product_id = p.product_id
                WHERE c.product_id = ? AND c.buyer_id = ?
            `;
            
            const cartItem = await new Promise((resolve, reject) => {
                db.query(getCartItemQuery, [parseInt(productId), buyerId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });
            
            if (!cartItem) {
                await new Promise((resolve) => {
                    db.rollback(() => resolve());
                });
                return res.status(404).json({ message: 'Cart item not found' });
            }
            
            // Delete cart item
            const deleteQuery = 'DELETE FROM cart WHERE product_id = ? AND buyer_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteQuery, [parseInt(productId), buyerId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // Commit transaction
            await new Promise((resolve, reject) => {
                db.commit((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            res.json({ 
                message: 'Item removed from cart successfully'
            });
            
        } catch (error) {
            // Rollback transaction on error
            await new Promise((resolve) => {
                db.rollback(() => resolve());
            });
            
            console.error('Error removing from cart:', error);
            res.status(500).json({ message: 'Failed to remove from cart' });
        }
    });
});

// Checkout/Purchase products (secured with transaction)
app.post('/buyer/checkout', auth, auth.requireRole(['buyer']), (req, res) => {
    console.log('=== CHECKOUT ROUTE HIT ===');
    console.log('User:', req.user);
    console.log('Cart items received:', req.body.cart_items);
    console.log('Full request body:', req.body);
    
    const buyerId = req.user.user_id;
    const { cart_items, delivery_address, payment_method, deposit_amount, total_amount } = req.body;
    
    // Validate input
    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
        return res.status(400).json({ message: 'Cart items are required' });
    }
    
    if (!delivery_address) {
        return res.status(400).json({ message: 'Delivery address is required' });
    }

    // Start transaction for data consistency
    db.beginTransaction(async (err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        try {
            let totalAmount = 0;
            const orderItems = [];
            
            // Validate all cart items and check stock
            for (const item of cart_items) {
                const { product_id, quantity, price } = item;
                
                console.log('Validating cart item:', item);
                console.log('product_id:', product_id, typeof product_id);
                console.log('quantity:', quantity, typeof quantity);
                console.log('price:', price, typeof price);
                
                if (!product_id || !quantity || !price || quantity <= 0) {
                    console.log('Validation failed for item:', item);
                    throw new Error(`Invalid cart item data. Missing: ${!product_id ? 'product_id' : ''} ${!quantity ? 'quantity' : ''} ${!price ? 'price' : ''} ${quantity <= 0 ? 'quantity must be > 0' : ''}`);
                }
                
                // Get product details
                const productQuery = `
                    SELECT p.product_name, p.quantity as available_stock,
                           p.farmer_id, u.full_name as farmer_name, u.email as farmer_email
                    FROM products p
                    JOIN farmers f ON p.farmer_id = f.farmer_id
                    JOIN users u ON f.user_id = u.user_id
                    WHERE p.product_id = ?
                `;
                
                const productResult = await new Promise((resolve, reject) => {
                    db.query(productQuery, [parseInt(product_id)], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
                
                if (productResult.length === 0) {
                    console.log(`Product ${product_id} not found, skipping...`);
                    continue; // Skip this item and continue with others
                }
                
                const product = productResult[0];
                
                if (product.quantity < quantity) {
                    throw new Error(`Insufficient stock for ${product.product_name}. Only ${product.quantity} available, but you requested ${quantity}.`);
                }
                
                const itemTotal = price * quantity;
                totalAmount += itemTotal;
                
                orderItems.push({
                    product_id: product_id,
                    quantity: quantity,
                    price: price,
                    total: itemTotal,
                    farmer_id: product.farmer_id,
                    farmer_name: product.farmer_name,
                    farmer_email: product.farmer_email
                });
            }
            
            // Insert order record
            const orderQuery = `
                INSERT INTO orders (buyer_id, total_amount, status, delivery_address, 
                                 payment_method, order_date, created_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `;
            
            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderQuery, [buyerId, totalAmount, 'pending_payment', delivery_address, payment_method], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            const orderId = orderResult.insertId;
            
            // Create order items and update stock
            for (const item of orderItems) {
                // Insert order item
                const orderItemQuery = `
                    INSERT INTO order_items (order_id, product_id, quantity, 
                                            price)
                    VALUES (?, ?, ?, ?)
                `;
                
                await new Promise((resolve, reject) => {
                    db.query(orderItemQuery, [orderId, item.product_id, 
                           item.quantity, item.price], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
                
                // Update product stock (atomic operation)
                const updateStockQuery = `
                    UPDATE products 
                    SET quantity = quantity - ? 
                    WHERE product_id = ? AND quantity >= ?
                `;
                
                console.log(`=== STOCK REDUCTION ===`);
                console.log(`Product ID: ${item.product_id}`);
                console.log(`Quantity to reduce: ${item.quantity}`);
                console.log(`Query: ${updateStockQuery}`);
                console.log(`Params: [${item.quantity}, ${item.product_id}, ${item.quantity}]`);
                
                const stockResult = await new Promise((resolve, reject) => {
                    db.query(updateStockQuery, [item.quantity, item.product_id, item.quantity], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
                
                console.log(`Stock reduction result:`, stockResult);
                console.log(`Affected rows:`, stockResult.affectedRows);
                
                if (stockResult.affectedRows === 0) {
                    throw new Error(`Stock update failed for ${item.product_name}`);
                }
                
                // Remove item from cart
                await new Promise((resolve, reject) => {
                    db.query('DELETE FROM cart WHERE product_id = ? AND buyer_id = ?', 
                            [item.product_id, buyerId], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
            }
            
            // Commit transaction
            await new Promise((resolve, reject) => {
                db.commit((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // Create order notifications for farmers
            for (const item of orderItems) {
                createOrderNotification(buyerId, item.farmer_id, orderId, item.product_id, item.quantity, item.product_name);
            }
            
            // Send SMS notifications for successful order
            try {
                // Get buyer phone number
                const buyerQuery = 'SELECT phone, full_name FROM users WHERE user_id = ?';
                const buyerResult = await new Promise((resolve, reject) => {
                    db.query(buyerQuery, [buyerId], (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0]);
                    });
                });
                
                if (buyerResult && buyerResult.phone) {
                    // Send SMS to buyer
                    await smsService.sendOrderConfirmation(buyerResult.phone, {
                        order_id: orderId,
                        delivery_date: '2-3 business days'
                    });
                    console.log('SMS sent to buyer:', buyerResult.phone);
                }
                
                // Send SMS to farmers
                for (const item of orderItems) {
                    const farmerQuery = `
                        SELECT u.phone, u.full_name 
                        FROM users u 
                        JOIN farmers f ON u.user_id = f.user_id 
                        WHERE f.farmer_id = ?
                    `;
                    const farmerResult = await new Promise((resolve, reject) => {
                        db.query(farmerQuery, [item.farmer_id], (err, results) => {
                            if (err) reject(err);
                            else resolve(results[0]);
                        });
                    });
                    
                    if (farmerResult && farmerResult.phone) {
                        await smsService.sendSellerPaymentNotification(farmerResult.phone, {
                            order_id: orderId
                        }, totalAmount);
                        console.log('SMS sent to farmer:', farmerResult.phone);
                    }
                }
            } catch (smsError) {
                console.error('SMS notification failed (order still successful):', smsError);
                // Don't fail the order if SMS fails
            }
            
            // Log successful purchase
            console.log(`Order ${orderId} created by buyer ${buyerId} for $${totalAmount}`);
            
            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                order: {
                    order_id: orderId,
                    calculated_total: totalAmount,
                    status: 'pending_payment',
                    items: orderItems
                }
            });
            
        } catch (error) {
            // Rollback transaction on error
            await new Promise((resolve) => {
                db.rollback(() => resolve());
            });
            
            console.error('Checkout error:', error);
            res.status(400).json({ message: error.message || 'Checkout failed' });
        }
    });
});

// Get buyer's order history (secured)
app.get('/buyer/orders', auth.requireRole(['buyer']), (req, res) => {
    const buyerId = req.user.user_id;
    const { status, limit = 10, offset = 0 } = req.query;
    
    const query = `
        SELECT 
            o.*,
            COUNT(oi.order_item_id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.buyer_id = ?
    `;
    
    const params = [buyerId];
    
    if (status && status !== 'all') {
        query += ' AND o.status = ?';
        params.push(status);
    }
    
    query += ' GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch orders' });
        }
        
        res.json(results);
    });
});

// Alternative endpoint for frontend compatibility
app.get('/orders/buyer', auth.requireRole(['buyer']), (req, res) => {
    const buyerId = req.user.user_id;
    const { status, limit = 10, offset = 0 } = req.query;
    
    const query = `
        SELECT 
            o.*,
            COUNT(oi.order_item_id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.buyer_id = ?
    `;
    
    const params = [buyerId];
    
    if (status && status !== 'all') {
        query += ' AND o.status = ?';
        params.push(status);
    }
    
    query += ' GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch orders' });
        }
        
        res.json(results);
    });
});

// Get order details (secured)
app.get('/buyer/orders/:orderId', auth.requireRole(['buyer']), (req, res) => {
    const buyerId = req.user.user_id;
    const { orderId } = req.params;
    
    if (!parseInt(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    // Get order details
    const orderQuery = 'SELECT * FROM orders WHERE order_id = ? AND buyer_id = ?';
    db.query(orderQuery, [parseInt(orderId), buyerId], (err, orderResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch order' });
        }
        
        if (orderResults.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orderResults[0];
        
        // Get order items
        const itemsQuery = `
            SELECT 
                oi.*,
                p.product_name,
                p.image,
                u.full_name as farmer_name,
                f.location as farm_location
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN users u ON oi.farmer_id = u.user_id
            JOIN farmers f ON oi.farmer_id = f.user_id
            WHERE oi.order_id = ?
        `;
        
        db.query(itemsQuery, [parseInt(orderId)], (err, itemResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch order items' });
            }
            
            order.items = itemResults;
            res.json(order);
        });
    });
});

// ============= FARMER DASHBOARD ROUTES =============

// Get farmer dashboard data (secured)
app.get('/farmer/dashboard', auth.requireRole(['farmer']), (req, res) => {
    const farmerId = req.user.user_id;
    
    const query = `
        SELECT 
            f.*,
            u.full_name,
            u.email,
            u.phone,
            u.created_at as member_since,
            COUNT(DISTINCT p.product_id) as total_products,
            COALESCE(SUM(p.quantity), 0) as total_stock,
            COUNT(DISTINCT oi.order_id) as total_orders,
            COALESCE(SUM(oi.total), 0) as total_revenue
        FROM farmers f
        JOIN users u ON f.user_id = u.user_id
        LEFT JOIN products p ON f.user_id = p.farmer_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        WHERE f.user_id = ?
        GROUP BY f.user_id
    `;
    
    db.query(query, [farmerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch farmer data' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Farmer profile not found' });
        }
        
        res.json(results[0]);
    });
});

// Get farmer's products (secured with manual JWT verification)
app.get('/farmer/products', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id (same as POST endpoint)
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        
        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerResult.length === 0) {
                console.log('Farmer profile not found for user_id:', decoded.user_id);
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            
            const farmerId = farmerResult[0].farmer_id;
            console.log('Fetching products for farmer_id:', farmerId, 'user_id:', decoded.user_id);
            console.log('Products query results (farmer_id=' + farmerId + '):');
            
            const { status, category, limit = 50, offset = 0 } = req.query;
    
            let query = `
                SELECT 
                    p.*,
                    COUNT(DISTINCT c.cart_id) as cart_count,
                    COUNT(DISTINCT oi.order_item_id) as sold_count,
                    COALESCE(SUM(oi.quantity), 0) as total_sold
                FROM products p
                LEFT JOIN cart c ON p.product_id = c.product_id
                LEFT JOIN order_items oi ON p.product_id = oi.product_id
                WHERE p.farmer_id = ?
            `;
            
            const params = [farmerId];
            
            if (status && status !== 'all') {
                query += ' AND p.status = ?';
                params.push(status);
            }
            
            if (category && category !== 'all') {
                query += ' AND p.category = ?';
                params.push(category);
            }
            
            query += ' GROUP BY p.product_id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            db.query(query, params, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to fetch products' });
                }
                
                console.log('RAW QUERY RESULTS for farmer_id', farmerId, ':', results);
                console.log('QUERY EXECUTED:', query);
                console.log('PARAMETERS USED:', params);
                
                // Log each product's farmer_id to verify correct assignment
                results.forEach((product, index) => {
                    console.log(`PRODUCT ${index + 1}:`);
                    console.log('- Product ID:', product.product_id);
                    console.log('- Product Name:', product.product_name);
                    console.log('- Farmer ID in product:', product.farmer_id);
                    console.log('- Requesting Farmer ID:', farmerId);
                    console.log('- Match:', product.farmer_id === farmerId ? 'YES' : 'NO');
                });
                
                // Add full image path to each product
                const productsWithImagePaths = results.map(product => ({
                    ...product,
                    image: product.image ? `uploads/products/${product.image}` : null
                }));
                
                console.log('FINAL PRODUCTS RETURNED for farmer_id', farmerId, ':', productsWithImagePaths);
                res.json(productsWithImagePaths);
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Add new product (secured with manual JWT verification)
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

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        
        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            
            const farmerId = farmerResult[0].farmer_id;
            const { product_name, category, price, quantity, description } = req.body;
            
            // Validate farmer_id consistency
            if (farmerId !== decoded.user_id) {
                console.log('FARMER_ID MISMATCH DETECTED - Fixing automatically');
                console.log('- User ID:', decoded.user_id);
                console.log('- Farmer ID:', farmerId);
                
                // Auto-fix the farmer_id to match user_id
                const fixFarmerQuery = 'UPDATE farmers SET farmer_id = ? WHERE user_id = ?';
                db.query(fixFarmerQuery, [decoded.user_id, decoded.user_id], (err) => {
                    if (err) {
                        console.error('Error fixing farmer_id:', err);
                    } else {
                        console.log('FARMER_ID FIXED AUTOMATICALLY');
                    }
                });
                
                // Use user_id as farmer_id for consistency
                const correctedFarmerId = decoded.user_id;
                
                // Log farmer details for debugging
                console.log('PRODUCT CREATION - User ID from JWT:', decoded.user_id);
                console.log('PRODUCT CREATION - Corrected Farmer ID:', correctedFarmerId);
                console.log('PRODUCT CREATION - Product details:', { product_name, category, price, quantity });
                
                // Continue with corrected farmer_id
                createProductWithFarmerId(correctedFarmerId, req, res);
                return;
            }
            
            // Log farmer details for debugging
            console.log('PRODUCT CREATION - User ID from JWT:', decoded.user_id);
            console.log('PRODUCT CREATION - Farmer ID from database:', farmerId);
            console.log('PRODUCT CREATION - Product details:', { product_name, category, price, quantity });
            
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
                    console.error('Failed query:', query);
                    console.error('Failed values:', values);
                    return res.status(500).json({ message: 'Failed to add product' });
                }
                
                // Log product creation with full details
                console.log('PRODUCT CREATED SUCCESSFULLY:');
                console.log('- Product ID:', result.insertId);
                console.log('- Product Name:', product_name);
                console.log('- Farmer ID (from database):', farmerId);
                console.log('- User ID (from JWT):', decoded.user_id);
                console.log('- Values inserted:', values);
                
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
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Update product (secured)
app.put('/farmer/products/:productId', auth.requireRole(['farmer']), upload.single('image'), validateInput(validateProduct), (req, res) => {
    const farmerId = req.user.user_id;
    const { productId } = req.params;
    const { product_name, category, price, quantity, description, status } = req.body;
    
    if (!parseInt(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    // Verify product belongs to farmer
    const checkQuery = 'SELECT product_id FROM products WHERE product_id = ? AND farmer_id = ?';
    db.query(checkQuery, [parseInt(productId), farmerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to verify product ownership' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Product not found or access denied' });
        }
        
        // Update product
        let updateQuery = `
            UPDATE products 
            SET product_name = ?, category = ?, price = ?, quantity = ?, 
                description = ?, updated_at = NOW()
        `;
        let values = [
            product_name,
            category || 'general',
            parseFloat(price),
            parseInt(quantity) || 1,
            description || ''
        ];
        
        // Add image update if provided
        if (req.file) {
            updateQuery += ', image = ?';
            values.push(req.file.filename);
        }
        
        updateQuery += ' WHERE product_id = ? AND farmer_id = ?';
        values.push(parseInt(productId), farmerId);
        
        db.query(updateQuery, values, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to update product' });
            }
            
            // Log product update
            console.log(`Product updated: ${productId} by farmer ${farmerId}`);
            
            res.json({
                message: 'Product updated successfully',
                product_id: parseInt(productId)
            });
        });
    });
});

// Delete product (secured)
app.delete('/farmer/products/:productId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        
        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            
            const farmerId = farmerResult[0].farmer_id;
            const { productId } = req.params;
    
            if (!parseInt(productId)) {
                return res.status(400).json({ message: 'Invalid product ID' });
            }
            
            // Check if product is in any active orders or cart
            const checkQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM cart WHERE product_id = ?) as cart_count,
                    (SELECT COUNT(*) FROM order_items WHERE product_id = ?) as order_count
            `;
            
            db.query(checkQuery, [parseInt(productId), parseInt(productId)], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to check product dependencies' });
                }
                
                const { cart_count, order_count } = results[0];
                
                // Always use hard delete since status column doesn't exist
                const deleteQuery = 'DELETE FROM products WHERE product_id = ? AND farmer_id = ?';
                db.query(deleteQuery, [parseInt(productId), farmerId], (err, result) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Failed to delete product' });
                    }
                    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'Product not found' });
                    }
                    
                    res.json({ message: 'Product deleted successfully' });
                });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get farmer notifications (secured)
app.get('/farmer/notifications', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        
        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            
            const farmerId = farmerResult[0].farmer_id;
            const { limit = 20, offset = 0, unread_only = false } = req.query;
    
            // Check if notifications table exists first
            const checkTableQuery = 'SHOW TABLES LIKE "notifications"';
            
            db.query(checkTableQuery, (err, tableResults) => {
                if (err) {
                    console.error('Database error checking notifications table:', err);
                    return res.status(500).json({ message: 'Database error' });
                }
                
                // If notifications table doesn't exist, return empty array
                if (tableResults.length === 0) {
                    console.log('Notifications table does not exist, returning empty array');
                    return res.json([]);
                }
                
                // Table exists, proceed with query
                let query = `
                    SELECT 
                        n.*,
                        p.product_name,
                        u.full_name as buyer_name
                    FROM notifications n
                    LEFT JOIN products p ON n.product_id = p.product_id
                    LEFT JOIN users u ON n.buyer_id = u.user_id
                    WHERE n.farmer_id = ?
                `;
                
                const params = [farmerId];
                
                if (unread_only === 'true') {
                    query += ' AND n.is_read = FALSE';
                }
                
                query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
                params.push(parseInt(limit), parseInt(offset));
                
                db.query(query, params, (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Failed to fetch notifications' });
                    }

                    // Format notifications to include id field
                    const formattedNotifications = results.map(notification => ({
                        id: notification.notification_id,
                        notification_id: notification.notification_id,
                        type: notification.type,
                        title: notification.title,
                        message: notification.message,
                        buyer_name: notification.buyer_name,
                        product_name: notification.product_name,
                        order_id: notification.order_id,
                        read: notification.is_read,
                        time: formatTimeAgo(notification.created_at),
                        created_at: notification.created_at
                    }));

                    res.json(formattedNotifications);
                });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Mark notification as read (secured)
app.put('/farmer/notifications/:notificationId/read', auth.requireRole(['farmer']), (req, res) => {
    const farmerId = req.user.user_id;
    const { notificationId } = req.params;

    if (!parseInt(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const query = 'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE notification_id = ? AND farmer_id = ?';
    db.query(query, [parseInt(notificationId), farmerId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to mark notification as read' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    });
});

// Delete notification (secured)
app.delete('/farmer/notifications/:notificationId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';

        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }

            const farmerId = farmerResult[0].farmer_id;
            const { notificationId } = req.params;

            if (!parseInt(notificationId)) {
                return res.status(400).json({ message: 'Invalid notification ID' });
            }

            const query = 'DELETE FROM notifications WHERE notification_id = ? AND farmer_id = ?';
            db.query(query, [parseInt(notificationId), farmerId], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to delete notification' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Notification not found' });
                }

                console.log(`Notification ${notificationId} deleted by farmer ${farmerId}`);
                res.json({ message: 'Notification deleted successfully' });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get farmer's orders (secured)
app.get('/farmer/orders', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        
        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            
            const farmerId = farmerResult[0].farmer_id;
            const { status, limit = 20, offset = 0 } = req.query;
    
            // Check if orders table exists first
            const checkTableQuery = 'SHOW TABLES LIKE "orders"';
            
            db.query(checkTableQuery, (err, tableResults) => {
                if (err) {
                    console.error('Database error checking orders table:', err);
                    return res.status(500).json({ message: 'Database error' });
                }
                
                // If orders table doesn't exist, return empty array
                if (tableResults.length === 0) {
                    console.log('Orders table does not exist, returning empty array');
                    return res.json([]);
                }
                
                // Table exists, proceed with query
                let query = `
                    SELECT DISTINCT
                        o.*,
                        u.full_name as buyer_name,
                        u.email as buyer_email,
                        u.phone as buyer_phone,
                        COUNT(oi.order_item_id) as item_count,
                        SUM(oi.quantity * oi.price) as order_total
                    FROM orders o
                    JOIN order_items oi ON o.order_id = oi.order_id
                    JOIN products p ON oi.product_id = p.product_id
                    JOIN users u ON o.buyer_id = u.user_id
                    WHERE p.farmer_id = ?
                `;
                
                const params = [farmerId];
                
                if (status && status !== 'all') {
                    query += ' AND o.status = ?';
                    params.push(status);
                }
                
                query += ' GROUP BY o.order_id ORDER BY o.order_date DESC LIMIT ? OFFSET ?';
                params.push(parseInt(limit), parseInt(offset));
                
                db.query(query, params, (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Failed to fetch orders' });
                    }
                    
                    res.json(results);
                });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Update product stock (secured)
app.put('/farmer/products/:productId/stock', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        
        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            
            const farmerId = farmerResult[0].farmer_id;
            const { productId } = req.params;
            const { quantity } = req.body;
            
            if (!parseInt(productId) || !quantity || quantity <= 0) {
                return res.status(400).json({ message: 'Invalid product ID or quantity' });
            }
            
            const query = 'UPDATE products SET quantity = quantity + ? WHERE product_id = ? AND farmer_id = ?';
            db.query(query, [parseInt(quantity), parseInt(productId), farmerId], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to update stock' });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Product not found' });
                }
                
                res.json({
                    message: 'Stock updated successfully',
                    product_id: parseInt(productId),
                    added_quantity: parseInt(quantity)
                });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Update product price (secured)
app.put('/farmer/products/:productId/price', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';
        
        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }
            
            const farmerId = farmerResult[0].farmer_id;
            const { productId } = req.params;
            const { price } = req.body;
            
            if (!parseInt(productId) || !price || price <= 0) {
                return res.status(400).json({ message: 'Invalid product ID or price' });
            }
            
            const query = 'UPDATE products SET price = ? WHERE product_id = ? AND farmer_id = ?';
            db.query(query, [parseFloat(price), parseInt(productId), farmerId], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to update price' });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Product not found' });
                }
                
                res.json({
                    message: 'Price updated successfully',
                    product_id: parseInt(productId),
                    new_price: parseFloat(price)
                });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get farmer order details (secured)
app.get('/farmer/orders/:orderId', auth.requireRole(['farmer']), (req, res) => {
    const farmerId = req.user.user_id;
    const { orderId } = req.params;
    
    if (!parseInt(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    // Get order details with farmer verification
    const orderQuery = `
        SELECT 
            o.*,
            u.full_name as buyer_name,
            u.email as buyer_email,
            u.phone as buyer_phone
        FROM orders o
        JOIN users u ON o.buyer_id = u.user_id
        JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = ? AND oi.farmer_id = ?
        LIMIT 1
    `;
    
    db.query(orderQuery, [parseInt(orderId), farmerId], (err, orderResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch order' });
        }
        
        if (orderResults.length === 0) {
            return res.status(404).json({ message: 'Order not found or access denied' });
        }
        
        const order = orderResults[0];
        
        // Get order items for this farmer
        const itemsQuery = `
            SELECT 
                oi.*,
                p.product_name,
                p.image,
                p.category
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ? AND oi.farmer_id = ?
        `;
        
        db.query(itemsQuery, [parseInt(orderId), farmerId], (err, itemResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch order items' });
            }
            
            order.items = itemResults;
            res.json(order);
        });
    });
});

// Get farmer notifications (secured)
app.get('/farmer/notifications', auth.requireRole(['farmer']), (req, res) => {
    const farmerId = req.user.user_id;
    const { limit = 20, offset = 0 } = req.query;
    
    const query = `
        SELECT 
            n.*,
            u.full_name as buyer_name,
            p.product_name
        FROM notifications n
        LEFT JOIN users u ON n.buyer_id = u.user_id
        LEFT JOIN products p ON n.product_id = p.product_id
        WHERE n.farmer_id = ?
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
    `;
    
    db.query(query, [farmerId, parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch notifications' });
        }
        
        // Format notifications
        const formattedNotifications = results.map(notification => ({
            id: notification.notification_id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            buyer_name: notification.buyer_name,
            product_name: notification.product_name,
            order_id: notification.order_id,
            read: notification.read,
            time: formatTimeAgo(notification.created_at),
            created_at: notification.created_at
        }));
        
        res.json(formattedNotifications);
    });
});

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Edit farmer (sub-admin only with location validation)
app.put('/api/farmers/admin/:farmerId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'sub_admin') {
            return res.status(403).json({ message: 'Sub-admin access required' });
        }

        const { farmerId } = req.params;
        const { full_name, email, phone, province, district, sector, cooperative_name } = req.body;

        // Get sub-admin's assigned location
        const locationQuery = `
            SELECT province, district, sector
            FROM users
            WHERE user_id = ?
        `;

        db.query(locationQuery, [decoded.user_id], (err, locationResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (locationResult.length === 0) {
                return res.status(404).json({ message: 'Sub-admin location not found' });
            }

            const { province: assignedProvince, district: assignedDistrict, sector: assignedSector } = locationResult[0];

            // Get farmer's current location to validate (from users table)
            const farmerQuery = `
                SELECT f.user_id, u.province, u.district, u.sector
                FROM farmers f
                INNER JOIN users u ON f.user_id = u.user_id
                WHERE f.farmer_id = ? OR f.user_id = ?
            `;

            db.query(farmerQuery, [parseInt(farmerId), parseInt(farmerId)], (err, farmerResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                if (farmerResult.length === 0) {
                    return res.status(404).json({ message: 'Farmer not found' });
                }

                const farmer = farmerResult[0];
                console.log('EDIT - Farmer data:', farmer);

                // Validate that farmer is in sub-admin's assigned location (case-insensitive)
                // If farmer has no location data, allow operation (legacy farmers)
                if (farmer.province && farmer.district && farmer.sector) {
                    if (farmer.province.toLowerCase() !== assignedProvince.toLowerCase() ||
                        farmer.district.toLowerCase() !== assignedDistrict.toLowerCase() ||
                        farmer.sector.toLowerCase() !== assignedSector.toLowerCase()) {
                        return res.status(403).json({
                            message: 'Access denied. You can only edit farmers within your assigned location.'
                        });
                    }
                } else {
                    console.log('EDIT - Farmer has incomplete location data, allowing operation (legacy farmer)');
                }

                // If location is being updated, validate it matches sub-admin's location
                if (province && district && sector) {
                    if (province.toLowerCase() !== assignedProvince.toLowerCase() ||
                        district.toLowerCase() !== assignedDistrict.toLowerCase() ||
                        sector.toLowerCase() !== assignedSector.toLowerCase()) {
                        return res.status(403).json({
                            message: 'Access denied. You can only assign farmers within your assigned location.'
                        });
                    }
                }

                // Update farmer and user information
                const updateQueries = [];
                const params = [];

                if (full_name) {
                    updateQueries.push('UPDATE users SET full_name = ? WHERE user_id = ?');
                    params.push(full_name, farmer.user_id);
                }
                if (email) {
                    updateQueries.push('UPDATE users SET email = ? WHERE user_id = ?');
                    params.push(email, farmer.user_id);
                }
                if (phone) {
                    updateQueries.push('UPDATE users SET phone = ? WHERE user_id = ?');
                    params.push(phone, farmer.user_id);
                }
                if (province) {
                    updateQueries.push('UPDATE farmers SET province = ? WHERE user_id = ?');
                    params.push(province, farmer.user_id);
                }
                if (district) {
                    updateQueries.push('UPDATE farmers SET district = ? WHERE user_id = ?');
                    params.push(district, farmer.user_id);
                }
                if (sector) {
                    updateQueries.push('UPDATE farmers SET sector = ? WHERE user_id = ?');
                    params.push(sector, farmer.user_id);
                }
                if (cooperative_name !== undefined) {
                    updateQueries.push('UPDATE farmers SET cooperative_name = ? WHERE user_id = ?');
                    params.push(cooperative_name, farmer.user_id);
                }

                if (updateQueries.length === 0) {
                    return res.status(400).json({ message: 'No fields to update' });
                }

                // Execute all updates
                let completed = 0;
                updateQueries.forEach((query, index) => {
                    const queryIndex = index;
                    const queryParams = params.slice(queryIndex * 2, queryIndex * 2 + 2);
                    db.query(query, queryParams, (err) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ message: 'Failed to update farmer' });
                        }
                        completed++;
                        if (completed === updateQueries.length) {
                            res.json({ message: 'Farmer updated successfully' });
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Delete farmer (sub-admin only with location validation)
app.delete('/api/farmers/:farmerId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'sub_admin') {
            return res.status(403).json({ message: 'Sub-admin access required' });
        }

        const { farmerId } = req.params;

        // Get sub-admin's assigned location
        const locationQuery = `
            SELECT province, district, sector
            FROM users
            WHERE user_id = ?
        `;

        db.query(locationQuery, [decoded.user_id], (err, locationResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (locationResult.length === 0) {
                return res.status(404).json({ message: 'Sub-admin location not found' });
            }

            const { province: assignedProvince, district: assignedDistrict, sector: assignedSector } = locationResult[0];

            // Get farmer's current location to validate (from users table)
            const farmerQuery = `
                SELECT f.user_id, u.province, u.district, u.sector
                FROM farmers f
                INNER JOIN users u ON f.user_id = u.user_id
                WHERE f.farmer_id = ? OR f.user_id = ?
            `;

            db.query(farmerQuery, [parseInt(farmerId), parseInt(farmerId)], (err, farmerResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                if (farmerResult.length === 0) {
                    return res.status(404).json({ message: 'Farmer not found' });
                }

                const farmer = farmerResult[0];
                console.log('DELETE - Farmer data:', farmer);

                // Validate that farmer is in sub-admin's assigned location (case-insensitive)
                // If farmer has no location data, allow operation (legacy farmers)
                if (farmer.province && farmer.district && farmer.sector) {
                    if (farmer.province.toLowerCase() !== assignedProvince.toLowerCase() ||
                        farmer.district.toLowerCase() !== assignedDistrict.toLowerCase() ||
                        farmer.sector.toLowerCase() !== assignedSector.toLowerCase()) {
                        return res.status(403).json({
                            message: 'Access denied. You can only delete farmers within your assigned location.'
                        });
                    }
                } else {
                    console.log('DELETE - Farmer has incomplete location data, allowing operation (legacy farmer)');
                }

                const userId = farmer.user_id;

                // Delete farmer and related data
                const deleteSteps = [
                    // 1. Delete order items for this farmer's products
                    { query: 'DELETE oi FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE p.farmer_id = ?', params: [farmerId] },
                    // 2. Delete orders for this farmer's products
                    { query: 'DELETE o FROM orders o JOIN order_items oi ON o.order_id = oi.order_id JOIN products p ON oi.product_id = p.product_id WHERE p.farmer_id = ?', params: [farmerId] },
                    // 3. Get product images for cleanup
                    {
                        query: 'SELECT image FROM products WHERE farmer_id = ? AND image IS NOT NULL',
                        params: [farmerId],
                        isImageCleanup: true
                    },
                    // 4. Delete products for this farmer
                    { query: 'DELETE FROM products WHERE farmer_id = ?', params: [farmerId] },
                    // 5. Delete farmer profile
                    { query: 'DELETE FROM farmers WHERE user_id = ?', params: [userId] },
                    // 6. Finally delete the user
                    { query: 'DELETE FROM users WHERE user_id = ?', params: [userId] }
                ];

                let currentStep = 0;

                const executeNextStep = () => {
                    if (currentStep < deleteSteps.length) {
                        const step = deleteSteps[currentStep];
                        db.query(step.query, step.params, (err, result) => {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ message: 'Failed to delete farmer' });
                            }

                            // Handle image cleanup step
                            if (step.isImageCleanup && result && result.length > 0) {
                                const fs = require('fs');
                                const path = require('path');
                                result.forEach(row => {
                                    if (row.image) {
                                        const imagePath = path.join(__dirname, 'uploads', 'products', row.image);
                                        if (fs.existsSync(imagePath)) {
                                            fs.unlinkSync(imagePath);
                                        }
                                    }
                                });
                            }

                            currentStep++;
                            executeNextStep();
                        });
                    } else {
                        res.json({ message: 'Farmer deleted successfully' });
                    }
                };

                executeNextStep();
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Get sub-admin's managed farmers' orders (secured)
app.get('/sub-admin/orders', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'sub_admin') {
            return res.status(403).json({ message: 'Sub-admin access required' });
        }

        // Get sub-admin's assigned location
        const locationQuery = `
            SELECT province, district, sector
            FROM users
            WHERE user_id = ?
        `;

        db.query(locationQuery, [decoded.user_id], (err, locationResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (locationResult.length === 0) {
                return res.status(404).json({ message: 'Sub-admin location not found' });
            }

            const { province, district, sector } = locationResult[0];

            // Get orders from farmers in the sub-admin's assigned location
            const ordersQuery = `
                SELECT
                    o.order_id,
                    o.buyer_id,
                    o.status,
                    o.created_at,
                    u.full_name AS buyer_name,
                    fu.full_name AS farmer_name,
                    (SELECT SUM(oi.quantity * oi.price) FROM order_items oi WHERE oi.order_id = o.order_id) AS total_amount
                FROM orders o
                INNER JOIN order_items oi ON o.order_id = oi.order_id
                INNER JOIN farmers f ON oi.farmer_id = f.farmer_id
                INNER JOIN users u ON o.buyer_id = u.user_id
                INNER JOIN users fu ON f.user_id = fu.user_id
                WHERE f.province = ? AND f.district = ? AND f.sector = ?
                GROUP BY o.order_id
                ORDER BY o.created_at DESC
            `;

            db.query(ordersQuery, [province, district, sector], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to fetch orders' });
                }

                res.json(results);
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Update order status (secured)
app.put('/farmer/orders/:orderId/status', auth.requireRole(['farmer']), (req, res) => {
    const farmerId = req.user.user_id;
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!parseInt(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Verify farmer has items in this order
    const verifyQuery = 'SELECT COUNT(*) as count FROM order_items WHERE order_id = ? AND farmer_id = ?';
    db.query(verifyQuery, [parseInt(orderId), farmerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to verify order access' });
        }
        
        if (results[0].count === 0) {
            return res.status(404).json({ message: 'Order not found or access denied' });
        }
        
        // Update order status
        const updateQuery = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?';
        db.query(updateQuery, [status, parseInt(orderId)], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to update order status' });
            }
            
            // Log status update
            console.log(`Order ${orderId} status updated to ${status} by farmer ${farmerId}`);
            
            res.json({ message: 'Order status updated successfully' });
        });
    });
});

// Delete admin's order (secured)
app.delete('/admin/orders/:orderId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { orderId } = req.params;

        console.log(`Attempting to delete order ${orderId} by admin`);

        // Delete order_items first (due to foreign key constraint)
        const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE order_id = ?';
        db.query(deleteOrderItemsQuery, [parseInt(orderId)], (err, itemsResult) => {
            if (err) {
                console.error('Database error deleting order items:', err);
                return res.status(500).json({ message: 'Failed to delete order items' });
            }

            console.log(`Deleted ${itemsResult.affectedRows} order items for order ${orderId}`);

            // Then delete the order from orders table
            const deleteOrderQuery = 'DELETE FROM orders WHERE order_id = ?';
            db.query(deleteOrderQuery, [parseInt(orderId)], (err, orderResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Failed to delete order' });
                }

                if (orderResult.affectedRows === 0) {
                    return res.status(404).json({ message: 'Order not found' });
                }

                console.log(`Order ${orderId} deleted by admin`);
                res.json({ message: 'Order deleted successfully' });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Delete farmer's order (secured)
app.delete('/farmer/orders/:orderId', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        // Get the farmer_id from farmers table using user_id
        const getFarmerQuery = 'SELECT farmer_id FROM farmers WHERE user_id = ?';

        db.query(getFarmerQuery, [decoded.user_id], (err, farmerResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (farmerResult.length === 0) {
                return res.status(404).json({ message: 'Farmer profile not found' });
            }

            const farmerId = farmerResult[0].farmer_id;
            const { orderId } = req.params;

            console.log(`Attempting to delete order ${orderId} for farmer ${farmerId}`);

            // Delete order_items first (due to foreign key constraint)
            const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE order_id = ?';
            db.query(deleteOrderItemsQuery, [parseInt(orderId)], (err, itemsResult) => {
                if (err) {
                    console.error('Database error deleting order items:', err);
                    return res.status(500).json({ message: 'Failed to delete order items' });
                }

                console.log(`Deleted ${itemsResult.affectedRows} order items for order ${orderId}`);

                // Then delete the order from orders table
                const deleteOrderQuery = 'DELETE FROM orders WHERE order_id = ?';
                db.query(deleteOrderQuery, [parseInt(orderId)], (err, orderResult) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Failed to delete order' });
                    }

                    console.log(`Order ${orderId} deleted by farmer ${farmerId}`);
                    res.json({ message: 'Order deleted successfully' });
                });
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// ============= ORDER ROUTES =============
const orderRoutes = require('./routes/orders');
app.use('/orders', orderRoutes);

// ============= ML ROUTES =============

const mlRoutes = require('./update_ml_routes');
app.use('/api/ml', mlRoutes);

// ============= ERROR HANDLING =============

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============= START SERVER =============

const PORT = process.env.PORT || 5000;

// Public test endpoint - no auth required
app.get('/test-connection', (req, res) => {
    console.log('=== TEST CONNECTION ENDPOINT HIT ===');
    console.log('Headers:', req.headers);
    console.log('Authorization:', req.headers.authorization);
    res.json({ 
        message: 'Backend is working', 
        timestamp: new Date().toISOString(),
        auth_header_received: !!req.headers.authorization
    });
});

// Simple test add product endpoint for debugging
app.post('/test-add-product', (req, res) => {
    console.log(' Test add product endpoint called');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        console.log('Attempting JWT verification...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        console.log('JWT verification successful:', decoded);
        
        if (decoded.role !== 'farmer') {
            return res.status(403).json({ message: 'Farmer access required' });
        }

        const farmerId = decoded.user_id;
        console.log('Farmer ID:', farmerId);
        
        // Get product data from request body
        const { product_name, category, price, quantity, description } = req.body;
        console.log('Product data:', { product_name, category, price, quantity, description });
        
        // Simple database insert
        const query = `
            INSERT INTO products (product_name, category, price, quantity, farmer_id, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [
            product_name || 'Test Product',
            category || 'general',
            parseFloat(price) || 0,
            parseInt(quantity) || 1,
            farmerId,
            description || 'Test description'
        ];
        
        console.log('Executing database query...');
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to add product', error: err.message });
            }
            
            console.log('Product added successfully:', result.insertId);
            res.status(201).json({
                message: 'Product added successfully',
                product_id: result.insertId,
                product: {
                    product_id: result.insertId,
                    product_name,
                    category: category || 'general',
                    price: parseFloat(price) || 0,
                    quantity: parseInt(quantity) || 1,
                    farmer_id: farmerId,
                    description: description || 'Test description'
                }
            });
        });
        
    } catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
});

// Initialize ML patterns
// initializeLearningPatterns();

app.listen(PORT, () => {
    console.log(` FarmerJoin Server running on port ${PORT}`);
    console.log(` Dashboard: http://localhost:${PORT}`);
    console.log(` Admin: hirwa@farmerjoin.com / hirwa`);
    console.log(` Farmers can login and access their dashboards`);
    console.log(` ML Learning System: Enhanced with Internet Data`);
    console.log(` Internet Sources: Weather, Market Prices, Farming News, Crop Calendar`);
    console.log(`🌾 Farmers can login and access their dashboards`);
    console.log(`🤖 ML Learning System: Enhanced with Internet Data`);
    console.log(`🌐 Internet Sources: Weather, Market Prices, Farming News, Crop Calendar`);
});
