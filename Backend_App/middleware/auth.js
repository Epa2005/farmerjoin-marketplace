const jwt = require("jsonwebtoken");
const rateLimit = require('express-rate-limit');
const db = require("../dbConnection");

// Enhanced authentication middleware with security improvements
module.exports = (req, res, next) => {
  // First check for JWT token
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader);

  if (authHeader) {
    try {
      // Extract token from "Bearer <token>" format
      const token = authHeader.replace('Bearer ', '');
      console.log('Token extracted:', token.substring(0, 50) + '...');

      // Validate token format
      if (!token || token.split('.').length !== 3) {
        console.log('Invalid token format');
        return res.status(401).json({ message: "Invalid token format" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
      console.log('Token decoded successfully:', decoded);

      // Validate decoded token structure
      if (!decoded.user_id || !decoded.role) {
        console.log('Invalid token payload:', decoded);
        return res.status(401).json({ message: "Invalid token payload" });
      }

      // Check user status in database to enforce ban/suspension
      db.query("SELECT user_id, role, status FROM users WHERE user_id = ?", [decoded.user_id], (err, result) => {
        if (err) {
          console.error('Database error checking user status:', err);
          return res.status(500).json({ message: "Authentication error" });
        }

        if (result.length === 0) {
          console.log('User not found in database:', decoded.user_id);
          return res.status(401).json({ message: "User not found" });
        }

        const user = result[0];

        // Check if user is banned or suspended (case-insensitive)
        const userStatus = user.status ? user.status.toLowerCase() : 'inactive';
        if (userStatus !== 'active') {
          console.log(`User ${decoded.user_id} access denied - status: ${user.status}`);
          let message = "Account is inactive";
          if (userStatus === 'banned') {
            message = "Your account has been banned. You no longer have access to the system.";
          } else if (userStatus === 'suspended') {
            message = "Your account has been suspended. Contact support for assistance.";
          }
          return res.status(403).json({ message: message, status: user.status });
        }

        req.user = decoded;
        req.user.status = user.status;
        console.log('Authentication successful for user:', decoded.user_id, 'status:', user.status);
        return next();
      });
    } catch (error) {
      // Log security event with detailed error
      console.warn('JWT verification failed:', error.message);
      console.warn('JWT Error Name:', error.name);
      console.warn('JWT Secret used:', process.env.JWT_SECRET ? 'From env' : 'Default (secretkey)');
      console.warn('JWT Token received (first 100 chars):', authHeader?.replace('Bearer ', '').substring(0, 100));

      // Token invalid - return 401 immediately with specific error
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token expired, please login again" });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token format" });
      } else {
        return res.status(401).json({ message: "Authentication failed: " + error.message });
      }
    }
  }

  // Check for session-based authentication
  if (req.session && req.session.user) {
    // Validate session structure
    if (!req.session.user.user_id || !req.session.user.role) {
      req.session.destroy();
      return res.status(401).json({ message: "Invalid session structure" });
    }

    // Get user from database to check status
    const db = require("../dbConnection");
    db.query("SELECT user_id, role, status FROM users WHERE username=?", [req.session.user], (err, result) => {
      if (err) {
        console.error('Database error in auth middleware:', err);
        return res.status(500).json({ message: "Authentication error" });
      }

      if (result.length === 0) {
        req.session.destroy();
        return res.status(401).json({ message: "Invalid session" });
      }

      const user = result[0];

      // Check if user is banned or suspended (case-insensitive)
      const userStatus = user.status ? user.status.toLowerCase() : 'inactive';
      if (userStatus !== 'active') {
        console.log(`Session user ${user.user_id} access denied - status: ${user.status}`);
        req.session.destroy();
        let message = "Account is inactive";
        if (userStatus === 'banned') {
          message = "Your account has been banned. You no longer have access to the system.";
        } else if (userStatus === 'suspended') {
          message = "Your account has been suspended. Contact support for assistance.";
        }
        return res.status(403).json({ message: message, status: user.status });
      }

      req.user = { user_id: user.user_id, role: user.role, status: user.status };
      next();
    });
  } else {
    res.status(403).json({ message: "No authentication found" });
  }
};

// Role-based access control middleware
module.exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
};

// Admin-only middleware
module.exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};