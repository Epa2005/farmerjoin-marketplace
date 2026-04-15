const db = require('./Backend_App/dbConnection');

console.log('Converting super_admin users to admin role...');

// Update all super_admin users to admin
db.query('UPDATE users SET role = "admin" WHERE role = "super_admin"', (err, result) => {
  if (err) {
    console.error('Error converting super_admin to admin:', err);
    db.end();
    return;
  }
  
  console.log(`Successfully converted ${result.affectedRows} super_admin users to admin`);
  
  // Check current users
  db.query('SELECT user_id, full_name, email, role FROM users ORDER BY role', (err, results) => {
    if (!err) {
      console.log('\nCurrent users in database:');
      results.forEach(user => {
        console.log(`ID: ${user.user_id}, Name: ${user.full_name}, Email: ${user.email}, Role: ${user.role}`);
      });
    }
    db.end();
  });
});
