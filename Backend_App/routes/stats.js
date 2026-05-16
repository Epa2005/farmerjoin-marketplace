const express = require('express');
const router = express.Router();
const db = require('../dbConnection');

// Get platform statistics
router.get('/platform', async (req, res) => {
    try {
        console.log('Fetching platform statistics...');
        
        // Check if farmers table exists and get count
        let totalFarmers = 0;
        try {
            const [farmersResult] = await db.promise().query(
                'SELECT COUNT(*) as total FROM farmers'
            );
            totalFarmers = farmersResult[0]?.total || 0;
            console.log('Total farmers:', totalFarmers);
        } catch (err) {
            console.error('Error counting farmers:', err.message);
            // Try alternative table name
            try {
                const [altResult] = await db.promise().query(
                    'SELECT COUNT(*) as total FROM users WHERE role = "farmer"'
                );
                totalFarmers = altResult[0]?.total || 0;
                console.log('Total farmers from users table:', totalFarmers);
            } catch (altErr) {
                console.error('Error counting farmers from users table:', altErr.message);
            }
        }

        // Check if orders table exists and get count
        let totalOrders = 0;
        try {
            const [ordersResult] = await db.promise().query(
                'SELECT COUNT(*) as total FROM orders'
            );
            totalOrders = ordersResult[0]?.total || 0;
            console.log('Total orders:', totalOrders);
        } catch (err) {
            console.error('Error counting orders:', err.message);
        }

        // Get total transactions value (sum of all order amounts, not just delivered)
        let totalTransactions = 0;
        try {
            const [transactionsResult] = await db.promise().query(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders'
            );
            totalTransactions = transactionsResult[0]?.total || 0;
            console.log('Total transactions (all orders):', totalTransactions);
        } catch (err) {
            console.error('Error calculating transactions:', err.message);
        }

        // Get total products count
        let totalProducts = 0;
        try {
            const [productsResult] = await db.promise().query(
                'SELECT COUNT(*) as total FROM products WHERE status = "active"'
            );
            totalProducts = productsResult[0]?.total || 0;
            console.log('Total products:', totalProducts);
        } catch (err) {
            console.error('Error counting products:', err.message);
        }

        // Get total buyers count
        let totalBuyers = 0;
        try {
            const [buyersResult] = await db.promise().query(
                'SELECT COUNT(*) as total FROM buyers WHERE status = "active"'
            );
            totalBuyers = buyersResult[0]?.total || 0;
            console.log('Total buyers:', totalBuyers);
        } catch (err) {
            console.error('Error counting buyers:', err.message);
            // Try alternative table name
            try {
                const [altResult] = await db.promise().query(
                    'SELECT COUNT(*) as total FROM users WHERE role = "buyer"'
                );
                totalBuyers = altResult[0]?.total || 0;
                console.log('Total buyers from users table:', totalBuyers);
            } catch (altErr) {
                console.error('Error counting buyers from users table:', altErr.message);
            }
        }

        // Platform founding year (can be configured or hardcoded)
        const foundedYear = 2026;

        const responseData = {
            totalFarmers,
            totalOrders,
            totalTransactions,
            totalProducts,
            totalBuyers,
            foundedYear
        };
        
        console.log('Sending response:', responseData);
        
        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching platform stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching platform statistics',
            error: error.message
        });
    }
});

module.exports = router;
