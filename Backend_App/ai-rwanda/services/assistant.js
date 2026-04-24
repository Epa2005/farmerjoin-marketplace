/**
 * AI Assistant — bilingual EN/RW chatbot.
 * Answers ANY question (agriculture-focused, but handles general questions too).
 * Supports multi-turn conversation history.
 */
const ai = require('./aiProvider');
const { detectLanguage, systemPrompt } = require('./language');

async function ask({ query, language, history = [] }) {
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'query (string) is required' };
  }
  const lang = language === 'en' || language === 'rw' ? language : detectLanguage(query);

  // Build conversation context if history provided
  let userPrompt = query;
  if (Array.isArray(history) && history.length) {
    const ctx = history
      .filter(h => h && h.role && h.content)
      .slice(-10)
      .map(h => `${h.role.toUpperCase()}: ${h.content}`)
      .join('\n');
    userPrompt = `Previous conversation:\n${ctx}\n\nCurrent question:\n${query}`;
  }

  const r = await ai.chat(systemPrompt(lang), userPrompt);
  if (!r.ok) {
    return {
      success: true,
      language: lang,
      query,
      answer: lang === 'rw'
        ? "Mbabarira, serivisi ya AI ntibashije gusubiza ubu. Wagerageza none cyangwa ugahamagara RAB ku 250 788 843 700."
        : "Sorry, the AI service is temporarily unavailable. Please try again or contact Rwanda Agriculture Board (RAB) at 250 788 843 700.",
      provider: 'fallback',
    };
  }
  return {
    success: true,
    language: lang,
    query,
    answer: r.text.trim(),
    provider: r.provider,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { ask };
