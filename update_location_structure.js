const db = require('./Backend_App/dbConnection');

console.log('Updating location structure to province,district,sector format...');

const alterQueries = [
  // Add province column
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(100) NULL",
  
  // Add district column
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL",
  
  // Add sector column
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS sector VARCHAR(100) NULL",
  
  // Update sub_admin_assignments table to use structured location
  "ALTER TABLE sub_admin_assignments ADD COLUMN IF NOT EXISTS province VARCHAR(100) NULL",
  "ALTER TABLE sub_admin_assignments ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL", 
  "ALTER TABLE sub_admin_assignments ADD COLUMN IF NOT EXISTS sector VARCHAR(100) NULL"
];

async function executeUpdates() {
  try {
    console.log('Adding structured location columns...');
    
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

    console.log('\nDatabase schema updated successfully!');
    
    // Check current schema
    db.query('DESCRIBE users', (err, results) => {
      if (!err) {
        console.log('\nCurrent users table columns (location-related):');
        results.forEach(column => {
          if (column.Field.includes('location') || column.Field.includes('province') || 
              column.Field.includes('district') || column.Field.includes('sector')) {
            console.log(`- ${column.Field} (${column.Type})`);
          }
        });
      }
      
      // Check sub_admin_assignments schema
      db.query('DESCRIBE sub_admin_assignments', (err, results) => {
        if (!err) {
          console.log('\nCurrent sub_admin_assignments table columns (location-related):');
          results.forEach(column => {
            if (column.Field.includes('location') || column.Field.includes('province') || 
                column.Field.includes('district') || column.Field.includes('sector')) {
              console.log(`- ${column.Field} (${column.Type})`);
            }
          });
        }
        db.end();
      });
    });

  } catch (error) {
    console.error('Update failed:', error);
    db.end();
  }
}

executeUpdates();
