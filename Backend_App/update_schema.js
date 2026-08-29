const db = require('./dbConnection');

console.log('Updating database schema for user management...');

// Add missing columns to users table
const alterQueries = [
  // Add status column
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'banned', 'suspended') DEFAULT 'active'",
  
  // Add ban/suspend columns
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by VARCHAR(255) NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP NULL", 
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by VARCHAR(255) NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_by VARCHAR(255) NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_location VARCHAR(255) NULL",
  
  // Update role column to include new roles
  "ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'sub_admin', 'admin', 'farmer', 'cooperative', 'buyer') NOT NULL"
];

// Create management tables
const createQueries = [
  // User management logs table
  `CREATE TABLE IF NOT EXISTS user_management_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admin_id INT NOT NULL COMMENT 'ID of admin/sub_admin who performed action',
    action ENUM('banned', 'unbanned', 'suspended', 'unsuspended', 'role_changed', 'location_assigned') NOT NULL,
    reason TEXT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
  )`,
  
  // Sub admin assignments table
  `CREATE TABLE IF NOT EXISTS sub_admin_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_admin_id INT NOT NULL,
    assigned_location VARCHAR(255) NOT NULL,
    assigned_by INT NOT NULL COMMENT 'ID of admin who assigned this location',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sub_admin_id (sub_admin_id),
    INDEX idx_location (assigned_location),
    INDEX idx_is_active (is_active)
  )`
];

// Update existing admin to super_admin
const updateQueries = [
  "UPDATE users SET role = 'super_admin' WHERE role = 'admin'"
];

async function executeQueries() {
  try {
    console.log('Step 1: Adding missing columns...');
    for (let i = 0; i < alterQueries.length; i++) {
      const query = alterQueries[i];
      await new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) {
            console.log(`Column ${i + 1}: ${err.message.includes('already exists') ? 'Already exists' : 'Error: ' + err.message}`);
          } else {
            console.log(`Column ${i + 1}: Added successfully`);
          }
          resolve();
        });
      });
    }

    console.log('\nStep 2: Creating management tables...');
    for (let i = 0; i < createQueries.length; i++) {
      const query = createQueries[i];
      await new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) {
            console.log(`Table ${i + 1}: ${err.message.includes('already exists') ? 'Already exists' : 'Error: ' + err.message}`);
          } else {
            console.log(`Table ${i + 1}: Created successfully`);
          }
          resolve();
        });
      });
    }

    console.log('\nStep 3: Updating existing admin users...');
    for (let i = 0; i < updateQueries.length; i++) {
      const query = updateQueries[i];
      await new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) {
            console.log(`Update ${i + 1}: Error - ${err.message}`);
          } else {
            console.log(`Update ${i + 1}: ${result.affectedRows} rows updated`);
          }
          resolve();
        });
      });
    }

    console.log('\nDatabase schema update completed successfully!');
    
    // Check current users
    db.query('SELECT user_id, full_name, email, role, status FROM users LIMIT 5', (err, results) => {
      if (!err) {
        console.log('\nCurrent users in database:');
        results.forEach(user => {
          console.log(`ID: ${user.user_id}, Name: ${user.full_name}, Email: ${user.email}, Role: ${user.role}, Status: ${user.status || 'NULL'}`);
        });
      }
      db.end();
    });

  } catch (error) {
    console.error('Migration failed:', error);
    db.end();
  }
}

executeQueries();
