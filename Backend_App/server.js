const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./dbConnection");
const multer = require('multer');
const axios = require('axios'); // Add axios for web scraping

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'student',
    resave: false,
    saveUninitialized: false
}));

// Static files
app.use("/uploads", express.static("uploads"));
app.use("/images", express.static("uploads/images"));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
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

// ============= AUTHENTICATION ROUTES =============

// REGISTER
app.post("/auth/register", async (req, res) => {
    const { full_name, email, phone, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (full_name,email,phone,password,role) VALUES (?,?,?,?,?)",
        [full_name, email, phone, hashed, role],
        (err, result) => {
            if (err) return res.status(500).json(err);

            const userId = result.insertId;

            if (role === "farmer") {
                db.query("INSERT INTO farmers (user_id) VALUES (?)", [userId]);
            }

            if (role === "buyer") {
                db.query("INSERT INTO buyers (user_id) VALUES (?)", [userId]);
            }

            res.json({ message: "User registered successfully" });
        }
    );
});

// LOGIN (JWT)
app.post("/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
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
                
                const token = jwt.sign(
                    { user_id: user.user_id, role: user.role },
                    'secretkey'
                );

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
app.post('/farmers/admin/create-farmer', isAdmin, (req, res) => {
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
                VALUES (?, ?, ?, ?, 'farmer', NOW())
            `;
            
            db.query(userQuery, [full_name, email, phone, hashedPassword], (err, userResult) => {
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

// Get all users
app.get('/users', (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
        }
        return res.json(results);
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

// Add new product
app.post('/products/add', upload.single('image'), (req, res) => {
    console.log('=== PRODUCT ADD REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { 
        product_name, 
        category, 
        price, 
        quantity, 
        farmer_id
    } = req.body;
    
    // Get image from file upload
    const image = req.file ? req.file.filename : '';
    
    console.log('Extracted data:', {
        product_name, 
        category, 
        price, 
        quantity, 
        farmer_id,
        image
    });
    
    // Validate required fields
    if (!product_name || !price || !farmer_id) {
        console.log('Validation failed:', {
            has_product_name: !!product_name,
            has_price: !!price,
            has_farmer_id: !!farmer_id
        });
        return res.status(400).json({ 
            message: 'Product name, price, and farmer ID are required' 
        });
    }
    
    // Insert product into database
    const query = `
        INSERT INTO products (
            product_name, 
            category, 
            price, 
            quantity, 
            farmer_id, 
            image
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
        product_name,
        category || 'general',
        price,
        quantity || 1,
        farmer_id,
        image
    ];
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('=== DATABASE ERROR ===');
            console.error('Error details:', err);
            console.error('SQL Query:', query);
            console.error('Values:', values);
            console.error('Error code:', err.code);
            console.error('Error number:', err.errno);
            console.error('SQL message:', err.sqlMessage);
            return res.status(500).json({ 
                message: 'Failed to add product', 
                error: err.message,
                sqlMessage: err.sqlMessage
            });
        }
        
        res.status(201).json({
            message: 'Product added successfully',
            productId: result.insertId,
            product: {
                product_id: result.insertId,
                product_name,
                category,
                price,
                quantity,
                farmer_id,
                image: image ? `uploads/products/${image}` : '',
                created_at: new Date()
            }
        });
    });
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
    
    const query = 'DELETE FROM users WHERE user_id = ?';
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to delete user' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
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

// Get all products (public endpoint)
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products ORDER BY created_at DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch products' });
        }
        console.log('Products query results:', results);
        res.json(results);
    });
});

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
        LEFT JOIN users u ON r.user_id = u.user_id
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

// Get farmer's products
app.get('/farmer/products', (req, res) => {
    // This would need farmer authentication middleware
    const query = 'SELECT * FROM products ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch products' });
        }
        res.json(results);
    });
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

// Get farmer's orders
app.get('/farmer/orders', (req, res) => {
    // This would need farmer authentication middleware
    const query = 'SELECT * FROM orders ORDER BY order_date DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch orders' });
        }
        res.json(results);
    });
});

// Get farmer profile
app.get('/farmer/profile', (req, res) => {
    // This would need farmer authentication middleware
    const query = `
        SELECT f.*, u.full_name, u.email, u.phone, u.photo as profile_photo
        FROM farmers f
        JOIN users u ON f.user_id = u.user_id
        WHERE u.role = 'farmer'
        LIMIT 1
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch profile' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Farmer profile not found' });
        }
        res.json(results[0]);
    });
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
        const decoded = jwt.verify(token, 'secretkey');
        const { location } = req.body;

        if (!location) {
            return res.status(400).json({ message: 'Location is required' });
        }

        if (decoded.role !== 'buyer') {
            return res.status(403).json({ message: 'Buyer access required' });
        }

        // Update buyer's location in the buyers table
        const query = `
            UPDATE buyers b
            JOIN users u ON b.user_id = u.user_id
            SET b.location = ?
            WHERE u.user_id = ?
        `;

        db.query(query, [location, decoded.user_id], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to update location' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Buyer not found' });
            }

            res.json({ 
                message: 'Location updated successfully',
                location: location
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
        const decoded = jwt.verify(token, 'secretkey');

        if (decoded.role !== 'buyer') {
            return res.status(403).json({ message: 'Buyer access required' });
        }

        // Get buyer's location from the buyers table
        const query = `
            SELECT b.location, u.full_name, u.email
            FROM buyers b
            JOIN users u ON b.user_id = u.user_id
            WHERE u.user_id = ?
        `;

        db.query(query, [decoded.user_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch location' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Buyer not found' });
            }

            const buyer = results[0];
            res.json({
                location: buyer.location,
                full_name: buyer.full_name,
                email: buyer.email
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

const PORT = process.env.PORT || 4000;

// Initialize learning patterns on server start
initializeLearningPatterns();

app.listen(PORT, () => {
    console.log(`🚀 FarmerJoin Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`👤 Admin: hirwa@farmerjoin.com / hirwa`);
    console.log(`🌾 Farmers can login and access their dashboards`);
    console.log(`🤖 ML Learning System: Enhanced with Internet Data`);
    console.log(`🌐 Internet Sources: Weather, Market Prices, Farming News, Crop Calendar`);
});
