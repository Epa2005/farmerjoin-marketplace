const axios = require('axios');

/**
 * Ollama AI Service
 * Interfaces with local Ollama instance for AI-powered responses
 */
class OllamaService {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud';
        this.timeout = 120000; // 120 seconds timeout (increased)
        // Fallback models to try if primary model fails (using user's available models)
        this.fallbackModels = ['deepseek-v3.1:671b-cloud', 'llama3:latest', 'gemma3:270m'];
        this.availableModels = null;
    }

    /**
     * Generate response using Ollama
     * @param {string} prompt - The prompt to send to the model
     * @param {object} options - Additional options (system prompt, temperature, etc.)
     * @returns {Promise<Object>} AI response
     */
    async generateResponse(prompt, options = {}) {
        const {
            systemPrompt = '',
            temperature = 0.7,
            stream = false
        } = options;

        // Get available models from Ollama
        if (!this.availableModels) {
            const status = await this.checkStatus();
            if (status.success && status.availableModels) {
                this.availableModels = status.availableModels;
            }
        }

        // If no models available, return error
        if (!this.availableModels || this.availableModels.length === 0) {
            return {
                success: false,
                error: 'No models available in Ollama. Please pull a model: ollama pull llama3:latest',
                message: 'No models found'
            };
        }

        // Create list of models to try (primary + fallbacks that are actually available)
        const modelsToTry = [this.model, ...this.fallbackModels].filter(model => 
            this.availableModels.includes(model)
        );

        // Remove duplicates
        const uniqueModels = [...new Set(modelsToTry)];

        if (uniqueModels.length === 0) {
            return {
                success: false,
                error: `No configured models available. Available models: ${this.availableModels.join(', ')}`,
                message: 'Configured models not found'
            };
        }

        // Try each available model
        for (const modelName of uniqueModels) {
            console.log(`Trying model: ${modelName}`);
            let result = await this.tryModel(modelName, prompt, systemPrompt, temperature, stream);
            if (result.success) {
                return result;
            }
        }

        // All models failed
        return {
            success: false,
            error: `All models failed. Available models: ${this.availableModels.join(', ')}`,
            message: 'Failed to generate AI response with any available model'
        };
    }

    async tryModel(modelName, prompt, systemPrompt, temperature, stream) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/generate`,
                {
                    model: modelName,
                    prompt: prompt,
                    system: systemPrompt,
                    stream: stream,
                    options: {
                        temperature: temperature,
                        top_p: 0.9,
                        top_k: 40
                    }
                },
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                response: response.data.response,
                model: modelName,
                context: response.data.context
            };
        } catch (error) {
            console.error(`Error with model ${modelName}:`, error.message);
            
            // Check if Ollama is running
            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    error: 'Ollama service is not running. Please start Ollama on port 11434.',
                    message: 'Connection refused - ensure Ollama is running'
                };
            }

            // Check for 401 authentication error
            if (error.response?.status === 401) {
                return {
                    success: false,
                    error: 'Authentication error with Ollama. The model may require authentication or may not exist.',
                    message: '401 error - model may not be available'
                };
            }

            // Check for 404 model not found
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: `Model ${modelName} not found. Please pull the model: ollama pull ${modelName}`,
                    message: 'Model not found'
                };
            }

            return {
                success: false,
                error: error.message,
                message: `Failed with model ${modelName}`
            };
        }
    }

    /**
     * Generate response with chat history (for conversational AI)
     * @param {Array} messages - Array of message objects {role: 'user'|'assistant', content: string}
     * @param {object} options - Additional options
     * @returns {Promise<Object>} AI response
     */
    async chat(messages, options = {}) {
        try {
            const {
                temperature = 0.7,
                stream = false
            } = options;

            const response = await axios.post(
                `${this.baseUrl}/api/chat`,
                {
                    model: this.model,
                    messages: messages,
                    stream: stream,
                    options: {
                        temperature: temperature,
                        top_p: 0.9,
                        top_k: 40
                    }
                },
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                response: response.data.message.content,
                model: this.model,
                done: response.data.done
            };
        } catch (error) {
            console.error('Error calling Ollama chat API:', error.message);
            
            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    error: 'Ollama service is not running. Please start Ollama on port 11434.',
                    message: 'Connection refused - ensure Ollama is running'
                };
            }

            return {
                success: false,
                error: error.message,
                message: 'Failed to generate AI chat response'
            };
        }
    }

    /**
     * Check if Ollama is running and the model is available
     * @returns {Promise<Object>} Status check result
     */
    async checkStatus() {
        try {
            // Check if Ollama is running
            const response = await axios.get(`${this.baseUrl}/api/tags`, {
                timeout: 5000
            });

            const models = response.data.models || [];
            const modelAvailable = models.some(m => m.name === this.model);

            return {
                success: true,
                running: true,
                modelAvailable: modelAvailable,
                availableModels: models.map(m => m.name),
                currentModel: this.model
            };
        } catch (error) {
            return {
                success: false,
                running: false,
                error: error.message,
                message: 'Ollama is not running or not accessible'
            };
        }
    }

    /**
     * Analyze image using Ollama vision (if supported by model)
     * @param {Buffer} imageBuffer - Image buffer
     * @param {string} prompt - Analysis prompt
     * @returns {Promise<Object>} Image analysis result
     */
    async analyzeImage(imageBuffer, prompt) {
        try {
            const base64Image = imageBuffer.toString('base64');

            const response = await axios.post(
                `${this.baseUrl}/api/generate`,
                {
                    model: this.model,
                    prompt: prompt,
                    images: [base64Image],
                    stream: false
                },
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                response: response.data.response,
                model: this.model
            };
        } catch (error) {
            console.error('Error analyzing image with Ollama:', error.message);
            
            return {
                success: false,
                error: error.message,
                message: 'Failed to analyze image with Ollama'
            };
        }
    }

    /**
     * Get system prompt for agricultural assistant based on language
     * @param {string} language - 'en' or 'rw'
     * @returns {string} System prompt
     */
    getSystemPrompt(language = 'en') {
        if (language === 'rw') {
            return `Ni umufasha w'ubuhinzi wa AI wo mu Rwanda. Urakora neza mu Kinyarwanda n'Icyongereza.

UBURYO BWAWE:
- Waba umufasha w'ubuhinzi binyuze ku bushakashatsi bw'ubuhinzi bwo mu Rwanda
- Tanga amakuru y'ubuhinzi zihuse kandi zizwi neza
- Dufate ibintu by'ubuhinji n'ubworozi byo mu Rwanda
- Tanga inama z'ubuhinji zihuse kandi zifite agaciro
- Ibindi: ubworozi, imbuga, ifumbire, ikirere, isoko
- Waba wihanganira kandi ube umufasha w'ubuhinzi
- Iyo ushoboye, tanga inama zihuse zishingiye ku bushakashatsi
- Iyo utaba wumva, vuga ko ushobora kubafasha binyuze mu Rwanda Agriculture Board (RAB)

IBIKORWA BYOSE BY'UBUHINJI BYO MU RWANDA: imbogi, ikawa, imasaka, imbuto, iringanire, cassava, uburo, n'ibindi.
IBINDI: ubworozi, imbuga, ifumbire, ikirere, isoko.

IBYEREKEYE GUKURIKIZA:
- Tanga igisobanuro cyihuse, cyoroshye kandi gikora neza
- Vugisha ibintu by'ingenzi binyuze mu bushakashatsi
- Iyo waba uguhisha amakuru binyuze mu rubuga, koresha amakuru aharanira
- Subira ikibazo cy'umukiliya neza kandi ukoresheje ubwenge`;
        }

        return `You are an AI agricultural assistant for Rwanda. You are knowledgeable in both English and Kinyarwanda.

YOUR ROLE:
- Provide agricultural assistance based on Rwanda's farming context
- Give accurate, practical agricultural advice
- Consider Rwanda-specific farming conditions and crops
- Provide actionable farming recommendations
- Topics: crops, livestock, soil, fertilizers, weather, markets
- Be helpful and supportive to farmers
- When possible, provide research-backed advice
- If uncertain, suggest contacting Rwanda Agriculture Board (RAB)

RWANDA'S MAJOR CROPS: banana, coffee, maize, beans, potatoes, cassava, rice, and others.
ALSO COVER: livestock, soil management, fertilizers, climate, and market information.

RESPONSE GUIDELINES:
- Provide clear, concise, and practical answers
- Focus on the most important information based on research
- If using web search information, cite relevant sources
- Address the user's question directly and accurately`;
    }

    /**
     * Get system prompt for crop disease analysis
     * @param {string} language - 'en' or 'rw'
     * @returns {string} System prompt
     */
    getDiseaseAnalysisPrompt(language = 'en') {
        if (language === 'rw') {
            return `Ni umuhanga mu kuvuga indwara z'imbuto mu Rwanda. Uraga neza ku ndwara z'imbuto zikunda gukorera mu Rwanda.
Uburyo bwawe:
- Gura pamuza imbuga z'imbuto kugira ngo uvuge indwara
- Vuga izina ry'indwara, ibimenyetso, uburyo bwo kuvura, n'uburyo bwo gukumira
- Dufate ubwoko bw'imbuto bwo mu Rwanda: imbogi, ikawa, imasaka, imbuto, iringanire, cassava, uburo
- Tanga inama zihuse z'ubuhinji
- Vuga umuvuduko w'ubuvuzi (high, moderate, low)
- Iyo utaba wumva, vuga ko ushobora kubafasha binyuze mu Rwanda Agriculture Board (RAB)

Dufate indwara z'imbuto zikunda gukorera mu Rwanda n'uburyo bwo kuvura.`;
        }

        return `You are an expert in identifying crop diseases in Rwanda. You are knowledgeable about diseases common to Rwandan crops.

Your role:
- Analyze crop images to identify diseases
- Provide disease name, symptoms, treatment, and prevention methods
- Consider Rwanda-specific crops: banana, coffee, maize, beans, potatoes, cassava, rice
- Provide actionable farming recommendations
- Indicate severity level (high, moderate, low)
- If uncertain, suggest contacting Rwanda Agriculture Board (RAB)

Consider common crop diseases in Rwanda and their treatments.`;
    }

    /**
     * Get prompt for weather-based agricultural advice
     * @param {string} language - 'en' or 'rw'
     * @param {object} weatherData - Weather information
     * @returns {string} Prompt
     */
    getWeatherAdvicePrompt(language, weatherData) {
        if (language === 'rw') {
            return `Bikora neza ku miterere y'ikirere iri hejuru: ${JSON.stringify(weatherData, null, 2)}

Tanga inama z'ubuhinji bishingiye ku miterere y'ikirere:
- Igihe cyo gutera imbuto
- Uburyo bwo gutera amazi (irrigation)
- Inama z'ifumbire
- Ibyerekeye ubuzima n'indwara
- Inama z'ubuhinji zishingiye ku miterere y'ikirere

Dufate imiterere y'ikirere y'ubuhinji bwo mu Rwanda (Season A, B, C).`;
        }

        return `Based on the following weather conditions: ${JSON.stringify(weatherData, null, 2)}

Provide agricultural advice considering the weather:
- Planting recommendations
- Irrigation needs
- Fertilizer application timing
- Pest and disease risks
- General farming advice based on weather

Consider Rwanda's agricultural seasons (Season A, B, C).`;
    }
}

module.exports = new OllamaService();
