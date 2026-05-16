const db = require('./config/db');
const bcrypt = require('bcryptjs');

// Update your user to admin role
const makeUserAdmin = async (email) => {
    try {
        // First check if user exists
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );
        
        if (users.length === 0) {
            console.log('User not found with email:', email);
            return;
        }
        
        // Update user role to admin
        await db.promise().query(
            'UPDATE users SET role = ? WHERE email = ?',
            ['admin', email]
        );
        
        console.log(`✅ User ${email} has been updated to admin role!`);
        console.log('You can now login and access the admin dashboard.');
        
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        db.end();
    }
};

// Create a new admin user if needed
const createAdminUser = async (email, password, fullName) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.promise().query(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [fullName, email, hashedPassword, 'admin']
        );
        
        console.log(`✅ Admin user created successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        db.end();
    }
};

// USAGE EXAMPLES:
// 1. Update existing user to admin:
// makeUserAdmin('your-email@example.com');

// 2. Create new admin user:
// createAdminUser('admin@farmerjoin.rw', 'admin123', 'System Administrator');

// Uncomment the line below and replace with your email:
makeUserAdmin('your-email@example.com'); // <-- CHANGE THIS TO YOUR EMAIL
