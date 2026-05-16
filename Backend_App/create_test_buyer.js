const db = require('./dbConnection');
const bcrypt = require('bcrypt');

const hashedPassword = bcrypt.hashSync('password123', 10);

db.query('INSERT INTO users (full_name, email, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())', 
    ['Test Buyer', 'buyer@test.com', '+250788123456', hashedPassword, 'buyer'], (err, result) => {
    if (err) {
        console.error('Error creating test buyer:', err);
    } else {
        console.log('Test buyer created successfully!');
        console.log('Email: buyer@test.com');
        console.log('Password: password123');
        console.log('User ID:', result.insertId);
    }
    process.exit(0);
});
