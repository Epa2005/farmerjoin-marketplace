const db = require('./config/db');

// Add cooperative to the role enum
db.query('ALTER TABLE users MODIFY COLUMN role ENUM("farmer","buyer","admin","cooperative") NOT NULL', (err, result) => {
  if (err) {
    console.log('Error altering table:', err.message);
    return;
  }
  console.log('Successfully updated role enum to include cooperative');
  
  // Now update the cooperative users
  db.query('UPDATE users SET role = "cooperative" WHERE user_id IN (78, 79, 80, 81, 82)', (err2, result2) => {
    if (err2) {
      console.log('Error updating roles:', err2.message);
      return;
    }
    console.log('Updated', result2.affectedRows, 'users to cooperative role');
    
    // Verify the update
    db.query('SELECT user_id, full_name, email, role FROM users WHERE user_id IN (78, 79, 80, 81, 82)', (err3, results) => {
      if (err3) {
        console.log('Error verifying:', err3.message);
        return;
      }
      console.log('Updated users:');
      results.forEach(user => {
        console.log('ID: ' + user.user_id + ', Name: ' + user.full_name + ', Email: ' + user.email + ', Role: "' + user.role + '"');
      });
      db.end();
    });
  });
});
