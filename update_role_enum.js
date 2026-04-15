const db = require('./Backend_App/dbConnection');

console.log('Updating role enum to remove super_admin...');

// Update the role enum to remove super_admin
const alterQuery = "ALTER TABLE users MODIFY COLUMN role ENUM('sub_admin', 'admin', 'farmer', 'cooperative', 'buyer') NOT NULL";

db.query(alterQuery, (err, result) => {
  if (err) {
    console.error('Error updating role enum:', err);
    db.end();
    return;
  }
  
  console.log('Successfully updated role enum to remove super_admin');
  
  // Check current schema
  db.query('DESCRIBE users', (err, results) => {
    if (!err) {
      console.log('\nCurrent users table columns (role field):');
      results.forEach(column => {
        if (column.Field === 'role') {
          console.log(`- ${column.Field} (${column.Type})`);
        }
      });
    }
    db.end();
  });
});
