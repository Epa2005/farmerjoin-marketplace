const db = require('./config/db');
const bcrypt = require('bcryptjs');

// Show all current users
const showAllUsers = async () => {
    try {
        const [users] = await db.promise().query(
            'SELECT user_id, full_name, email, role, created_at FROM users ORDER BY user_id'
        );
        
        console.log('\n=== ALL USERS IN DATABASE ===');
        console.log('ID\tName\t\t\tEmail\t\t\tRole\tCreated');
        console.log('--------------------------------------------------------------------------------');
        users.forEach(user => {
            console.log(`${user.user_id}\t${user.full_name.padEnd(20)}\t${user.email.padEnd(20)}\t${user.role}\t${new Date(user.created_at).toLocaleDateString()}`);
        });
        console.log('--------------------------------------------------------------------------------\n');
        
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

// Update user to admin
const makeUserAdmin = async (userId) => {
    try {
        await db.promise().query(
            'UPDATE users SET role = ? WHERE user_id = ?',
            ['admin', userId]
        );
        
        console.log(`✅ User ID ${userId} has been updated to admin role!`);
        
        // Show updated user info
        const [updatedUser] = await db.promise().query(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );
        
        if (updatedUser.length > 0) {
            console.log(`Updated user: ${updatedUser[0].full_name} (${updatedUser[0].email})`);
        }
        
    } catch (error) {
        console.error('Error updating user:', error);
    }
};

// Main function
const main = async () => {
    console.log('🔧 ADMIN SETUP TOOL\n');
    
    // Show all users
    const users = await showAllUsers();
    
    if (users.length === 0) {
        console.log('No users found in database.');
        db.end();
        return;
    }
    
    // Find existing admins
    const admins = users.filter(user => user.role === 'admin');
    if (admins.length > 0) {
        console.log(`📋 Found ${admins.length} existing admin(s):`);
        admins.forEach(admin => {
            console.log(`   - ${admin.full_name} (${admin.email}) - ID: ${admin.user_id}`);
        });
        console.log('');
    }
    
    console.log('📝 To make a user admin, run this command:');
    console.log('   node -e "require(\'./make_admin_interactive.js\').makeUserAdmin(USER_ID)"');
    console.log('');
    console.log('Replace USER_ID with the actual ID from the list above.');
    console.log('');
    console.log('Example: node -e "require(\'./make_admin_interactive.js\').makeUserAdmin(1)"');
    
    db.end();
};

// Export functions for external calls
module.exports = { makeUserAdmin, showAllUsers };

// Run main function if called directly
if (require.main === module) {
    main();
}
