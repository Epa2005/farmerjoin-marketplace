/**
 * AI Agricultural Assistant for Rwanda
 * Provides bilingual support (English/Kinyarwanda) for agricultural queries using Ollama and web search
 */
const ollamaService = require('./ollamaService');
const webSearchService = require('./webSearchService');
const cropDiseaseService = require('./cropDiseaseService');
const weatherService = require('./weatherService');

class AgriculturalAssistant {
    constructor() {
        // Common agricultural keywords for intent detection
        this.keywords = {
            'planting': ['plant', 'grow', 'sow', 'seed', 'gutera', 'kugura', 'imbuti', 'gutera'],
            'harvest': ['harvest', 'pick', 'collect', 'kurura', 'gukura', 'gusiba'],
            'pests': ['pest', 'insect', 'bug', 'ubuzima', 'inenye', 'ubwoko', 'indwara', 'udukoko'],

            'fertilizer': ['fertilizer', 'manure', 'nutrient', 'ifumbire', 'imbori', 'nutrient'],
            'water': ['water', 'irrigation', 'rain', 'amazi', 'irrigation', 'imvura'],
            'soil': ['soil', 'land', 'earth', 'butaka', 'ubutaka', 'urubingo'],
            'market': ['market', 'sell', 'price', 'isoko', 'kugurisha', 'amafaranga'],
            'weather': ['weather', 'climate', 'rain', 'sun', 'ikirere', 'imvura', 'izuba', 'ubushyuhe', 'ubukonje', 'umuyaga', 'ubuhanuzi'],
            'crop_scan': ['scan', 'crop scan', 'identify crop', 'menya igihingwa', 'sikanisha'],
            'crop_diseases': ['disease', 'sick', 'infection', 'indwara', 'arwaye', 'kuvamo', 'ibimenyetso', 'ubuvuzi', 'gukumira'],
            'platform_support': ['farmerjoin', 'account', 'register', 'signup', 'sign up', 'login', 'email', 'phone', 'credential', 'password', 'konti', 'kwiyandikisha', 'imeyili', 'telefone'],
            'coffee': ['coffee', 'kawa', 'ikawa'],
            'banana': ['banana', 'imbogi', 'imbogi'],
            'maize': ['maize', 'corn', 'amasaka', 'amasaka'],
            'beans': ['beans', 'imbuto', 'imbuto'],
            'potato': ['potato', 'iringanire', 'iringanire'],
            'cassava': ['cassava', 'manioc', 'cassava'],
            'rice': ['rice', 'uburo', 'uburo']
        };
    }

    /**
     * Process user query and generate response using Ollama with web search
     * @param {string} query - User's question
     * @param {string} language - 'en' or 'rw'
     * @returns {Object} Response with answer and related information
     */
    async processQuery(query, language = 'en') {
        try {
            // Auto-detect language if not provided
            const detectedLanguage = language || this.detectLanguage(query);
            const intent = this.detectIntent(query);

            // Handle specific intents with dedicated services
            if (intent === 'crop_scan') {
                return await this.handleCropScan(query, language);
            } else if (intent === 'crop_diseases') {
                return await this.handleCropDiseases(query, language);
            } else if (intent === 'weather') {
                return await this.handleWeather(query, language);
            } else if (intent === 'platform_support') {
                return await this.handlePlatformSupport(query, language);
            }

            // Get search context from web for enhanced responses
            let searchContext = '';
            let searchResults = null;

            try {
                searchContext = await webSearchService.getSearchContext(query, detectedLanguage);
                const rawSearchResults = await webSearchService.searchAgricultural(query, detectedLanguage);
                if (rawSearchResults.success) {
                    searchResults = rawSearchResults.results.slice(0, 3);
                }
            } catch (searchError) {
                console.log('Web search failed, using AI without search context:', searchError.message);
                searchContext = detectedLanguage === 'rw'
                    ? 'Nta makuru zabonetse ku rubuga, ndakoresha ubwoko bwanjubwa bw\'ubuhinji.'
                    : 'No web search results available, using internal agricultural knowledge.';
            }

            const systemPrompt = ollamaService.getSystemPrompt(detectedLanguage);

            // Build enhanced prompt with search context
            let enhancedPrompt = this.buildPrompt(query, intent, detectedLanguage, searchContext);

            // Call Ollama API with search context
            // Ask the model to return a structured JSON response when possible
            const structuredPrompt = enhancedPrompt + "\n\nOUTPUT_FORMAT: Reply in JSON with the following fields: `summary` (one-line), `recommendations` (array of short actionable items), `steps` (ordered array, optional), `details` (full explanatory text), `confidence` (0-1, optional), and `sources` (array of {title,link} if available). If JSON is not possible, return a clear plaintext answer.\n\nOnly return valid JSON when possible.\n";

            const ollamaResponse = await ollamaService.generateResponse(structuredPrompt, {
                systemPrompt: systemPrompt,
                temperature: 0.7
            });

            if (!ollamaResponse.success) {
                // Fallback to basic response if Ollama fails
                return {
                    success: true,
                    query: query,
                    language: detectedLanguage,
                    intent: intent,
                    answer: this.getFallbackResponse(query, detectedLanguage),
                    relatedTopics: this.getRelatedTopics(intent),
                    timestamp: new Date().toISOString(),
                    note: 'Using fallback response - Ollama service unavailable'
                };
            }

            // Try to parse model response as JSON to extract a structured answer
            let structured = null;
            const raw = ollamaResponse.response;
            try {
                // Some models may wrap JSON in markdown; attempt to find JSON block
                const jsonStart = raw.indexOf('{');
                const jsonText = jsonStart >= 0 ? raw.slice(jsonStart) : raw;
                structured = JSON.parse(jsonText);
            } catch (e) {
                // Fallback: create a simple structured object from plaintext
                const firstLine = ('' + raw).split(/\n/)[0] || '';
                const bullets = ('' + raw).split(/\n|\r/).map(l => l.trim()).filter(l => l.length);
                const recommendations = bullets.filter(l => /^[-*\u2022]/.test(l) || /^[0-9]+\./.test(l)).map(l => l.replace(/^[-*\u2022]\s?/, '').replace(/^[0-9]+\./, '').trim()).slice(0, 5);
                const steps = bullets.filter(l => /^[0-9]+\./.test(l)).map(l => l.replace(/^[0-9]+\./, '').trim()).slice(0, 10);

                structured = {
                    summary: firstLine.slice(0, 200),
                    recommendations: recommendations.length ? recommendations : [],
                    steps: steps.length ? steps : [],
                    details: raw,
                    confidence: null,
                    sources: searchResults || []
                };
            }

            const response = {
                success: true,
                query: query,
                language: detectedLanguage,
                intent: intent,
                answer: (structured.details && typeof structured.details === 'string') ? structured.details : (structured.summary || ''),
                structured: structured,
                relatedTopics: this.getRelatedTopics(intent),
                timestamp: new Date().toISOString(),
                model: ollamaResponse.model,
                searchResults: searchResults,
                searchUsed: searchResults !== null
            };

            return response;
        } catch (error) {
            console.error('Error processing query:', error);
            return {
                success: false,
                error: 'Failed to process query',
                message: error.message
            };
        }
    }

    /**
     * Build enhanced prompt with search context
     */
    buildPrompt(query, intent, language, searchContext = '') {
        let contextPrompt = language === 'rw'
            ? `Ibibazo: ${query}\n\n`
            : `Question: ${query}\n\n`;

        if (searchContext) {
            contextPrompt += language === 'rw'
                ? `Makuru y'ubuhinji bwo mu Rwanda (bivuye ku rubuga):\n${searchContext}\n\n`
                : `Agricultural information from web search:\n${searchContext}\n\n`;
        }

        contextPrompt += language === 'rw'
            ? `Basha ku makuru hejuru, tanga inama z'ubuhinji zihuse kandi zifite agaciro binyuze mu bushakashatsi bw'ubuhinzi bwo mu Rwanda. \n\nUMUKOZI: Tanga igisobanuro gihuse, cyoroshye kandi gikora neza mu Kinyarwanda. Vugisha ibintu by'ingenzi gusa. Subira ikibazo cy'umukiliya neza.`
            : `Based on the information above, provide practical, research-backed agricultural advice for Rwanda's farming context. \n\nREQUIREMENT: Provide a clear, concise, and practical answer in English. Focus on the most important information. Address the user's question directly and accurately.`;

        return contextPrompt;
    }

    /**
     * Get fallback response when Ollama is unavailable
     */
    getFallbackResponse(query, language) {
        if (language === 'rw') {
            return `Ndi umufasha w'ubuhinzi wa AI wo mu Rwanda. Kubera ko serivisi ya AI irimo ibibazo, nshobora kubafasha binyuze mu Rwanda Agriculture Board (RAB) kuri serivisi zihuse z'ubuhinzi. Bwira T: 250 788 843 700 cyangwa bagaruke ku mbuga nkoranyambaga ya RAB.`;
        }
        return `I am an AI agricultural assistant for Rwanda. Due to service unavailability, I recommend contacting Rwanda Agriculture Board (RAB) at T: 250 788 843 700 or visit their website for expert agricultural assistance.`;
    }

    /**
     * Detect intent from user query
     */
    detectIntent(query) {
        const queryLower = query.toLowerCase();

        for (const category in this.keywords) {
            for (const keyword of this.keywords[category]) {
                if (queryLower.includes(keyword)) {
                    return category;
                }
            }
        }

        return 'general';
    }

    /**
     * Get related topics based on intent
     */
    getRelatedTopics(intent) {
        const relatedTopics = [];

        switch (intent) {
            case 'planting':
                relatedTopics.push('crops', 'soil', 'fertilizer');
                break;
            case 'pests':
            case 'diseases':
                relatedTopics.push('crops', 'fertilizer');
                break;
            case 'fertilizer':
                relatedTopics.push('soil', 'planting');
                break;
            case 'water':
                relatedTopics.push('climate', 'planting');
                break;
            case 'soil':
                relatedTopics.push('fertilizer', 'planting');
                break;
            case 'market':
                relatedTopics.push('crops', 'harvest');
                break;
            default:
                relatedTopics.push('planting', 'crops', 'climate');
        }

        return relatedTopics;
    }

    /**
     * Detect language from query
     */
    detectLanguage(query) {
        // Simple Kinyarwanda detection based on common words
        const kinyarwandaWords = ['ni', 'kuri', 'mu', 'ku', 'na', 'za', 'ubu', 'buri', 'kugira', 'ko', 'nka', 'gutera', 'imbuto', 'amasaka', 'kawa', 'imbogi'];

        for (const word of kinyarwandaWords) {
            if (query.toLowerCase().includes(word)) {
                return 'rw';
            }
        }

        return 'en';
    }

    /**
     * Handle crop scanning intent
     */
    async handleCropScan(query, language) {
        // This feature requires image input, which is not directly supported by text-based queries.
        // The client-side application should handle image capture and send it to a dedicated image analysis service.
        // For now, we will return a message indicating this.
        const message = language === 'rw'
            ? 'Serivisi yo gusikana ibihingwa irakeneye ifoto. Nyamuneka koresha porogaramu ifata ifoto y’igihingwa.'
            : 'Crop scanning requires an image input. Please use the application\'s image capture feature to scan the crop.';
        return {
            success: true,
            query: query,
            language: language,
            intent: 'crop_scan',
            answer: message,
            relatedTopics: ['crops', 'diseases', 'pests'],
            timestamp: new Date().toISOString(),
            note: 'Image input required for crop scanning'
        };
    }

    /**
     * Handle crop diseases intent
     */
    async handleCropDiseases(query, language) {
        const diseaseQuery = query.toLowerCase().replace(/indwara|disease|ibimenyetso|symptoms|ubuvuzi|treatment|gukumira|prevention/g, "").trim();
        const diseaseInfo = await cropDiseaseService.getDiseaseInfo(diseaseQuery);

        let answer;
        if (diseaseInfo.success) {
            const { name, kinyarwanda_name, symptoms, remedies, prevention } = diseaseInfo.data;
            if (language === 'rw') {
                answer = `Indwara: ${kinyarwanda_name || name}. Ibimenyetso: ${symptoms}. Ubuvuzi: ${remedies}. Gukumira: ${prevention}.`;
            } else {
                answer = `Disease: ${name}. Symptoms: ${symptoms}. Remedies: ${remedies}. Prevention: ${prevention}.`;
            }
        } else {
            answer = language === 'rw'
                ? `Ntabwo nabonye amakuru y'indwara ya '${diseaseQuery}'. Nyamuneka gerageza indi ndwara cyangwa ugenzure imyandikire.`
                : `Could not find information for disease '${diseaseQuery}'. Please try another disease or check the spelling.`;
        }

        return {
            success: true,
            query: query,
            language: language,
            intent: 'crop_diseases',
            answer: answer,
            relatedTopics: ['crops', 'pests', 'treatment'],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Handle weather intent
     */
    async handleWeather(query, language) {
        const locationMatch = query.match(/(in|mu)\s+([a-zA-Z]+)/i);
        let location = 'Kigali'; // Default to Kigali if no location is specified
        if (locationMatch && locationMatch[2]) {
            location = locationMatch[2];
        }

        const forecastMatch = query.match(/(forecast|ubuhanuzi)/i);
        let weatherData;

        if (forecastMatch) {
            weatherData = await weatherService.getWeatherForecast(location, 3); // 3-day forecast
        } else {
            weatherData = await weatherService.getCurrentWeather(location);
        }

        let answer;
        if (weatherData.success) {
            if (forecastMatch) {
                answer = language === 'rw'
                    ? `Ubuhanuzi bw\\\\\\\'ikirere i ${location} mu minsi 3 iri imbere:\n${weatherData.data.forecast.map(f => `${f.date}: Ubushyuhe bwa ${f.temperature.min}°C kugeza ${f.temperature.max}°C, ${f.conditions}, Umuhehere ${f.humidity}%, Imvura ${f.precipitation}mm.`).join("\n")}`
                    : `Weather forecast for ${location} for the next 3 days:\n${weatherData.data.forecast.map(f => `${f.date}: Temperature ${f.temperature.min}°C to ${f.temperature.max}°C, ${f.conditions}, Humidity ${f.humidity}%, Precipitation ${f.precipitation}mm.`).join("\n")}`;
            } else {
                answer = language === 'rw'
                    ? `Ikirere cy\\\'ubu i ${location}: Ubushyuhe bwa ${weatherData.temperature.current}°C (bumva nka ${weatherData.temperature.feels_like}°C), ${weatherData.conditions}, Umuhehere ${weatherData.humidity}%, Umuyaga ${weatherData.wind.speed} m/s.`
                    : `Current weather in ${location}: Temperature ${weatherData.temperature.current}°C (feels like ${weatherData.temperature.feels_like}°C), ${weatherData.conditions}, Humidity ${weatherData.humidity}%, Wind ${weatherData.wind.speed} m/s.`;
            }
        } else {
            answer = language === 'rw'
                ? `Ntabwo nabashije kubona amakuru y'ikirere i ${location}. Nyamuneka gerageza ikindi gihe cyangwa ugenzure izina ry'aho hantu.`
                : `Could not retrieve weather information for ${location}. Please try again later or check the location name.`;
        }

        return {
            success: true,
            query: query,
            language: language,
            intent: 'weather',
            answer: answer,
            relatedTopics: ['climate', 'planting', 'irrigation'],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Handle FarmerJoin platform/account support
     */
    async handlePlatformSupport(query, language) {
        const isRw = language === 'rw';
        const answer = isRw
            ? `FarmerJoin igufasha kwiyandikisha nka Buyer, Farmer, cyangwa Cooperative.\n\nIbisabwa by'ibanze:\n- Full name: inyuguti 2+.\n- Email: format yemewe (urugero: user@example.com).\n- Phone: nimero mpuzamahanga (urugero: +2507XXXXXXXX), imibare 8-15.\n- Password: nibura inyuguti 6.\n\nUjya kuri Register page, uhitamo role yawe, ukuzuza ibisabwa, ubundi ukohereza form.`
            : `FarmerJoin supports registration for Buyer, Farmer, and Cooperative users.\n\nRequired fields:\n- Full name: at least 2 characters.\n- Email: valid format (example: user@example.com).\n- Phone: international format (example: +2507XXXXXXXX), 8-15 digits.\n- Password: minimum 6 characters.\n\nGo to the Register page, choose your role, fill the fields, then submit.`;

        return {
            success: true,
            query,
            language,
            intent: 'platform_support',
            answer,
            relatedTopics: ['account', 'registration', 'login'],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return ['en', 'rw'];
    }

    /**
     * Get available topics
     */
    getAvailableTopics(language = 'en') {
        return [
            'planting',
            'harvest',
            'pests',
            'diseases',
            'fertilizer',
            'irrigation',
            'soil',
            'market',
            'climate',
            'extension'
        ];
    }
}

module.exports = new AgriculturalAssistant();
