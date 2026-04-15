const db = require('./Backend_App/dbConnection');

console.log('Adding location column to users table...');

const alterQuery = `
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL
`;

db.query(alterQuery, (err, result) => {
  if (err) {
    if (err.message.includes('already exists')) {
      console.log('Location column already exists');
    } else {
      console.error('Error adding location column:', err);
    }
  } else {
    console.log('Location column added successfully!');
  }
  
  // Check current schema
  db.query('DESCRIBE users', (err, results) => {
    if (!err) {
      console.log('\nCurrent users table columns:');
      results.forEach(column => {
        console.log(`- ${column.Field} (${column.Type})`);
      });
    }
    db.end();
  });
});
