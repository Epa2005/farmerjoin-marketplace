const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
router.post("/register", async (req, res) => {
  const { full_name, email, phone, password, role, province, district, sector } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (full_name,email,phone,password,role,province,district,sector,location) VALUES (?,?,?,?,?,?,?,?,?)",
    [full_name, email, phone, hashed, role, province || null, district || null, sector || null, 
     (province && district && sector) ? `${province},${district},${sector}` : null],
    (err, result) => {
      if (err) return res.status(500).json(err);

      const userId = result.insertId;

      if (role === "farmer") {
        const locationString = (province && district && sector) ? `${province}, ${district}, ${sector}` : "Location not set";
        db.query("INSERT INTO farmers (user_id, farm_name, bio, location, phone) VALUES (?, ?, ?, ?, ?)", 
          [userId, full_name + "'s Farm", "Welcome to my farm!", locationString, phone], 
          (err, result) => {
            if (err) {
              console.error("Error creating farmer profile:", err);
              // Don't fail registration, just log the error
            }
          }
        );
      }

      if (role === "cooperative") {
        db.query("INSERT INTO cooperatives (user_id, cooperative_name, location, phone) VALUES (?, ?, ?, ?)", 
          [userId, full_name + " Cooperative", "Location not set", phone], 
          (err, result) => {
            if (err) {
              console.error("Error creating cooperative profile:", err);
              // Don't fail registration, just log the error
            }
          }
        );
      }

      if (role === "buyer") {
        db.query("INSERT INTO buyers (user_id) VALUES (?)", [userId]);
      }

      res.json({ message: "User registered successfully" });
    }
  );
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (result.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = result[0];
    
    // Special handling for admin - check plain text password
    if (user.role === 'admin' && email === 'admin@farmerjoin.rw' && password === 'admin123') {
      const token = jwt.sign(
        { user_id: user.user_id, role: user.role },
        "secretkey"
      );

      return res.json({ 
        token,
        user: {
          user_id: user.user_id,
          role: user.role,
          full_name: user.full_name,
          email: user.email
        }
      });
    }

    // For other users, use bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      "secretkey"
    );

    res.json({ 
      token,
      user: {
        user_id: user.user_id,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      }
    });
  });
});

// DELETE user (admin only)
router.delete("/:userId", (req, res) => {
  const { userId } = req.params;
  
  db.query('DELETE FROM users WHERE user_id = ?', [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  });
});

// UPDATE user (admin only)
router.put("/:userId", (req, res) => {
  const { userId } = req.params;
  const { full_name, email, phone } = req.body;
  
  db.query(
    'UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ?',
    [full_name, email, phone, userId],
    (err, result) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ message: 'Failed to update user' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'User updated successfully' });
    }
  );
});

// FORGOT PASSWORD (for buyers)
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if user exists and is a buyer
  db.query(
    "SELECT * FROM users WHERE email = ? AND role = 'buyer'",
    [email],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "No buyer account found with this email" });
      }

      const user = result[0];
      
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      // Hash the temporary password
      bcrypt.hash(tempPassword, 10, (hashErr, hashedTempPassword) => {
        if (hashErr) {
          console.error("Error hashing temporary password:", hashErr);
          return res.status(500).json({ message: "Error generating temporary password" });
        }

        // Update user's password with temporary password
        db.query(
          "UPDATE users SET password = ? WHERE user_id = ?",
          [hashedTempPassword, user.user_id],
          (updateErr) => {
            if (updateErr) {
              console.error("Error updating password:", updateErr);
              return res.status(500).json({ message: "Error updating password" });
            }

            // In a real application, you would send this via email
            // For now, we'll return it in the response
            res.json({
              message: "Temporary password generated successfully",
              temporaryPassword: tempPassword,
              email: user.email,
              fullName: user.full_name
            });
          }
        );
      });
    }
  );
});

module.exports = router;