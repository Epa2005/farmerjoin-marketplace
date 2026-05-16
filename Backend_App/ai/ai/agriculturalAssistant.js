/**
 * AI Agricultural Assistant for Rwanda
 * Provides bilingual support (English/Kinyarwanda) for agricultural queries using Ollama and web search
 */
const ollamaService = require('./ollamaService');
const webSearchService = require('./webSearchService');

class AgriculturalAssistant {
    constructor() {
        // Common agricultural keywords for intent detection
        this.keywords = {
            'planting': ['plant', 'grow', 'sow', 'seed', 'gutera', 'kugura', 'imbuti', 'gutera'],
            'harvest': ['harvest', 'pick', 'collect', 'kurura', 'gukura', 'gusiba'],
            'pests': ['pest', 'insect', 'bug', 'ubuzima', 'inenye', 'ubwoko', 'indwara'],
            'diseases': ['disease', 'sick', 'infection', 'indwara', 'arwaye', 'kuvamo'],
            'fertilizer': ['fertilizer', 'manure', 'nutrient', 'ifumbire', 'imbori', 'nutrient'],
            'water': ['water', 'irrigation', 'rain', 'amazi', 'irrigation', 'imvura'],
            'soil': ['soil', 'land', 'earth', 'butaka', 'ubutaka', 'urubingo'],
            'market': ['market', 'sell', 'price', 'isoko', 'kugurisha', 'amafaranga'],
            'weather': ['weather', 'climate', 'rain', 'sun', 'ikirere', 'imvura', 'izuba'],
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
            const ollamaResponse = await ollamaService.generateResponse(enhancedPrompt, {
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

            let response = {
                success: true,
                query: query,
                language: detectedLanguage,
                intent: intent,
                answer: ollamaResponse.response,
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
