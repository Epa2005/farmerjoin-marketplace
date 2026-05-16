const express = require('express');

const axios = require('axios');



const router = express.Router();

const AGriBackend = process.env.AGRI_BACKEND_URL || 'http://127.0.0.1:3001';



// Generate fallback response based on system context when AI is unavailable

function generateFallbackResponse(message, context) {

    const msg = message.toLowerCase();

    const { availableProducts, productCategories, userOrders, platformStats, userRole } = context || {};

    

    // Product-related queries

    if (msg.includes('product') || msg.includes('available') || msg.includes('buy') || msg.includes('sell')) {

        if (availableProducts && availableProducts.length > 0) {

            const productList = availableProducts.slice(0, 5).map(p => `${p.name} (${p.category}) - ${p.price} RWF`).join('\n• ');

            return {

                response: `Here are some available products on FarmerJoin:\n\n• ${productList}\n\n... and ${availableProducts.length - 5} more products available. You can browse all products on the Products page.`,

                structured: {

                    summary: `Found ${availableProducts.length} products available on the platform`,

                    recommendations: ['Visit the Products page to browse all items', 'Use filters to find specific categories', 'Contact farmers directly for bulk orders'],

                    details: `Categories available: ${productCategories?.join(', ') || 'Various'}`

                }

            };

        }

        return {

            response: 'I apologize, but I cannot access the product catalog at the moment. Please visit the Products page to see available items.'

        };

    }

    

    // Order-related queries

    if (msg.includes('order') || msg.includes('my purchase') || msg.includes('delivery')) {

        if (userOrders && userOrders.length > 0) {

            const orderList = userOrders.map(o => `Order #${o.orderId}: ${o.status} - ${o.total} RWF (${o.items} items)`).join('\n• ');

            return {

                response: `Here are your recent orders:\n\n• ${orderList}\n\nYou can view full details on the Orders page.`,

                structured: {

                    summary: `You have ${userOrders.length} recent orders`,

                    recommendations: ['Visit My Orders page for full details', 'Contact farmers for delivery updates', 'Leave reviews after receiving products']

                }

            };

        }

        return {

            response: 'You don\'t have any recent orders. Visit the Products page to start shopping!'

        };

    }

    

    // Platform statistics queries

    if (msg.includes('statistic') || msg.includes('how many') || msg.includes('platform')) {

        if (platformStats) {

            return {

                response: `FarmerJoin Platform Statistics:\n\n• ${platformStats.totalFarmers} registered farmers\n• ${platformStats.totalBuyers} active buyers\n• ${platformStats.totalProducts} products listed\n• ${platformStats.totalTransactions} orders completed`,

                structured: {

                    summary: 'FarmerJoin Platform Overview',

                    details: `Our platform connects ${platformStats.totalFarmers} farmers with ${platformStats.totalBuyers} buyers, offering ${platformStats.totalProducts} products.`

                }

            };

        }

    }

    

    // Farmer-specific queries

    if (userRole === 'farmer' && (msg.includes('my sales') || msg.includes('my orders'))) {

        return {

            response: 'As a farmer, you can view your sales and orders on the Farmer Dashboard. I can see you have access to the platform\'s order management system.'

        };

    }

    

    return null; // No fallback available, let the error handler deal with it

}



// Health

router.get('/health', async (req, res) => {

    try {

        const r = await axios.get(`${AGriBackend}/api/health`, { timeout: 5000 });

        return res.status(200).json({ success: true, upstream: r.data });

    } catch (e) {

        return res.status(502).json({ success: false, error: 'Agri backend unreachable', details: e.message });

    }

});



// Conversation endpoints (proxy)

router.post('/conversation', async (req, res) => {

    try {

        // Include system context in the request to AI backend

        const payload = {

            ...req.body,

            systemContext: req.body.context || null

        };

        const r = await axios.post(`${AGriBackend}/api/conversation`, payload, { timeout: 120000 });

        return res.status(r.status).json(r.data);

    } catch (e) {

        // Try to generate fallback response using system context

        const fallback = generateFallbackResponse(req.body.message, req.body.context);

        if (fallback) {

            console.log('AI backend unavailable, using fallback response');

            return res.status(200).json({

                response: fallback.response,

                structured: fallback.structured || null,

                sessionId: req.body.sessionId || `fallback_${Date.now()}`,

                fallback: true

            });

        }

        

        const status = e.response?.status || 502;

        const data = e.response?.data || { success: false, error: e.message };

        return res.status(status).json(data);

    }

});



router.get('/conversation/:sessionId', async (req, res) => {

    try {

        const r = await axios.get(`${AGriBackend}/api/conversation/${encodeURIComponent(req.params.sessionId)}`, { timeout: 10000 });

        return res.status(r.status).json(r.data);

    } catch (e) {

        const status = e.response?.status || 502;

        const data = e.response?.data || { success: false, error: e.message };

        return res.status(status).json(data);

    }

});



// Proxy generic ask-ai and crop-scan

router.post('/ask-ai', async (req, res) => {

    try {

        // Include system context in the request

        const payload = {

            ...req.body,

            systemContext: req.body.context || null

        };

        const r = await axios.post(`${AGriBackend}/api/ask-ai`, payload, { timeout: 120000 });

        return res.status(r.status).json(r.data);

    } catch (e) {

        // Try to generate fallback response using system context

        const fallback = generateFallbackResponse(req.body.question || req.body.message, req.body.context);

        if (fallback) {

            console.log('AI backend unavailable, using fallback response for ask-ai');

            return res.status(200).json({

                answer: fallback.response,

                structured: fallback.structured || null,

                fallback: true

            });

        }

        

        const status = e.response?.status || 502;

        const data = e.response?.data || { success: false, error: e.message };

        return res.status(status).json(data);

    }

});



router.post('/crop-scan', async (req, res) => {

    // Forward as-is; client must use multipart to my-agri-backend or this proxy will not handle buffers.

    try {

        const r = await axios.post(`${AGriBackend}/api/crop-scan`, req.body, { timeout: 200000 });

        return res.status(r.status).json(r.data);

    } catch (e) {

        const status = e.response?.status || 502;

        const data = e.response?.data || { success: false, error: e.message };

        return res.status(status).json(data);

    }

});



module.exports = router;

