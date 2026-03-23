const express = require("express");
const router = express.Router();
const db = require("../dbConnection");
const auth = require("../middleware/auth");

// Create Order
router.post("/create", auth, (req, res) => {
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
router.get("/my-orders", auth, (req, res) => {
  db.query(
    "SELECT buyer_id FROM buyers WHERE user_id=?",
    [req.user.user_id],
    (err, buyer) => {
      if (buyer.length === 0)
        return res.status(403).json({ message: "Not a buyer" });

      const buyerId = buyer[0].buyer_id;

      db.query(
        `SELECT orders.*, 
                SUM(order_items.quantity * order_items.price) as total_amount,
                GROUP_CONCAT(CONCAT(order_items.quantity, 'x ', products.product_name) SEPARATOR ', ') as items_summary
         FROM orders
         JOIN order_items ON orders.order_id = order_items.order_id
         JOIN products ON order_items.product_id = products.product_id
         WHERE orders.buyer_id = ?
         GROUP BY orders.order_id
         ORDER BY orders.order_date DESC`,
        [buyerId],
        (err, result) => {
          if (err) return res.status(500).json(err);
          res.json(result);
        }
      );
    }
  );
});

// Get orders for farmer
router.get("/farmer-orders", auth, (req, res) => {
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

module.exports = router;