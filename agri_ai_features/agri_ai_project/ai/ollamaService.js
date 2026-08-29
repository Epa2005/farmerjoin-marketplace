const axios = require('axios');

class OllamaService {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud';
        this.timeout = 120000;
        this.fallbackModels = ['deepseek-v3.1:671b-cloud', 'llama3:latest', 'gemma3:270m'];
        this.availableModels = null;
    }

    async generateResponse(prompt, options = {}) {
        const { systemPrompt = '', temperature = 0.7, stream = false } = options;

        // Ensure we have a list of available models
        if (!this.availableModels) {
            const status = await this.checkStatus();
            if (status.success && Array.isArray(status.availableModels)) {
                this.availableModels = status.availableModels;
            }
        }

        if (!this.availableModels || this.availableModels.length === 0) {
            return {
                success: false,
                error: 'No models available in Ollama. Please pull a model (e.g., `ollama pull llama3:latest`).',
                message: 'No models found'
            };
        }

        const modelsToTry = [this.model, ...this.fallbackModels].filter(m => this.availableModels.includes(m));
        const uniqueModels = [...new Set(modelsToTry)];

        if (uniqueModels.length === 0) {
            return {
                success: false,
                error: `Configured models not available. Available: ${this.availableModels.join(', ')}`,
                message: 'No configured model available'
            };
        }

        for (const modelName of uniqueModels) {
            console.log(`Trying model: ${modelName}`);
            const result = await this.tryModel(modelName, prompt, systemPrompt, temperature, stream);
            if (result.success) return result;
        }

        return {
            success: false,
            error: `All configured models failed. Available: ${this.availableModels.join(', ')}`,
            message: 'All models failed'
        };
    }

    async tryModel(modelName, prompt, systemPrompt, temperature, stream) {
        try {
            const resp = await axios.post(
                `${this.baseUrl}/api/generate`,
                {
                    model: modelName,
                    prompt: prompt,
                    system: systemPrompt,
                    stream: stream,
                    options: { temperature, top_p: 0.9, top_k: 40 }
                },
                { timeout: this.timeout, headers: { 'Content-Type': 'application/json' } }
            );

            return { success: true, response: resp.data.response, model: modelName, context: resp.data.context };
        } catch (error) {
            // Log detailed axios/response info to aid debugging (502 from Ollama)
            console.error(`Error with model ${modelName}:`, error.message || error);
            if (error.response) {
                console.error('Ollama response status:', error.response.status);
                try { console.error('Ollama response data:', JSON.stringify(error.response.data)); } catch (e) { console.error('Ollama response data (raw):', error.response.data); }
            } else if (error.request) {
                console.error('No response received from Ollama. Request made:', error.request && error.request._header ? error.request._header : '[request details not available]');
            }

            if (error.code === 'ECONNREFUSED') {
                return { success: false, error: 'Ollama service is not running. Start Ollama on port 11434.', message: 'Connection refused' };
            }

            if (error.response?.status === 401) {
                return { success: false, error: 'Authentication error with Ollama.', message: '401 unauthorized' };
            }

            if (error.response?.status === 404) {
                return { success: false, error: `Model ${modelName} not found. Pull it with ollama pull ${modelName}`, message: 'Model not found' };
            }

            return { success: false, error: error.message || String(error), message: `Failed with model ${modelName}` };
        }
    }

    async chat(messages, options = {}) {
        try {
            const { temperature = 0.7, stream = false } = options;
            const resp = await axios.post(
                `${this.baseUrl}/api/chat`,
                { model: this.model, messages, stream, options: { temperature, top_p: 0.9, top_k: 40 } },
                { timeout: this.timeout, headers: { 'Content-Type': 'application/json' } }
            );
            return { success: true, response: resp.data.message.content, model: this.model, done: resp.data.done };
        } catch (error) {
            console.error('Error calling Ollama chat API:', error.message || error);
            if (error.code === 'ECONNREFUSED') return { success: false, error: 'Ollama service not running', message: 'Connection refused' };
            return { success: false, error: error.message || String(error), message: 'Failed to generate chat response' };
        }
    }

    async checkStatus() {
        try {
            const resp = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            const models = resp.data.models || [];
            return { success: true, running: true, availableModels: models.map(m => m.name), currentModel: this.model };
        } catch (error) {
            return { success: false, running: false, error: error.message || String(error), message: 'Ollama unreachable' };
        }
    }

    async analyzeImage(imageBuffer, prompt) {
        try {
            const base64Image = imageBuffer.toString('base64');
            const resp = await axios.post(
                `${this.baseUrl}/api/generate`,
                { model: this.model, prompt, images: [base64Image], stream: false },
                { timeout: this.timeout, headers: { 'Content-Type': 'application/json' } }
            );
            return { success: true, response: resp.data.response, model: this.model };
        } catch (error) {
            console.error('Error analyzing image with Ollama:', error.message || error);
            return { success: false, error: error.message || String(error), message: 'Failed to analyze image' };
        }
    }

    getSystemPrompt(language = 'en') {
        if (language === 'rw') {
            return `Ni umufasha w'ubuhinzi wa AI wo mu Rwanda. Urakora neza mu Kinyarwanda n'Icyongereza.\n\nUBURYO BWAWE:\n- Waba umufasha w'ubuhinzi binyuze ku bushakashatsi bw'ubuhinzi bwo mu Rwanda\n- Tanga amakuru y'ubuhinzi zihuse kandi zizwi neza\n- Dufate ibintu by'ubuhinji n'ubworozi byo mu Rwanda\n- Tanga inama z'ubuhinji zihuse kandi zifite agaciro\n- Ibindi: ubworozi, imbuga, ifumbire, ikirere, isoko\n- Waba wihanganira kandi ube umufasha w'ubuhinzi\n- Iyo ushoboye, tanga inama zihuse zishingiye ku bushakashatsi\n- Iyo utaba wumva, vuga ko ushobora kubafasha binyuze mu Rwanda Agriculture Board (RAB)`;
        }

        return `You are an AI agricultural assistant for Rwanda. You are knowledgeable in both English and Kinyarwanda.\n\nYOUR ROLE:\n- Provide agricultural assistance based on Rwanda's farming context\n- Give accurate, practical agricultural advice\n- Consider Rwanda-specific farming conditions and crops\n- Provide actionable farming recommendations\n- Be patient and helpful\n- If you cannot answer, suggest contacting the Rwanda Agriculture Board (RAB)`;
    }

    getDiseaseAnalysisPrompt(language = 'en') {
        if (language === 'rw') {
            return `Ni umuhanga mu kuvuga indwara z'imbuto mu Rwanda. Uraga neza ku ndwara z'imbuto zikunda gukorera mu Rwanda.\nUburyo bwawe:\n- Gura pamuza imbuga z'imbuto kugira ngo uvuge indwara\n- Vuga izina ry'indwara, ibimenyetso, uburyo bwo kuvura, n'uburyo bwo gukumira\n- Dufate ubwoko bw'imbuto bwo mu Rwanda: imbogi, ikawa, imasaka, imbuto, iringanire, cassava, uburo\n- Tanga inama zihuse z'ubuhinji\n- Vuga umuvuduko w'ubuvuzi (high, moderate, low)\n- Iyo utaba wumva, vuga ko ushobora kubafasha binyuze mu Rwanda Agriculture Board (RAB)`;
        }

        return `You are an expert in identifying crop diseases in Rwanda. Provide disease name, symptoms, treatment, and prevention methods.`;
    }

    getWeatherAdvicePrompt(language, weatherData) {
        if (language === 'rw') {
            return `Bikora neza ku miterere y'ikirere iri hejuru: ${JSON.stringify(weatherData, null, 2)}\n\nTanga inama z'ubuhinji bishingiye ku miterere y'ikirere.`;
        }

        return `Based on the following weather conditions: ${JSON.stringify(weatherData, null, 2)}\n\nProvide agricultural advice considering the weather.`;
    }
}

module.exports = new OllamaService();
