const axios = require('axios');

// Africa's Talking SMS Service Configuration
const AFRICASTALKING_API_URL = process.env.AFRICASTALKING_API_URL || 'https://api.sandbox.africastalking.com/version1/messaging';
const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox'; // Replace with your username
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY || ''; // Replace with your API key

// Check if Africa's Talking credentials are configured
const isAfricaTalkingConfigured = AFRICASTALKING_API_KEY && AFRICASTALKING_API_KEY !== '' && AFRICASTALKING_USERNAME && AFRICASTALKING_USERNAME !== 'sandbox';

/**
 * Send SMS using Africa's Talking API
 * @param {string} to - Recipient phone number (format: +2507XXXXXXXX)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - API response
 */
async function sendSMS(to, message) {
    try {
        console.log('=== Sending SMS ===');
        console.log('To:', to);
        console.log('Message:', message);
        console.log('Africa\'s Talking Configured:', isAfricaTalkingConfigured);

        // Simulation mode when Africa's Talking credentials are not configured
        if (!isAfricaTalkingConfigured) {
            console.log('⚠️  Africa\'s Talking not configured - using simulation mode');
            console.log('📱 Simulated SMS to:', to);
            console.log('📝 Message:', message);
            
            return {
                success: true,
                data: {
                    message: 'SMS sent in simulation mode (configure Africa\'s Talking credentials for real SMS)',
                    to: to,
                    message: message
                }
            };
        }

        // Real Africa's Talking API call
        const response = await axios.post(
            `${AFRICASTALKING_API_URL}`,
            null,
            {
                params: {
                    username: AFRICASTALKING_USERNAME,
                    to: to,
                    message: message
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apiKey': AFRICASTALKING_API_KEY
                }
            }
        );

        console.log('SMS sent successfully:', response.data);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error sending SMS:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Send payment confirmation SMS to buyer
 * @param {string} buyerPhone - Buyer's phone number
 * @param {string} orderDetails - Order details
 * @param {number} amount - Payment amount
 */
async function sendBuyerPaymentConfirmation(buyerPhone, orderDetails, amount) {
    const message = `Payment Confirmation: Your payment of ${amount} RWF has been received. Order #${orderDetails.order_id} is being processed. Thank you for shopping with FarmerJoin!`;
    return await sendSMS(buyerPhone, message);
}

/**
 * Send payment notification SMS to seller/farmer
 * @param {string} sellerPhone - Seller's phone number
 * @param {string} orderDetails - Order details
 * @param {number} amount - Payment amount
 */
async function sendSellerPaymentNotification(sellerPhone, orderDetails, amount) {
    const message = `New Order Alert: You received a payment of ${amount} RWF for order #${orderDetails.order_id}. Please prepare the items for delivery. FarmerJoin Marketplace.`;
    return await sendSMS(sellerPhone, message);
}

/**
 * Send order confirmation SMS to buyer
 * @param {string} buyerPhone - Buyer's phone number
 * @param {string} orderDetails - Order details
 */
async function sendOrderConfirmation(buyerPhone, orderDetails) {
    const message = `Order Confirmation: Your order #${orderDetails.order_id} has been confirmed. Expected delivery: ${orderDetails.delivery_date || '2-3 business days'}. Track your order in the app. FarmerJoin Marketplace.`;
    return await sendSMS(buyerPhone, message);
}

module.exports = {
    sendSMS,
    sendBuyerPaymentConfirmation,
    sendSellerPaymentNotification,
    sendOrderConfirmation
};
