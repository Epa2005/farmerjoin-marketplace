const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'farmerjoin_db'
});

console.log('Checking orders table structure...');

// First, check if columns exist
db.query('DESCRIBE orders', (err, results) => {
  if (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
  
  const columns = results.map(col => col.Field);
  console.log('Current columns:', columns);
  
  // Check what's missing
  const missingColumns = [];
  
  if (!columns.includes('total_amount')) {
    missingColumns.push('total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER buyer_id');
  }
  
  if (!columns.includes('delivery_address')) {
    missingColumns.push('delivery_address TEXT NOT NULL DEFAULT "" AFTER status');
  }
  
  if (!columns.includes('payment_status')) {
    missingColumns.push('payment_status ENUM("pending", "paid", "failed", "refunded") DEFAULT "pending" AFTER payment_method');
  }
  
  if (missingColumns.length > 0) {
    console.log('Missing columns:', missingColumns);
    
    // Add missing columns
    missingColumns.forEach(column => {
      const alterQuery = `ALTER TABLE orders ADD COLUMN ${column}`;
      console.log('Executing:', alterQuery);
      
      db.query(alterQuery, (err, result) => {
        if (err) {
          console.log('Error adding column:', err.message);
        } else {
          console.log('Column added successfully!');
        }
      });
    });
  } else {
    console.log('All required columns exist!');
  }
  
  db.end();
});
