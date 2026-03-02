const db = require('./config/db');

// Check table structure
db.query('DESCRIBE users', (err, results) => {
  if (err) {
    console.log('Error:', err.message);
    return;
  }
  console.log('Users table structure:');
  results.forEach(column => {
    console.log('Field: ' + column.Field + ', Type: ' + column.Type + ', Null: ' + column.Null + ', Default: ' + column.Default);
  });
  
  // Try to update one specific user
  db.query('UPDATE users SET role = "cooperative" WHERE user_id = 78', (err2, result2) => {
    if (err2) {
      console.log('Error updating specific user:', err2.message);
      return;
    }
    console.log('Update result:', result2);
    
    // Check the specific user
    db.query('SELECT user_id, full_name, email, role FROM users WHERE user_id = 78', (err3, results3) => {
      if (err3) {
        console.log('Error checking user:', err3.message);
        return;
      }
      console.log('User 78:', results3[0]);
      db.end();
    });
  });
});
