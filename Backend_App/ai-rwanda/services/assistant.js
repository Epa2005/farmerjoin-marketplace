/**
 * AI Assistant — bilingual EN/RW chatbot.
 * Answers ANY question (agriculture-focused, but handles general questions too).
 * Supports multi-turn conversation history.
 *
 * When the external provider (Lovable/Ollama) is unreachable — which is the
 * normal case in production on Render — we fall back to the built-in
 * FarmerJoin knowledge engine so the assistant always answers.
 */
const ai = require('./aiProvider');
const { detectLanguage, systemPrompt } = require('./language');
const systemAssistant = require('../../ai-assistant/engine');

// No external key configured → the built-in knowledge engine is the primary answerer.
const externalConfigured = Boolean(process.env.LOVABLE_API_KEY);

async function ask({ query, language, history = [] }) {
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'query (string) is required' };
  }
  const lang = language === 'en' || language === 'rw' ? language : detectLanguage(query);

  // Built-in first: answer from the FarmerJoin system knowledge base.
  const built = systemAssistant.answer({ query, language: lang });
  if (!externalConfigured) {
    return {
      success: true,
      language: lang,
      query,
      answer: built.answer,
      provider: built.provider || 'built-in',
      followUps: built.followUps || [],
    };
  }

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
    // Fall back to the built-in engine if the external provider is down.
    return {
      success: true,
      language: lang,
      query,
      answer: built.answer,
      provider: built.provider || 'built-in',
      followUps: built.followUps || [],
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
