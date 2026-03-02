const db = require('./config/db');

db.query('SELECT user_id, full_name, email, role FROM users WHERE user_id IN (78, 79, 80, 81, 82)', (err, results) => {
  if (err) {
    console.log('Error:', err.message);
    return;
  }
  console.log('Recent users:');
  results.forEach(user => {
    console.log('ID: ' + user.user_id + ', Name: ' + user.full_name + ', Email: ' + user.email + ', Role: "' + user.role + '"');
  });
  db.end();
});
