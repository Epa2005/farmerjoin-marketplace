const express = require("express");
const router = express.Router();
const db = require("../dbConnection");
const jwt = require("jsonwebtoken");

// Simple authentication middleware (no status check)
const simpleAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        
        if (!decoded.user_id || !decoded.role) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to check if user is admin or sub_admin
const isAdminOrSubAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'student');
        if (decoded.role !== 'admin' && decoded.role !== 'sub_admin') {
            return res.status(403).json({ message: 'Access denied. Admin or Sub Admin required.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Create Order
router.post("/create", simpleAuth, (req, res) => {
  const { items } = req.body;

  db.query(
    "SELECT buyer_id FROM buyers WHERE user_id=?",
    [req.user.user_id],
    (err, buyer) => {
      if (buyer.length === 0)
        return res.status(403).json({ message: "Not a buyer" });

      const buyerId = buyer[0].buyer_id;

      db.query(
        "INSERT INTO orders (buyer_id,status) VALUES (?,?)",
        [buyerId, "pending"],
        (err, orderResult) => {
          const orderId = orderResult.insertId;

          items.forEach(item => {
            db.query(
              "INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)",
              [orderId, item.product_id, item.quantity, item.price]
            );
          });

          res.json({ message: "Order created successfully" });
        }
      );
    }
  );
});

// Get orders for buyer
router.get("/my-orders", simpleAuth, (req, res) => {
  db.query(
    "SELECT buyer_id FROM buyers WHERE user_id=?",
    [req.user.user_id],
    (err, buyer) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      if (buyer.length === 0)
        return res.status(403).json({ message: "Not a buyer" });

      const buyerProfileId = buyer[0].buyer_id;
      const userId = req.user.user_id;

      db.query(
        `SELECT o.*,
                COALESCE(SUM(oi.quantity * oi.price), o.total_amount, 0) as total_amount
         FROM orders o
         LEFT JOIN order_items oi ON o.order_id = oi.order_id
         WHERE o.buyer_id IN (?, ?)
         GROUP BY o.order_id
         ORDER BY COALESCE(o.created_at, o.order_date) DESC`,
        [userId, buyerProfileId],
        (err, orders) => {
          if (err) return res.status(500).json({ message: "Failed to fetch orders", error: err.message });
          if (!orders.length) return res.json([]);

          const orderIds = orders.map((order) => order.order_id);
          db.query(
            `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, p.product_name, p.image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.product_id
             WHERE oi.order_id IN (?)`,
            [orderIds],
            (itemsErr, items) => {
              if (itemsErr) {
                return res.status(500).json({ message: "Failed to fetch order items", error: itemsErr.message });
              }

              const itemsByOrderId = {};
              items.forEach((item) => {
                if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
                itemsByOrderId[item.order_id].push(item);
              });

              const payload = orders.map((order) => ({
                ...order,
                items: itemsByOrderId[order.order_id] || []
              }));

              res.json(payload);
            }
          );
        }
      );
    }
  );
});

// Delete buyer order
router.delete("/:orderId", simpleAuth, (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.user_id;

  if (!parseInt(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  db.query(
    "SELECT buyer_id FROM buyers WHERE user_id=?",
    [userId],
    (buyerErr, buyerRows) => {
      if (buyerErr) return res.status(500).json({ message: "Database error", error: buyerErr.message });
      if (buyerRows.length === 0) return res.status(403).json({ message: "Not a buyer" });

      const buyerProfileId = buyerRows[0].buyer_id;

      db.query(
        "SELECT order_id, status FROM orders WHERE order_id = ? AND buyer_id IN (?, ?)",
        [parseInt(orderId), userId, buyerProfileId],
        (verifyErr, verifyRows) => {
          if (verifyErr) return res.status(500).json({ message: "Failed to verify order", error: verifyErr.message });
          if (!verifyRows.length) return res.status(404).json({ message: "Order not found" });

          const protectedStatuses = ["processing", "shipped", "delivered", "completed"];
          const currentStatus = String(verifyRows[0].status || "").toLowerCase();
          if (protectedStatuses.includes(currentStatus)) {
            return res.status(400).json({ message: "This order can no longer be deleted." });
          }

          db.beginTransaction((txErr) => {
            if (txErr) return res.status(500).json({ message: "Database error" });

            db.query("DELETE FROM order_items WHERE order_id = ?", [parseInt(orderId)], (itemErr) => {
              if (itemErr) {
                return db.rollback(() => res.status(500).json({ message: "Failed to delete order items" }));
              }

              db.query(
                "DELETE FROM orders WHERE order_id = ? AND buyer_id IN (?, ?)",
                [parseInt(orderId), userId, buyerProfileId],
                (delErr, delResult) => {
                  if (delErr) {
                    return db.rollback(() => res.status(500).json({ message: "Failed to delete order" }));
                  }
                  if (delResult.affectedRows === 0) {
                    return db.rollback(() => res.status(404).json({ message: "Order not found" }));
                  }

                  db.commit((commitErr) => {
                    if (commitErr) {
                      return db.rollback(() => res.status(500).json({ message: "Failed to finalize delete" }));
                    }
                    return res.json({ message: "Order deleted successfully" });
                  });
                }
              );
            });
          });
        }
      );
    }
  );
});

// Get orders for farmer
router.get("/farmer-orders", simpleAuth, (req, res) => {
  db.query(
    "SELECT farmer_id FROM farmers WHERE user_id=?",
    [req.user.user_id],
    (err, farmer) => {
      if (farmer.length === 0)
        return res.status(403).json({ message: "Not a farmer" });

      const farmerId = farmer[0].farmer_id;

      db.query(
        `SELECT orders.*, order_items.quantity, order_items.price as item_price,
                products.product_name, products.image, users.full_name as buyer_name
         FROM orders
         JOIN order_items ON orders.order_id = order_items.order_id
         JOIN products ON order_items.product_id = products.product_id
         JOIN buyers ON orders.buyer_id = buyers.buyer_id
         JOIN users ON buyers.user_id = users.user_id
         WHERE products.farmer_id = ?
         ORDER BY orders.order_date DESC`,
        [farmerId],
        (err, result) => {
          if (err) return res.status(500).json(err);
          res.json(result);
        }
      );
    }
  );
});

// Get orders for sub-admin (orders from farmers in their assigned location)
router.get("/sub-admin-orders", isAdminOrSubAdmin, (req, res) => {
    if (req.user.role !== 'sub_admin') {
        return res.status(403).json({ message: 'Access denied. Sub Admin required.' });
    }
    
    // Get sub_admin's assigned location
    const locationQuery = `
        SELECT province, district, sector 
        FROM sub_admin_assignments 
        WHERE sub_admin_id = ? AND is_active = TRUE
        LIMIT 1
    `;
    
    db.query(locationQuery, [req.user.user_id], (err, locationResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to fetch sub_admin location' });
        }
        
        if (locationResult.length === 0) {
            console.log('No location assigned to sub-admin:', req.user.user_id);
            return res.json([]); // Return empty array if no location assigned
        }
        
        const { province, district, sector } = locationResult[0];
        
        // Get orders from farmers in the sub-admin's assigned location
        const ordersQuery = `
            SELECT DISTINCT orders.*, 
                   order_items.quantity, 
                   order_items.price as item_price,
                   products.product_name, 
                   products.image, 
                   users.full_name as buyer_name,
                   farmers.farmer_id,
                   farmer_users.full_name as farmer_name,
                   farmer_users.email as farmer_email
            FROM orders
            JOIN order_items ON orders.order_id = order_items.order_id
            JOIN products ON order_items.product_id = products.product_id
            JOIN farmers ON products.farmer_id = farmers.farmer_id
            JOIN users farmer_users ON farmers.user_id = farmer_users.user_id
            JOIN buyers ON orders.buyer_id = buyers.buyer_id
            JOIN users ON buyers.user_id = users.user_id
            WHERE farmer_users.province = ? 
              AND farmer_users.district = ? 
              AND farmer_users.sector = ?
            ORDER BY orders.order_date DESC
        `;
        
        db.query(ordersQuery, [province, district, sector], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
            }
            
            console.log(`Sub-admin ${req.user.user_id} fetched ${results.length} orders from location: ${province}, ${district}, ${sector}`);
            return res.json(results);
        });
    });
});

module.exports = router;
