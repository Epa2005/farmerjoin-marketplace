const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

router.post("/send", auth, (req, res) => {
  const { receiver_id, message } = req.body;

  db.query(
    "INSERT INTO messages (sender_id,receiver_id,message) VALUES (?,?,?)",
    [req.user.user_id, receiver_id, message],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Message sent" });
    }
  );
});

module.exports = router;