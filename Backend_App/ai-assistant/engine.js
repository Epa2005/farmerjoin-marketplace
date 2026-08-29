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
  return `Hello${who}! I'm the **FarmerJoin Assistant** — the built-in assistant that knows this marketplace inside-out.\n\nAsk me anything, such as:\n\n• "How do I register?"\n• "How do I add a product as a farmer?"\n• "How does mobile money payment work?"\n• "Tell me about farming seasons"\n• "What's new in the system?"`;
}

/** Build the full search space: static topics + live DB knowledge entries. */
function buildSearchSpace(context) {
  const extras = (context && context.knowledge) || [];
  const dynamic = extras.map((entry) => {
    const kws = String(entry.keywords || '')
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (entry.topic && kws.length === 0) kws.push(entry.topic);
    return {
      id: 'kb_' + entry.id,
      keywords: kws,
      message: () => entry.answer || '',
      followUps: entry.followUps || [],
    };
  });
  return topics.concat(dynamic);
}

const LIVE_FACTS_TOPICS = new Set(['products', 'editProduct', 'market', 'orders']);

function factsBlock(facts) {
  if (!facts) return '';
  const lines = [];
  if (facts.totalProducts != null) lines.push(`${facts.totalProducts} products currently listed`);
  if (Array.isArray(facts.categories) && facts.categories.length) {
    lines.push(`Top categories right now: ${facts.categories.slice(0, 4).map((c) => c.category || c).join(', ')}`);
  }
  if (facts.counts && (facts.counts.farmer != null || facts.counts.buyer != null)) {
    lines.push(`${facts.counts.farmer || 0} farmers and ${facts.counts.buyer || 0} buyers on the platform`);
  }
  if (!lines.length) return '';
  return `\n\n**Live — direct from the system right now:** ${lines.join(' · ')}`;
}

function changelogAnswer(changes, lang) {
  const list = Array.isArray(changes) ? changes : [];
  if (!list.length) {
    return 'There are no recent changes logged yet — the system is stable right now.';
  }
  const header = '**Latest updates to FarmerJoin:**';
  const items = list.map((c) => {
    const when = c.createdAt ? new Date(c.createdAt) : null;
    const date = when && !isNaN(when) ? when.toLocaleDateString() : '';
    const title = (c.title || 'Update').trim();
    const desc = (c.description || '').trim();
    return date ? `• **${title}** (${date})${desc ? ` — ${desc}` : ''}` : `• **${title}**${desc ? ` — ${desc}` : ''}`;
  });
  return `${header}\n\n${items.join('\n')}\n\nAsk me about any of them and I can explain what changed and why.`;
}

/**
 * Core entry point.
 * @param {object} opts { query, language?, role?, context? }
 *   context = { facts?, changes?, knowledge? } — live system data merged in
 *   by the route layer on every request.
 * @returns {{ success, provider, topic, language, answer, followUps }}
 */
function answer({ query, language, role, context }) {
  const cleaned = cleanQuery(query);
  const detected = language || detectLang(cleaned);
  const roleInfo = detectRole(cleaned, role);
  const ctxRole = roleInfo.role;

  const searchSpace = buildSearchSpace(context);
  let best = null;
  let bestScore = 0;
  for (const topic of searchSpace) {
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
        const guide = searchSpace.find((t) => t.id === guideId);
        if (guide) best = guide;
      } else if (bestScore <= 1 && ctxRole && best.id !== guideId) {
        const guide = searchSpace.find((t) => t.id === guideId);
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

  // "What's new?" → answer from the live change log (context.changes).
  if (best.id === 'systemChangelog') {
    return {
      success: true,
      provider: 'built-in',
      topic: best.id,
      language: detected,
      answer: (localizedIntro(detected) || '') + changelogAnswer(context.changes, detected),
      followUps: best.followUps || [],
    };
  }

  let rendered = (best.message({ role: ctxRole, lang: detected }) || '').trim();

  // Reflect the current database state in answers that mention live data.
  if (LIVE_FACTS_TOPICS.has(best.id)) {
    rendered += factsBlock(context ? context.facts : null);
  }

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