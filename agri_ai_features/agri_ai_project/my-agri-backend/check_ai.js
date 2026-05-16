const axios = require('axios');

const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3000';

async function check() {
    console.log('Checking AI service at', aiServiceUrl);
    try {
        const h = await axios.get(`${aiServiceUrl}/health`, { timeout: 3000 });
        console.log('/health response:', h.status, h.data);
    } catch (e) {
        console.error('/health error:', formatErr(e));
    }

    try {
        const q = await axios.post(`${aiServiceUrl}/query`, { query: 'health check', language: 'en' }, { timeout: 5000 });
        console.log('/query response:', q.status, q.data);
    } catch (e) {
        console.error('/query error:', formatErr(e));
    }
}

function formatErr(e) {
    try {
        if (!e) return 'Unknown error';
        if (e.response) return `Response error: status=${e.response.status}, data=${JSON.stringify(e.response.data)}`;
        if (e.code) return `Axios/network error: code=${e.code}, message=${e.message}`;
        if (e.request) return `No response received (request made)`;
        return `Error: ${e.message || JSON.stringify(e)}`;
    } catch (err) {
        return `Error formatting error: ${err.message}`;
    }
}

check();
