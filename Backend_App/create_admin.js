const bcrypt = require('bcryptjs');

// Generate hashed password for admin user
const password = 'epa123';
const hashedPassword = bcrypt.hashSync(password, 10);

console.log('=== ADMIN USER CREATION ===');
console.log('Full Name: epa1');
console.log('Email: epa123@gmail.com');
console.log('Phone: 0785018691');
console.log('Password: epa123');
console.log('Hashed Password:', hashedPassword);
console.log('');

// SQL command to insert admin user
console.log('=== SQL COMMAND ===');
console.log(`INSERT INTO users (full_name, email, phone, password, role, created_at, status) 
VALUES ('epa1', 'epa123@gmail.com', '0785018691', '${hashedPassword}', 'admin', NOW(), 'active');`);
console.log('');
