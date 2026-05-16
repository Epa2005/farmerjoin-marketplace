const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'project6',
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    }
});

// Read the project1.sql file
const project1SQL = fs.readFileSync(path.join(__dirname, 'project1.sql'), 'utf8');

// Split SQL into individual statements (simple approach)
const statements = project1SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

connection.connect(async (err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    
    console.log('Connected to Aiven database. Starting migration...');
    
    // Execute statements in order
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
            await new Promise((resolve, reject) => {
                connection.query(statement, (err, result) => {
                    if (err) {
                        // Ignore if table already exists or other non-critical errors
                        if (err.code === 'ER_TABLE_EXISTS_ERROR' || 
                            err.code === 'ER_DUP_ENTRY' ||
                            err.code === 'ER_DUP_KEYNAME') {
                            console.log(`Statement ${i + 1}: Skipped (already exists)`);
                            resolve();
                        } else {
                            console.error(`Statement ${i + 1} error:`, err.message);
                            // Continue with other statements
                            resolve();
                        }
                    } else {
                        console.log(`Statement ${i + 1}: Success`);
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error(`Statement ${i + 1} failed:`, error);
        }
    }
    
    console.log('Migration completed!');
    connection.end();
});
