const express = require('express');
const bodyParser = require('body-parser');
const assistant = require('./ai/agriculturalAssistant');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Simple request logger to help debug connectivity from backend
app.use((req, res, next) => {
    console.log(`[AI service] ${req.method} ${req.url} - body:`, req.body || {});
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('AI features service is running');
});

// Main endpoint for agricultural queries
app.post('/query', async (req, res) => {
    const { query, language } = req.body;

    if (!query) {
        return res.status(400).json({ success: false, error: 'Query is required' });
    }

    try {
        const response = await assistant.processQuery(query, language);
        res.json(response);
    } catch (error) {
        console.error('Error in /query endpoint:', error);
        res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
    }
});

// Endpoint for crop scanning (placeholder, as it requires image input)
app.post('/crop-scan', async (req, res) => {
    const { image, language } = req.body; // 'image' would be a base64 encoded string or similar

    if (!image) {
        return res.status(400).json({ success: false, error: 'Image data is required for crop scanning' });
    }

    // In a real scenario, you would process the image here using a dedicated AI model
    // For this implementation, we'll return a placeholder response as discussed.
    const response = await assistant.handleCropScan('image_input_received', language);
    res.json(response);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`AI features service listening at http://0.0.0.0:${port}`);
});
