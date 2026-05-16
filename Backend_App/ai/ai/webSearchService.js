const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Web Search Service for Agricultural Information
 * Searches the internet for real-time agricultural data and information
 */
class WebSearchService {
    constructor() {
        // Search API configurations
        this.searchEngines = {
            google: {
                baseUrl: 'https://www.googleapis.com/customsearch/v1',
                apiKey: process.env.GOOGLE_SEARCH_API_KEY || '',
                cx: process.env.GOOGLE_SEARCH_CX || ''
            },
            duckduckgo: {
                baseUrl: 'https://api.duckduckgo.com/'
            },
            bing: {
                baseUrl: 'https://api.bing.microsoft.com/v7.0/search',
                apiKey: process.env.BING_SEARCH_API_KEY || ''
            }
        };
    }

    /**
     * Search the web for agricultural information
     * @param {string} query - Search query
     * @param {string} language - Language code ('en' or 'rw')
     * @param {number} numResults - Number of results to return
     * @returns {Promise<Object>} Search results
     */
    async search(query, language = 'en', numResults = 5) {
        try {
            // Try Google Custom Search first
            if (this.searchEngines.google.apiKey && this.searchEngines.google.cx) {
                const googleResults = await this.searchGoogle(query, language, numResults);
                if (googleResults.success) {
                    return googleResults;
                }
            }

            // Fallback to DuckDuckGo
            const duckduckgoResults = await this.searchDuckDuckGo(query, language, numResults);
            if (duckduckgoResults.success) {
                return duckduckgoResults;
            }

            // Fallback to Bing
            if (this.searchEngines.bing.apiKey) {
                const bingResults = await this.searchBing(query, language, numResults);
                if (bingResults.success) {
                    return bingResults;
                }
            }

            // All search engines failed
            return {
                success: false,
                error: 'No search engine available',
                message: 'Please configure a search API key (Google, Bing, or use DuckDuckGo)'
            };
        } catch (error) {
            console.error('Error performing web search:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to perform web search'
            };
        }
    }

    /**
     * Search using Google Custom Search API
     */
    async searchGoogle(query, language, numResults) {
        try {
            const response = await axios.get(this.searchEngines.google.baseUrl, {
                params: {
                    key: this.searchEngines.google.apiKey,
                    cx: this.searchEngines.google.cx,
                    q: query,
                    hl: language,
                    num: numResults
                },
                timeout: 10000
            });

            const items = response.data.items || [];
            const results = items.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                source: 'Google'
            }));

            return {
                success: true,
                results: results,
                totalResults: response.data.searchInformation?.totalResults || results.length,
                engine: 'Google'
            };
        } catch (error) {
            console.error('Google search error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search using DuckDuckGo (free, no API key required)
     */
    async searchDuckDuckGo(query, language, numResults) {
        try {
            const response = await axios.get(this.searchEngines.duckduckgo.baseUrl, {
                params: {
                    q: query,
                    format: 'json'
                },
                timeout: 10000
            });

            const results = [];
            if (response.data.RelatedTopics) {
                response.data.RelatedTopics.slice(0, numResults).forEach(topic => {
                    if (topic.FirstURL && topic.Text) {
                        results.push({
                            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
                            link: topic.FirstURL,
                            snippet: topic.Text,
                            source: 'DuckDuckGo'
                        });
                    }
                });
            }

            if (response.data.Abstract) {
                results.unshift({
                    title: 'Wikipedia',
                    link: response.data.AbstractURL || 'https://en.wikipedia.org',
                    snippet: response.data.Abstract,
                    source: 'DuckDuckGo'
                });
            }

            return {
                success: true,
                results: results,
                totalResults: results.length,
                engine: 'DuckDuckGo'
            };
        } catch (error) {
            console.error('DuckDuckGo search error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search using Bing Search API
     */
    async searchBing(query, language, numResults) {
        try {
            const response = await axios.get(this.searchEngines.bing.baseUrl, {
                params: {
                    q: query,
                    count: numResults,
                    mkt: language === 'rw' ? 'rw-RW' : 'en-US'
                },
                headers: {
                    'Ocp-Apim-Subscription-Key': this.searchEngines.bing.apiKey
                },
                timeout: 10000
            });

            const items = response.data.webPages?.value || [];
            const results = items.map(item => ({
                title: item.name,
                link: item.url,
                snippet: item.snippet,
                source: 'Bing'
            }));

            return {
                success: true,
                results: results,
                totalResults: response.data.webPages?.totalEstimatedMatches || results.length,
                engine: 'Bing'
            };
        } catch (error) {
            console.error('Bing search error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get content from a URL (for detailed information)
     * @param {string} url - URL to fetch
     * @returns {Promise<Object>} Page content
     */
    async fetchPageContent(url) {
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            
            // Remove scripts, styles, and other non-content elements
            $('script, style, nav, footer, header, aside').remove();
            
            // Extract main content
            const title = $('title').text() || $('h1').first().text();
            const content = $('body').text().replace(/\s+/g, ' ').trim();
            
            return {
                success: true,
                title: title,
                content: content.substring(0, 5000), // Limit content length
                url: url
            };
        } catch (error) {
            console.error('Error fetching page content:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search specifically for agricultural information
     * @param {string} query - Agricultural query
     * @param {string} language - Language code
     * @returns {Promise<Object>} Agricultural search results
     */
    async searchAgricultural(query, language = 'en') {
        // Add agricultural context to query
        const agriculturalQuery = language === 'rw'
            ? `${query} ubuhinzi Rwanda agriculture`
            : `${query} agriculture Rwanda farming`;

        const searchResults = await this.search(agriculturalQuery, language, 5);

        if (!searchResults.success) {
            return searchResults;
        }

        // Filter results for agricultural relevance
        const agriculturalKeywords = [
            'agriculture', 'farming', 'crop', 'soil', 'harvest', 'plant',
            'ubuhinji', 'ubworozi', 'imbuto', 'imbuga', 'ifumbire'
        ];

        const filteredResults = searchResults.results.filter(result => {
            const text = (result.title + result.snippet).toLowerCase();
            return agriculturalKeywords.some(keyword => text.includes(keyword));
        });

        return {
            ...searchResults,
            results: filteredResults.length > 0 ? filteredResults : searchResults.results
        };
    }

    /**
     * Get search results formatted for AI context
     * @param {string} query - Search query
     * @param {string} language - Language code
     * @returns {Promise<string>} Formatted search results for AI
     */
    async getSearchContext(query, language = 'en') {
        const searchResults = await this.searchAgricultural(query, language);

        if (!searchResults.success || searchResults.results.length === 0) {
            return language === 'rw'
                ? 'Nta makuru zabonetse ku rubuga. Ndashobora gushyiramo ubwoko bwanjubwa bw\'ubuhinzi.'
                : 'No search results found. I will provide information based on my agricultural knowledge base.';
        }

        let context = language === 'rw'
            ? 'Makuru y\'ubuhinji bwo mu Rwanda:\n\n'
            : 'Agricultural information from web search:\n\n';

        searchResults.results.slice(0, 3).forEach((result, index) => {
            context += `${index + 1}. ${result.title}\n`;
            context += `   ${result.snippet}\n`;
            context += `   Source: ${result.source}\n\n`;
        });

        return context;
    }
}

module.exports = new WebSearchService();
