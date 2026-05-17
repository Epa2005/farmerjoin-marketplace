const express = require('express');
const router = express.Router();
const db = require('../dbConnection');

// Get platform statistics
router.get('/platform', async (req, res) => {
    // Helper to run queries with the existing db.query callback API
    const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
        try {
            db.query(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        } catch (e) {
            reject(e);
        }
    });

    try {
        console.log('Fetching platform statistics (callback-style)...');

        // total farmers - try farmers table then users role
        let totalFarmers = 0;
        try {
            const farmers = await runQuery('SELECT COUNT(*) as total FROM farmers');
            totalFarmers = farmers?.[0]?.total || 0;
        } catch (e) {
            try {
                const alt = await runQuery('SELECT COUNT(*) as total FROM users WHERE role = ?', ['farmer']);
                totalFarmers = alt?.[0]?.total || 0;
            } catch (e2) {
                console.error('Counting farmers failed:', e2.message || e2);
            }
        }

        // total orders
        let totalOrders = 0;
        try {
            const orders = await runQuery('SELECT COUNT(*) as total FROM orders');
            totalOrders = orders?.[0]?.total || 0;
        } catch (e) {
            console.error('Counting orders failed:', e.message || e);
        }

        // total transactions (sum total_amount)
        let totalTransactions = 0;
        try {
            const tx = await runQuery('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders');
            totalTransactions = tx?.[0]?.total || 0;
        } catch (e) {
            console.error('Summing transactions failed:', e.message || e);
        }

        // total products
        let totalProducts = 0;
        try {
            const products = await runQuery('SELECT COUNT(*) as total FROM products WHERE status = ?', ['active']);
            totalProducts = products?.[0]?.total || 0;
        } catch (e) {
            console.error('Counting products failed:', e.message || e);
        }

        // total buyers
        let totalBuyers = 0;
        try {
            const buyers = await runQuery('SELECT COUNT(*) as total FROM buyers WHERE status = ?', ['active']);
            totalBuyers = buyers?.[0]?.total || 0;
        } catch (e) {
            try {
                const alt = await runQuery('SELECT COUNT(*) as total FROM users WHERE role = ?', ['buyer']);
                totalBuyers = alt?.[0]?.total || 0;
            } catch (e2) {
                console.error('Counting buyers failed:', e2.message || e2);
            }
        }

        const foundedYear = 2026;

        const responseData = { totalFarmers, totalOrders, totalTransactions, totalProducts, totalBuyers, foundedYear };
        console.log('Stats response:', responseData);
        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Platform stats error:', error);
        res.status(500).json({ success: false, message: 'Error fetching platform stats', error: error.message || error });
    }
});

module.exports = router;
