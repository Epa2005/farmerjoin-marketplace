const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001; // Port for your backend application
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:3000"; // URL of the AI features service (use 127.0.0.1 to avoid IPv6/localhost proxy issues)

// Simple retry policy settings
const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 600; // backoff base (ms)

app.use(bodyParser.json());

// Log all incoming requests (method, url, headers) for debugging CORS/preflight
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    // log relevant headers for CORS
    const h = {
        origin: req.headers.origin,
        acrm: req.headers['access-control-request-method'],
        acrh: req.headers['access-control-request-headers']
    };
    console.log('CORS headers:', h);
    next();
});

// Allow CORS for frontend integration
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    // Allow credentials if needed
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === 'OPTIONS') {
        // Preflight request. Respond successfully with headers and OK body.
        res.status(200).set({ 'Content-Type': 'text/plain' }).send('OK');
        return;
    }
    next();
});

// Endpoint to query the AI assistant
app.post("/api/ask-ai", async (req, res) => {
    const { query, language } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query is required' });

    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
        try {
            console.log(`Proxying /query to AI service: ${aiServiceUrl}/query`);
            const response = await axios.post(`${aiServiceUrl}/query`, { query, language }, { timeout: 120000, proxy: false });
            return res.json(response.data);
        } catch (error) {
            const errInfo = formatAxiosError(error);
            console.warn(`ask-ai attempt ${attempt + 1} failed:`, errInfo);
            // If it's the last attempt, return the formatted error
            if (attempt === RETRY_COUNT) {
                console.error("Error querying AI assistant:", errInfo, error.stack || '');
                const status = error.response && error.response.status ? error.response.status : 502;
                return res.status(status).json({ success: false, error: "Failed to get AI response", details: errInfo });
            }
            // otherwise wait a bit and retry (only for network/timeouts or 5xx)
            const is5xx = error.response && error.response.status >= 500;
            const noResponse = error.request && !error.response;
            if (noResponse || is5xx) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
                continue;
            }
            // For client errors (4xx) don't retry
            const status = error.response && error.response.status ? error.response.status : 502;
            return res.status(status).json({ success: false, error: "Failed to get AI response", details: errInfo });
        }
    }
});

// Endpoint for crop scanning (sends image data to AI service)
app.post("/api/crop-scan", async (req, res) => {
    const { image, language } = req.body; // 'image' should be base64 encoded or similar
    if (!image) return res.status(400).json({ success: false, error: 'Image data is required' });

    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
        try {
            console.log(`Proxying /crop-scan to AI service: ${aiServiceUrl}/crop-scan`);
            const response = await axios.post(`${aiServiceUrl}/crop-scan`, { image, language }, { timeout: 200000, proxy: false });
            return res.json(response.data);
        } catch (error) {
            const errInfo = formatAxiosError(error);
            console.warn(`crop-scan attempt ${attempt + 1} failed:`, errInfo);
            if (attempt === RETRY_COUNT) {
                console.error("Error during crop scan:", errInfo, error.stack || '');
                const status = error.response && error.response.status ? error.response.status : 502;
                return res.status(status).json({ success: false, error: "Failed to perform crop scan", details: errInfo });
            }
            const is5xx = error.response && error.response.status >= 500;
            const noResponse = error.request && !error.response;
            if (noResponse || is5xx) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
                continue;
            }
            const status = error.response && error.response.status ? error.response.status : 502;
            return res.status(status).json({ success: false, error: "Failed to perform crop scan", details: errInfo });
        }
    }
});

// Health endpoint to check AI service connectivity
app.get('/api/health', async (req, res) => {
    try {
        const r = await axios.get(`${aiServiceUrl}/health`, { timeout: 3000 });
        return res.json({ success: true, aiService: r.data });
    } catch (err) {
        const info = formatAxiosError(err);
        return res.status(502).json({ success: false, error: 'AI service unreachable', details: info });
    }
});

/**
 * Extract useful information from an axios error
 */
function formatAxiosError(err) {
    try {
        if (!err) return 'Unknown error';
        if (err.response) {
            return `Response error: status=${err.response.status}, data=${JSON.stringify(err.response.data)}`;
        }
        if (err.request) {
            return 'No response received from AI service (request sent)';
        }
        return `Error message: ${err.message || String(err)}`;
    } catch (e) {
        return `Error formatting axios error: ${e.message}`;
    }
}

// ---------------- Conversation support ----------------
const conversations = {};

async function callAiService(query, language) {
    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
        try {
            console.log(`Calling AI service: ${aiServiceUrl}/query`);
            const resp = await axios.post(`${aiServiceUrl}/query`, { query, language }, { timeout: 120000, proxy: false });
            return resp.data;
        } catch (error) {
            const info = formatAxiosError(error);
            console.warn(`AI call attempt ${attempt + 1} failed:`, info);
            if (attempt === RETRY_COUNT) throw error;
            const is5xx = error.response && error.response.status >= 500;
            const noResponse = error.request && !error.response;
            if (noResponse || is5xx) await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
            else throw error;
        }
    }
}

app.post('/api/conversation', async (req, res) => {
    try {
        const { sessionId, message, language = 'en' } = req.body;
        if (!message) return res.status(400).json({ success: false, error: 'message is required' });

        const sid = sessionId || `s_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        if (!conversations[sid]) conversations[sid] = [];

        conversations[sid].push({ role: 'user', text: message, ts: Date.now() });

        const recent = conversations[sid].slice(-10);
        const contextText = recent.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
        const combinedQuery = contextText + '\nAssistant, answer the last user message succinctly.';

        const aiData = await callAiService(combinedQuery, language);

        // Prefer structured content when available
        if (aiData && aiData.structured) {
            const assistantMsg = {
                role: 'assistant',
                text: (aiData.structured.summary && aiData.structured.summary.length) ? aiData.structured.summary : (aiData.answer || ''),
                structured: aiData.structured,
                ts: Date.now()
            };
            conversations[sid].push(assistantMsg);
        } else {
            const assistantText = aiData.answer || aiData.response || (typeof aiData === 'string' ? aiData : JSON.stringify(aiData));
            conversations[sid].push({ role: 'assistant', text: assistantText, ts: Date.now() });
        }

        return res.json({ success: true, sessionId: sid, response: aiData, history: conversations[sid] });
    } catch (error) {
        const info = formatAxiosError(error);
        console.error('Conversation endpoint error:', info);
        const status = error.response && error.response.status ? error.response.status : 502;
        return res.status(status).json({ success: false, error: 'Conversation failed', details: info });
    }
});

app.get('/api/conversation/:sessionId', (req, res) => {
    const sid = req.params.sessionId;
    if (!sid || !conversations[sid]) return res.status(404).json({ success: false, error: 'Session not found' });
    return res.json({ success: true, sessionId: sid, history: conversations[sid] });
});

// ---------------- end conversation support ----------------

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log(`Configured AI service URL: ${aiServiceUrl}`);
});