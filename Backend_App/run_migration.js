const db = require('./dbConnection');
const fs = require('fs');

// Read the migration SQL file
const migrationSQL = fs.readFileSync('../database_migration.sql', 'utf8');

// Split the SQL file into individual statements
const statements = migrationSQL
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0 && !statement.startsWith('--'));

console.log('Starting database migration...');

// Execute each statement
let completedStatements = 0;
const totalStatements = statements.length;

function executeStatement(index) {
  if (index >= totalStatements) {
    console.log('Migration completed successfully!');
    console.log(`Executed ${completedStatements} statements.`);
    db.end();
    return;
  }

  const statement = statements[index];
  
  // Skip comments and empty statements
  if (statement.startsWith('--') || statement.trim() === '') {
    executeStatement(index + 1);
    return;
  }

  db.query(statement, (err, result) => {
    if (err) {
      // Some statements might fail if they already exist (like CREATE TABLE IF NOT EXISTS)
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || 
          err.code === 'ER_DUP_FIELDNAME' || 
          err.code === 'ER_DUP_KEYNAME' ||
          err.code === 'ER_CANT_CREATE_TABLE' ||
          err.message.includes('already exists')) {
        console.log(`Statement ${index + 1}/${totalStatements}: Already exists or skipped - ${statement.substring(0, 50)}...`);
      } else {
        console.error(`Error executing statement ${index + 1}:`, err.message);
        console.error('Statement:', statement);
      }
    } else {
      console.log(`Statement ${index + 1}/${totalStatements}: Success - ${statement.substring(0, 50)}...`);
      completedStatements++;
    }
    
    // Continue to next statement
    executeStatement(index + 1);
  });
}

// Start executing statements
executeStatement(0);
