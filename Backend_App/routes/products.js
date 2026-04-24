const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/products/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });


// Add product
router.post("/add", auth, upload.single("image"), async (req, res) => {
  const { product_name, category, price, quantity} = req.body;
  const image = req.file ? `uploads/products/${req.file.filename}` : null;

  db.query(
    "SELECT farmer_id FROM farmers WHERE user_id=?",
    [req.user.user_id],
    (err, farmer) => {
      if (farmer.length === 0)
        return res.status(403).json({ message: "Not a farmer" });

      db.query(
        "INSERT INTO products (farmer_id,product_name,category,price,quantity,image) VALUES (?,?,?,?,?,?)",
        [
          farmer[0].farmer_id,
          product_name,
          category,
          price,
          quantity,
          image
        ],
        err => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Product added" });
        }
      );
    }
  );
});

// Get products
router.get("/", (req, res) => {
  db.query(
    `SELECT products.*, users.full_name, users.photo
     FROM products
     JOIN farmers ON products.farmer_id=farmers.farmer_id
     JOIN users ON farmers.user_id=users.user_id`,
    (err, result) => {
      res.json(result);
    }
  );
});

// Get single product
router.get("/:id", (req, res) => {
  const productId = req.params.id;
  db.query(
    `SELECT products.*, users.full_name, users.photo
     FROM products
     JOIN farmers ON products.farmer_id=farmers.farmer_id
     JOIN users ON farmers.user_id=users.user_id
     WHERE products.product_id = ?`,
    [productId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) return res.status(404).json({ message: "Product not found" });
      res.json(result[0]);
    }
  );
});

// Update product
router.put("/:id", auth, upload.single("image"), (req, res) => {
  const { product_name, category, price, quantity } = req.body;
  const productId = req.params.id;
  const image = req.file ? `uploads/products/${req.file.filename}` : null;

  // First check if the product belongs to the farmer
  db.query(
    `SELECT products.farmer_id FROM products
     JOIN farmers ON products.farmer_id = farmers.farmer_id
     WHERE products.product_id = ? AND farmers.user_id = ?`,
    [productId, req.user.user_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) return res.status(403).json({ message: "Not authorized to update this product" });

      let query, params;
      if (image) {
        query = "UPDATE products SET product_name=?, category=?, price=?, quantity=?, image=? WHERE product_id=?";
        params = [product_name, category, price, quantity, image, productId];
      } else {
        query = "UPDATE products SET product_name=?, category=?, price=?, quantity=? WHERE product_id=?";
        params = [product_name, category, price, quantity, productId];
      }

      db.query(query, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Product updated successfully" });
      });
    }
  );
});

// Delete product
router.delete("/:id", auth, (req, res) => {
  const productId = req.params.id;

  // First check if the product belongs to the farmer and get image path
  db.query(
    `SELECT products.farmer_id, products.image FROM products
     JOIN farmers ON products.farmer_id = farmers.farmer_id
     WHERE products.product_id = ? AND farmers.user_id = ?`,
    [productId, req.user.user_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) return res.status(403).json({ message: "Not authorized to delete this product" });

      const imagePath = result[0].image;

      // First delete order_items that reference this product (to avoid foreign key constraint)
      db.query("DELETE FROM order_items WHERE product_id=?", [productId], (err) => {
        if (err) {
          console.error('Error deleting order_items:', err);
          // Continue with product deletion even if order_items deletion fails
        }

        // Delete product from database
        db.query("DELETE FROM products WHERE product_id=?", [productId], (err, result) => {
          if (err) return res.status(500).json(err);

          // Delete image file if it exists
          if (imagePath) {
            const fullPath = path.join(__dirname, '..', imagePath);
            fs.unlink(fullPath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Error deleting image file:', unlinkErr);
                // Don't fail the request if image deletion fails
              } else {
                console.log('Image file deleted successfully:', fullPath);
              }
            });
          }

          res.json({ message: "Product deleted successfully" });
        });
      });
    }
  );
});

// Clean up orphaned products (products with no associated farmer)
router.delete("/cleanup/orphaned", auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Only admin can perform this action" });
  }

  // Get orphaned products with their images
  db.query(
    `SELECT p.product_id, p.image, p.farmer_id 
     FROM products p 
     LEFT JOIN farmers f ON p.farmer_id = f.farmer_id 
     WHERE f.farmer_id IS NULL`,
    (err, orphanedProducts) => {
      if (err) return res.status(500).json(err);

      if (orphanedProducts.length === 0) {
        return res.json({ message: "No orphaned products found" });
      }

      console.log(`Found ${orphanedProducts.length} orphaned products`);

      // Delete each orphaned product and its image
      let deletedCount = 0;
      orphanedProducts.forEach((product) => {
        // Delete image file if exists
        if (product.image) {
          const fullPath = path.join(__dirname, '..', product.image);
          fs.unlink(fullPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting image file:', unlinkErr);
            } else {
              console.log('Image file deleted successfully:', fullPath);
            }
          });
        }

        // Delete product from database
        db.query("DELETE FROM products WHERE product_id=?", [product.product_id], (deleteErr) => {
          if (deleteErr) {
            console.error('Error deleting orphaned product:', product.product_id, deleteErr);
          } else {
            deletedCount++;
            console.log('Orphaned product deleted:', product.product_id);

            // Check if all products are deleted
            if (deletedCount === orphanedProducts.length) {
              res.json({ 
                message: `Successfully deleted ${deletedCount} orphaned products`,
                deletedCount: deletedCount
              });
            }
          }
        });
      });
    }
  );
});

module.exports = router;