/**
 * Unified AI Provider
 * - Tries Lovable AI Gateway first (recommended, supports text + vision)
 * - Falls back to Ollama (offline / self-hosted)
 * - Falls back to internal knowledge base if both unavailable
 */
const axios = require('axios');

const LOVABLE_KEY  = process.env.LOVABLE_API_KEY;
const LOVABLE_URL  = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const TEXT_MODEL   = process.env.AI_MODEL || 'google/gemini-2.5-flash';
const VISION_MODEL = process.env.AI_VISION_MODEL || 'google/gemini-2.5-flash';

const OLLAMA_HOST    = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_VISION  = process.env.OLLAMA_VISION_MODEL || 'llava';

const TIMEOUT = 60_000;

async function chatLovable(messages, { json = false } = {}) {
  const body = { model: TEXT_MODEL, messages };
  if (json) body.response_format = { type: 'json_object' };
  const r = await axios.post(LOVABLE_URL, body, {
    headers: { Authorization: `Bearer ${LOVABLE_KEY}`, 'Content-Type': 'application/json' },
    timeout: TIMEOUT,
  });
  return r.data.choices?.[0]?.message?.content ?? '';
}

async function visionLovable(systemPrompt, userPrompt, imageBase64, mime = 'image/jpeg') {
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } },
      ],
    },
  ];
  return chatLovable(messages);
}

async function chatOllama(prompt, system = '') {
  const r = await axios.post(`${OLLAMA_HOST}/api/generate`, {
    model: OLLAMA_MODEL, prompt, system, stream: false,
  }, { timeout: TIMEOUT });
  return r.data.response || '';
}

async function visionOllama(prompt, imageBase64) {
  const r = await axios.post(`${OLLAMA_HOST}/api/generate`, {
    model: OLLAMA_VISION, prompt, images: [imageBase64], stream: false,
  }, { timeout: TIMEOUT });
  return r.data.response || '';
}

/** Public: chat (text only) — returns { ok, text, provider } */
async function chat(systemPrompt, userPrompt, opts = {}) {
  if (LOVABLE_KEY) {
    try {
      const text = await chatLovable(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        opts,
      );
      return { ok: true, text, provider: 'lovable-ai' };
    } catch (e) {
      if (process.env.DEBUG_AI) console.warn('[ai] Lovable AI failed:', e.response?.status, e.message);
    }
  }
  try {
    const text = await chatOllama(userPrompt, systemPrompt);
    return { ok: true, text, provider: 'ollama' };
  } catch (e) {
    if (process.env.DEBUG_AI) console.warn('[ai] Ollama failed:', e.message);
    return { ok: false, text: '', provider: 'none', error: e.message };
  }
}

/** Public: vision — returns { ok, text, provider } */
async function vision(systemPrompt, userPrompt, imageBase64, mime) {
  if (LOVABLE_KEY) {
    try {
      const text = await visionLovable(systemPrompt, userPrompt, imageBase64, mime);
      return { ok: true, text, provider: 'lovable-ai' };
    } catch (e) {
      // Suppress error logs - service will fall back to knowledge base
      if (process.env.DEBUG_AI) console.warn('[ai] Lovable vision failed:', e.response?.status, e.message);
    }
  }
  try {
    const text = await visionOllama(`${systemPrompt}\n\n${userPrompt}`, imageBase64);
    return { ok: true, text, provider: 'ollama' };
  } catch (e) {
    // Suppress error logs - service will fall back to knowledge base
    if (process.env.DEBUG_AI) console.warn('[ai] Ollama vision failed:', e.message);
    return { ok: false, text: '', provider: 'none', error: e.message };
  }
}

module.exports = { chat, vision };
