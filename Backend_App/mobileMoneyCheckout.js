const express = require('express');
const router = express.Router();
const paymentService = require('./services/paymentService');
const smsService = require('./services/smsService');
const db = require('./config/db');

/**
 * Mobile Money Checkout Endpoint
 * Initiates mobile money payment via pawaPay
 */
router.post('/mobile-money/checkout', async (req, res) => {
    console.log('=== Mobile Money Checkout ===');
    
    const { buyer_id, cart_items, total_amount, phone_number, delivery_address } = req.body;
    
    // Validate input
    if (!buyer_id || !cart_items || !total_amount || !phone_number) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    try {
        // Get farmer phone number from the first cart item
        const firstItem = cart_items[0];
        const farmerQuery = `
            SELECT u.phone as farmer_phone, u.full_name as farmer_name
            FROM users u
            JOIN farmers f ON u.user_id = f.user_id
            JOIN products p ON f.farmer_id = p.farmer_id
            WHERE p.product_id = ?
        `;
        
        const farmerResult = await new Promise((resolve, reject) => {
            db.query(farmerQuery, [firstItem.product_id], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
        
        if (!farmerResult || !farmerResult.farmer_phone) {
            return res.status(400).json({ message: 'Farmer phone number not found' });
        }
        
        console.log('Farmer phone number:', farmerResult.farmer_phone);
        console.log('Buyer phone number:', phone_number);
        
        // Generate unique payment reference
        const paymentReference = `ORDER-${Date.now()}-${buyer_id}`;
        
        // Create pending order
        const orderQuery = `
            INSERT INTO orders (buyer_id, total_amount, status, delivery_address, 
                             payment_method, payment_reference, order_date, created_at)
            VALUES (?, ?, 'pending_payment', ?, 'mobile_money', ?, NOW(), NOW())
        `;
        
        const orderResult = await new Promise((resolve, reject) => {
            db.query(orderQuery, [buyer_id, total_amount, delivery_address, paymentReference], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        const orderId = orderResult.insertId;
        
        // Create order items and reduce stock
        for (const item of cart_items) {
            const orderItemQuery = `
                INSERT INTO order_items (order_id, product_id, quantity, price, farmer_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;
            
            // Get farmer_id and current quantity for this product
            const productQuery = 'SELECT farmer_id, quantity FROM products WHERE product_id = ?';
            const productResult = await new Promise((resolve, reject) => {
                db.query(productQuery, [item.product_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });
            
            // Check if sufficient stock
            if (productResult.quantity < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for product ${item.product_id}. Only ${productResult.quantity} available, but you requested ${item.quantity}.` 
                });
            }
            
            // Reduce stock immediately (for simulation mode and reliability)
            await new Promise((resolve, reject) => {
                db.query(
                    'UPDATE products SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?',
                    [item.quantity, item.product_id, item.quantity],
                    (err, results) => {
                        if (err) reject(err);
                        else {
                            console.log(`Stock reduced for product ${item.product_id} by ${item.quantity}`);
                            console.log(`Affected rows:`, results.affectedRows);
                            resolve();
                        }
                    }
                );
            });
            
            await new Promise((resolve, reject) => {
                db.query(orderItemQuery, [orderId, item.product_id, item.quantity, item.price, productResult.farmer_id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        
        // Initiate mobile money payment via pawaPay
        // Use buyer's phone number to send money to farmer's phone number
        const paymentDetails = {
            phoneNumber: phone_number.replace('+', ''), // Buyer's phone number
            amount: total_amount,
            currency: 'RWF',
            reference: paymentReference,
            callbackUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/mobile-money/callback`,
            description: `Payment to FarmerJoin Order #${orderId} for ${farmerResult.farmer_name}`,
            recipientPhone: farmerResult.farmer_phone.replace('+', '') // Farmer's phone number (recipient)
        };
        
        const paymentResponse = await paymentService.initiateMobileMoneyPayment(paymentDetails);
        
        if (!paymentResponse.success) {
            // Rollback order creation if payment initiation fails
            await new Promise((resolve) => {
                db.query('DELETE FROM orders WHERE order_id = ?', [orderId], () => resolve());
            });
            
            return res.status(400).json({ 
                message: 'Failed to initiate payment',
                error: paymentResponse.error 
            });
        }
        
        // Store payment ID for callback handling
        const paymentId = paymentResponse.data.payment_id;
        
        await new Promise((resolve, reject) => {
            db.query(
                'UPDATE orders SET payment_id = ? WHERE order_id = ?',
                [paymentId, orderId],
                (err) => err ? reject(err) : resolve()
            );
        });
        
        // Send SMS notifications for successful order
        try {
            // Get buyer phone number
            const buyerQuery = 'SELECT phone, full_name FROM users WHERE user_id = ?';
            const buyerResult = await new Promise((resolve, reject) => {
                db.query(buyerQuery, [buyer_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });
            
            if (buyerResult && buyerResult.phone) {
                // Send SMS to buyer
                await smsService.sendOrderConfirmation(buyerResult.phone, {
                    order_id: orderId,
                    delivery_date: '2-3 business days'
                });
                console.log('SMS sent to buyer:', buyerResult.phone);
            }
            
            // Send SMS to farmers
            for (const item of cart_items) {
                const farmerQuery = `
                    SELECT u.phone, u.full_name 
                    FROM users u 
                    JOIN farmers f ON u.user_id = f.user_id 
                    JOIN products p ON f.farmer_id = p.farmer_id
                    WHERE p.product_id = ?
                `;
                const farmerResult = await new Promise((resolve, reject) => {
                    db.query(farmerQuery, [item.product_id], (err, results) => {
                        if (err) reject(err);
                        else resolve(results[0]);
                    });
                });
                
                if (farmerResult && farmerResult.phone) {
                    await smsService.sendSellerPaymentNotification(farmerResult.phone, {
                        order_id: orderId
                    }, total_amount);
                    console.log('SMS sent to farmer:', farmerResult.phone);
                }
            }
        } catch (smsError) {
            console.error('SMS notification failed (order still successful):', smsError);
            // Don't fail the order if SMS fails
        }
        
        res.json({
            success: true,
            message: 'Payment initiated successfully',
            order_id: orderId,
            payment_id: paymentId,
            payment_reference: paymentReference,
            amount: total_amount,
            status: 'pending_payment',
            next_step: 'Please confirm payment on your phone'
        });
        
    } catch (error) {
        console.error('Mobile money checkout error:', error);
        res.status(500).json({ 
            message: 'Checkout failed',
            error: error.message 
        });
    }
});

/**
 * pawaPay Callback Endpoint
 * Receives payment status updates from pawaPay
 */
router.post('/mobile-money/callback', async (req, res) => {
    console.log('=== pawaPay Callback Received ===');
    console.log('Callback Data:', req.body);
    
    try {
        // Process callback data
        const callbackData = paymentService.processPaymentCallback(req.body);
        
        // Update order status based on payment status
        const { paymentId, reference, isSuccessful, amount, phoneNumber } = callbackData;
        
        if (isSuccessful) {
            // Get order details to reduce stock
            const orderItemsQuery = `
                SELECT oi.product_id, oi.quantity 
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.order_id
                WHERE o.payment_reference = ? OR o.payment_id = ?
            `;
            
            const orderItems = await new Promise((resolve, reject) => {
                db.query(orderItemsQuery, [reference, paymentId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            // Stock already reduced in initial checkout, no need to reduce again
            
            // Update order to paid status
            await new Promise((resolve, reject) => {
                db.query(
                    `UPDATE orders 
                     SET status = 'paid', payment_status = 'completed', updated_at = NOW() 
                     WHERE payment_reference = ? OR payment_id = ?`,
                    [reference, paymentId],
                    (err) => err ? reject(err) : resolve()
                );
            });
            
            // Get order details for SMS notifications
            const orderQuery = `
                SELECT o.order_id, o.buyer_id, o.total_amount, o.delivery_address,
                       u.phone as buyer_phone, u.email as buyer_email,
                       GROUP_CONCAT(p.product_name) as products
                FROM orders o
                JOIN users u ON o.buyer_id = u.user_id
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.product_id
                WHERE o.payment_reference = ? OR o.payment_id = ?
                GROUP BY o.order_id
            `;
            
            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderQuery, [reference, paymentId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });
            
            if (orderResult) {
                // Send SMS notifications
                await smsService.sendBuyerPaymentConfirmation(
                    orderResult.buyer_phone,
                    { order_id: orderResult.order_id },
                    orderResult.total_amount
                );
                
                // Get seller/farmer phone numbers for notification
                const sellerQuery = `
                    SELECT DISTINCT u.phone, u.email
                    FROM users u
                    JOIN farmers f ON u.user_id = f.user_id
                    JOIN products p ON f.farmer_id = p.farmer_id
                    JOIN order_items oi ON p.product_id = oi.product_id
                    WHERE oi.order_id = ?
                `;
                
                const sellerResult = await new Promise((resolve, reject) => {
                    db.query(sellerQuery, [orderResult.order_id], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });
                
                // Send notification to each seller
                for (const seller of sellerResult) {
                    await smsService.sendSellerPaymentNotification(
                        seller.phone,
                        { order_id: orderResult.order_id },
                        orderResult.total_amount
                    );
                }
            }
            
            console.log('Payment successful and notifications sent');
        } else {
            // Update order to failed status
            await new Promise((resolve, reject) => {
                db.query(
                    `UPDATE orders 
                     SET status = 'payment_failed', payment_status = 'failed', updated_at = NOW() 
                     WHERE payment_reference = ? OR payment_id = ?`,
                    [reference, paymentId],
                    (err) => err ? reject(err) : resolve()
                );
            });
            
            console.log('Payment failed');
        }
        
        // Acknowledge receipt of callback
        res.status(200).json({ message: 'Callback received' });
        
    } catch (error) {
        console.error('Callback processing error:', error);
        res.status(500).json({ message: 'Callback processing failed' });
    }
});

/**
 * Check Payment Status
 * Allows frontend to check payment status
 */
router.get('/mobile-money/status/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    
    try {
        const statusResponse = await paymentService.checkPaymentStatus(paymentId);
        
        if (statusResponse.success) {
            res.json({
                success: true,
                status: statusResponse.data.status,
                paymentDetails: statusResponse.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: statusResponse.error
            });
        }
    } catch (error) {
        console.error('Payment status check error:', error);
        res.status(500).json({ message: 'Failed to check payment status' });
    }
});

module.exports = router;
