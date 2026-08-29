/**
 * Minimal webSearchService stub to avoid runtime errors when web search is unavailable.
 * Provides getSearchContext and searchAgricultural used by the assistant.
 */

module.exports = {
    async getSearchContext(query, language = 'en') {
        // In a production system, implement a real web search. Here return a short placeholder.
        return language === 'rw'
            ? 'Nta makuru yabonetse ku rubuga. Ndasubiza uko nshoboye.'
            : 'No web search results available; answering from internal knowledge.';
    },

    async searchAgricultural(query, language = 'en') {
        // Return a consistent shape used by the assistant (success + results array)
        return {
            success: true,
            results: [
                { title: 'Local agronomy guide', link: 'https://example.org/agri-guide', snippet: 'Practical tips for farmers.' }
            ]
        };
    }
};
