const db = require('./config/db');

// Update cooperative users to have proper role
db.query('UPDATE users SET role = "cooperative" WHERE user_id IN (78, 79, 80, 81, 82)', (err, result) => {
  if (err) {
    console.log('Error updating roles:', err.message);
    return;
  }
  console.log('Updated', result.affectedRows, 'users to cooperative role');
  
  // Verify the update
  db.query('SELECT user_id, full_name, email, role FROM users WHERE user_id IN (78, 79, 80, 81, 82)', (err2, results) => {
    if (err2) {
      console.log('Error verifying:', err2.message);
      return;
    }
    console.log('Updated users:');
    results.forEach(user => {
      console.log('ID: ' + user.user_id + ', Name: ' + user.full_name + ', Email: ' + user.email + ', Role: "' + user.role + '"');
    });
    db.end();
  });
});
