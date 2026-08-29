const db = require('./Backend_App/dbConnection');

console.log('Checking current user roles...');

db.query('SELECT user_id, full_name, email, role, status FROM users ORDER BY user_id', (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('\nCurrent users in database:');
    console.log('ID | Name | Email | Role | Status');
    console.log('---|------|-------|------|-------');
    results.forEach(user => {
      console.log(`${user.user_id} | ${user.full_name} | ${user.email} | ${user.role} | ${user.status || 'NULL'}`);
    });
  }
  db.end();
});
