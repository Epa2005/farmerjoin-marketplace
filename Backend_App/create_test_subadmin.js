const db = require('./dbConnection');
const bcrypt = require('bcryptjs');

console.log('Creating test sub_admin user...');

const subAdminData = {
  full_name: 'Test Sub Admin',
  email: 'subadmin@farmerjoin.com',
  phone: '+250 788 123 457',
  password: 'subadmin123',
  location: 'Kigali',
  role: 'sub_admin',
  status: 'active'
};

// Hash password
bcrypt.hash(subAdminData.password, 10, (err, hashedPassword) => {
  if (err) {
    console.error('Error hashing password:', err);
    db.end();
    return;
  }

  // Insert sub_admin user
  const query = `
    INSERT INTO users (full_name, email, phone, password, location, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    subAdminData.full_name,
    subAdminData.email, 
    subAdminData.phone,
    hashedPassword,
    subAdminData.location,
    subAdminData.role,
    subAdminData.status
  ], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('Sub admin user already exists');
      } else {
        console.error('Error creating sub admin:', err);
      }
    } else {
      console.log('Test sub admin created successfully!');
      console.log('Email: subadmin@farmerjoin.com');
      console.log('Password: subadmin123');
      console.log('Location: Kigali');
      
      const subAdminId = result.insertId;
      
      // Assign location to sub_admin (assuming super_admin with id 108 exists)
      const assignmentQuery = `
        INSERT INTO sub_admin_assignments (sub_admin_id, assigned_location, assigned_by)
        VALUES (?, ?, ?)
      `;
      
      db.query(assignmentQuery, [subAdminId, 'Kigali', 108], (err, assignmentResult) => {
        if (err) {
          console.error('Failed to assign location:', err);
        } else {
          console.log('Location assignment successful!');
        }
        
        // Show current users
        db.query('SELECT user_id, full_name, email, role, status FROM users ORDER BY role', (err, results) => {
          if (!err) {
            console.log('\nCurrent users in database:');
            results.forEach(user => {
              console.log(`ID: ${user.user_id}, Name: ${user.full_name}, Role: ${user.role}, Status: ${user.status || 'NULL'}`);
            });
          }
          db.end();
        });
      });
    }
  });
});
