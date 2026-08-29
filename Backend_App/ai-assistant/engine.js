/**
 * FarmerJoin Built-in Intelligence Engine
 * ------------------------------------------------------------------
 * Pure, dependency-free intent engine. It:
 *   1. normalizes the user query,
 *   2. detects language (English / Kinyarwanda / French),
 *   3. scores every knowledge-base topic by keyword hits
 *      (phrases score higher than single words),
 *   4. selects the best topic and renders a role-aware answer,
 *   5. returns follow-up suggestions for the widget chips.
 */

const { topics, fallbackMessage } = require('./knowledgeBase');

const PHRASE_WEIGHT = 4;
const WORD_WEIGHT = 1;
const MIN_SCORE = 1;

function normalizeText(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanQuery(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.!?,'"'()-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectLang(query) {
  const rwMarkers = [
    'nihe', 'muraho', 'kwinjira', 'kwiyandikisha', 'ubuhinzi', 'igicuruzwa',
    'umucuruzi', 'umuhinzi', 'koperative', 'kwishyura', 'kugura',
    'kurikira', 'icyo', 'ibintu', 'ukuntu', 'gufasha', 'ndi', 'ni iki',
    'nkora', 'itangwa', 'ijambo', 'rwanda'
  ];
  const frMarkers = [
    'bonjour', 'comment', 'connexion', 'mot de passe', 'inscription',
    'acheter', 'vendre', 'payer', 'livraison', 'commande', 'produit',
    "j'ai", 'est-ce', 'quoi', 'fonctionne', 'je veux', 'aide'
  ];

  let rw = 0;
  let fr = 0;
  for (const m of rwMarkers) if (query.includes(m)) rw += 1;
  for (const m of frMarkers) if (query.includes(m)) fr += 1;
  if (rw > fr && rw > 0) return 'rw';
  if (fr > rw && fr > 0) return 'fr';
  return 'en';
}

/**
 * Detect the user's implied role from their phrasing, e.g.
 * "as a farmer", "I am admin", "ndi umuhinzi". We prefer the
 * authenticated JWT role (ctxRole) and only fall back to keywords.
 * Returns { role, derived } — derived=true when inferred from phrasing.
 */
function detectRole(query, ctxRole) {
  if (ctxRole) return { role: ctxRole, derived: false };
  const q = normalizeText(query);
  if (/\badmin\b|administrat|umuyobozi/.test(q)) return { role: 'admin', derived: true };
  if (/cooperative|koperative|\bcoop\b/.test(q)) return { role: 'cooperative', derived: true };
  if (/\bfarmer\b|producer|producteur|fermier|umuhinzi/.test(q)) return { role: 'farmer', derived: true };
  if (/\bbuyer\b|acheteur|\bclient\b|umucuruzi/.test(q)) return { role: 'buyer', derived: true };
  return { role: null, derived: false };
}

const ROLE_GUIDE = {
  buyer: 'buyerGuide',
  farmer: 'farmerGuide',
  cooperative: 'cooperativeGuide',
  admin: 'adminGuide',
};

function scoreTopic(query, topic) {
  let score = 0;
  for (let raw of topic.keywords) {
    const kw = normalizeText(raw);
    if (!kw || !query.includes(kw)) continue;
    score += kw.split(' ').length > 1 ? PHRASE_WEIGHT : WORD_WEIGHT;
    if (kw.length >= 8) score += 1;
  }
  return score;
}

function localizedIntro(lang) {
  if (lang === 'fr') return "Bonjour ! Je suis l'assistant integré de FarmerJoin. Voici la réponse :\n\n";
  if (lang === 'rw') return 'Muraho! Ndi umusimbyi wa FarmerJoin ubomoza sisiteme yose. Igisubizo:\n\n';
  return '';
}

function welcomeMessage(role) {
  const who = role ? ` (signed in as **${role}**)` : '';
  return `Hello${who}! I'm the **FarmerJoin Assistant** — the built-in assistant that knows this marketplace inside-out.\n\nAsk me anything, such as:\n\n• "How do I register?"\n• "How do I add a product as a farmer?"\n• "How does mobile money payment work?"\n• "When are the farming seasons in Rwanda?"`;
}

/**
 * Core entry point.
 * @param {object} opts { query, language?, role? }
 * @returns {{ success, provider, topic, language, answer, followUps }}
 */
function answer({ query, language, role }) {
  const cleaned = cleanQuery(query);
  const detected = language || detectLang(cleaned);
  const roleInfo = detectRole(cleaned, role);
  const ctxRole = roleInfo.role;

  let best = null;
  let bestScore = 0;
  for (const topic of topics) {
    const score = scoreTopic(cleaned, topic);
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }

  // When a role was inferred from phrasing, prefer the matching role guide
  // over the generic "roles" topic or other weak single-keyword matches.
  if (best && roleInfo.derived) {
    const guideId = ROLE_GUIDE[ctxRole];
    if (guideId) {
      if (best.id === 'roles') {
        const guide = topics.find((t) => t.id === guideId);
        if (guide) best = guide;
      } else if (bestScore <= 1 && ctxRole && best.id !== guideId) {
        const guide = topics.find((t) => t.id === guideId);
        if (guide && scoreTopic(cleaned, guide) > 0) best = guide;
      }
    }
  }

  if (!best || bestScore < MIN_SCORE) {
    return {
      success: true,
      provider: 'built-in',
      topic: 'fallback',
      language: detected,
      answer: fallbackMessage(detected),
      followUps: startChips(),
    };
  }

  const rendered = (best.message({ role: ctxRole, lang: detected }) || '').trim();

  return {
    success: true,
    provider: 'built-in',
    topic: best.id,
    language: detected,
    answer: (localizedIntro(detected) || '') + rendered,
    followUps: best.followUps || [],
  };
}

/** Quick-start chips shown before the first message. */
function startChips() {
  return [
    'How do I register?',
    'How do I add a product?',
    'How does mobile money payment work?',
    'What can I do as a buyer?',
    'Tell me about farming seasons',
  ];
}

function allTopics() {
  return topics.map((t) => ({
    id: t.id,
    title: t.title,
    keywords: t.keywords.slice(0, 6),
  }));
}

module.exports = { answer, welcomeMessage, startChips, allTopics };