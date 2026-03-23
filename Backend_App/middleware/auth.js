const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // First check for JWT token
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      // Extract token from "Bearer <token>" format
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, "secretkey");
      req.user = decoded;
      return next();
    } catch {
      // Token invalid, continue to check session
    }
  }

  // Check for session-based authentication
  if (req.session && req.session.user) {
    // Get user from database to get user_id
    const db = require("../dbConnection");
    db.query("SELECT user_id, role FROM users WHERE username=?", [req.session.user], (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ message: "Invalid session" });
      }
      req.user = { user_id: result[0].user_id, role: result[0].role };
      next();
    });
  } else {
    res.status(403).json({ message: "No authentication found" });
  }
};