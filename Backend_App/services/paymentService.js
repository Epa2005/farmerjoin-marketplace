const axios = require('axios');

// pawaPay Configuration
const PAWAPAY_API_URL = process.env.PAWAPAY_API_URL || 'https://sandbox.pawapay.com'; // Use sandbox for testing
const PAWAPAY_API_KEY = process.env.PAWAPAY_API_KEY || ''; // Replace with your pawaPay API key
const PAWAPAY_MERCHANT_ID = process.env.PAWAPAY_MERCHANT_ID || ''; // Replace with your merchant ID

// Check if pawaPay credentials are configured
const isPawaPayConfigured = PAWAPAY_API_KEY && PAWAPAY_MERCHANT_ID && PAWAPAY_API_KEY !== '' && PAWAPAY_MERCHANT_ID !== '';

/**
 * Send mobile money payment request via pawaPay
 * @param {Object} paymentDetails - Payment information
 * @param {string} paymentDetails.phoneNumber - Buyer's phone number (format: 2507XXXXXXXX)
 * @param {string} paymentDetails.recipientPhone - Farmer's phone number (recipient)
 * @param {number} paymentDetails.amount - Payment amount
 * @param {string} paymentDetails.currency - Currency code (e.g., RWF)
 * @param {string} paymentDetails.reference - Unique payment reference
 * @param {string} paymentDetails.callbackUrl - Webhook URL for payment status updates
 * @returns {Promise<Object>} - Payment request response
 */
async function initiateMobileMoneyPayment(paymentDetails) {
    try {
        console.log('=== Initiating Mobile Money Payment ===');
        console.log('Payment Details:', paymentDetails);
        console.log('Buyer Phone:', paymentDetails.phoneNumber);
        console.log('Recipient Phone (Farmer):', paymentDetails.recipientPhone);
        console.log('pawaPay Configured:', isPawaPayConfigured);

        // Simulation mode when pawaPay credentials are not configured
        if (!isPawaPayConfigured) {
            console.log('⚠️  pawaPay not configured - using simulation mode');
            // Simulate successful payment after 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const simulatedPaymentId = `SIM-${Date.now()}`;
            console.log('✅ Simulated payment initiated:', simulatedPaymentId);
            
            return {
                success: true,
                data: {
                    payment_id: simulatedPaymentId,
                    status: 'PENDING',
                    message: 'Payment initiated in simulation mode (configure pawaPay credentials for real payments)'
                }
            };
        }

        // Real pawaPay API call
        const response = await axios.post(
            `${PAWAPAY_API_URL}/v1/payments`,
            {
                merchant_id: PAWAPAY_MERCHANT_ID,
                amount: paymentDetails.amount,
                currency: paymentDetails.currency || 'RWF',
                phone_number: paymentDetails.phoneNumber, // Buyer's phone number
                recipient_phone: paymentDetails.recipientPhone, // Farmer's phone number (recipient)
                reference: paymentDetails.reference,
                callback_url: paymentDetails.callbackUrl,
                description: paymentDetails.description || 'FarmerJoin Marketplace Purchase'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PAWAPAY_API_KEY}`
                }
            }
        );

        console.log('Payment initiated successfully:', response.data);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error initiating payment:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Check payment status via pawaPay
 * @param {string} paymentId - pawaPay payment ID
 * @returns {Promise<Object>} - Payment status response
 */
async function checkPaymentStatus(paymentId) {
    try {
        console.log('=== Checking Payment Status ===');
        console.log('Payment ID:', paymentId);

        const response = await axios.get(
            `${PAWAPAY_API_URL}/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${PAWAPAY_API_KEY}`
                }
            }
        );

        console.log('Payment status:', response.data);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error checking payment status:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Process pawaPay callback
 * @param {Object} callbackData - Callback data from pawaPay
 * @returns {Object} - Processed callback information
 */
function processPaymentCallback(callbackData) {
    console.log('=== Processing Payment Callback ===');
    console.log('Callback Data:', callbackData);

    const {
        payment_id,
        reference,
        status,
        amount,
        currency,
        phone_number,
        timestamp
    } = callbackData;

    return {
        paymentId: payment_id,
        reference: reference,
        status: status, // SUCCESS, FAILED, PENDING
        amount: amount,
        currency: currency,
        phoneNumber: phone_number,
        timestamp: timestamp,
        isSuccessful: status === 'SUCCESS'
    };
}

module.exports = {
    initiateMobileMoneyPayment,
    checkPaymentStatus,
    processPaymentCallback
};
