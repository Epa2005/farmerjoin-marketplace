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

const { topics } = require('./knowledgeBase');

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

/** Stopwords removed before word-overlap matching. */
const STOPWORDS = new Set(
  'the,a,an,is,are,was,were,be,been,being,do,does,did,has,have,had,how,what,when,where,which,who,whom,whose,why,can,could,would,should,will,shall,may,might,must,and,or,but,of,to,in,on,at,by,for,with,about,from,as,per,than,then,too,very,not,no,so,if,me,we,our,us,you,yours,it,its,they,them,their,this,that,these,those,he,she,his,her,am,tell,ask,like,know,want,wants,need,needs,gets,got,get,make,using,use,please,there,here,one,should'.split(',')
);

function tokens(text) {
  const m = String(text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return m.filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Word pools of a topic (keywords + title + rendered message). */
const topicPoolCache = new WeakMap();
function topicPool(topic) {
  let pools = topicPoolCache.get(topic);
  if (!pools) {
    const kw = tokens((topic.keywords || []).join(' '));
    const title = tokens(topic.title || '');
    let msg = [];
    try {
      msg = tokens(String((topic.message ? topic.message({}) : '') || ''));
    } catch (_e) {
      msg = [];
    }
    pools = { kw: new Set(kw), title: new Set(title), msg: new Set(msg) };
    topicPoolCache.set(topic, pools);
  }
  return pools;
}

/**
 * Fuzzy overlap between the query words and a topic's word pools.
 * Keyword tokens weigh more than title words, which weigh more than words
 * that only appear inside an answer body.
 */
const HINT_KW = 3;
const HINT_TITLE = 2;
const HINT_MSG = 1;
function closestHintScore(topic, qwords) {
  if (!qwords.length) return 0;
  const pools = topicPool(topic);
  let score = 0;
  for (const w of qwords) {
    if (pools.kw.has(w)) score += HINT_KW;
    else if (pools.title.has(w)) score += HINT_TITLE;
    else if (pools.msg.has(w)) score += HINT_MSG;
  }
  return score;
}

/** Note prepended when the answer comes from fuzzy matching. */
function hintIntro(lang) {
  if (lang === 'rw') return 'Maze nsanga igisubizo cyegera ku kibazo cyawe muri sisiteme:\n\n';
  if (lang === 'fr') return 'Voici la réponse la plus proche de votre question, trouvée dans le système:\n\n';
  return 'Here is the closest match I found in the FarmerJoin system for your question:\n\n';
}

/** Friendly, structured system overview when nothing matched at all. */
function structuredFallback(lang) {
  const base = {
    en: {
      text:
        `I can help you with anything about the FarmerJoin system. Your question did not match a specific topic, so here is a quick map of what I know:\n\n` +
        `**Accounts & Security** — register, login, forgot/reset password, account roles, editing your profile\n` +
        `**Buying** — products, cart, checkout, mobile money payment, delivery, orders & tracking, reviews\n` +
        `**Selling** — add/manage products, farm profile, pricing and market fees\n` +
        `**Cooperative & Admin** — cooperative guide, user management, moderation and bans\n` +
        `**Help & Guides** — support, security & privacy, languages, subscription boxes\n` +
        `**Agriculture** — farming seasons (A/B/C), weather, crop scan with AgriAI, watering and plant care\n` +
        `**System Updates** — what is new and what changed recently`,
      chips: startChips(),
    },
    fr: {
      text:
        `Je peux vous aider sur tout le système FarmerJoin. Votre question ne correspond à aucun sujet précis, voici les domaines que je connais :\n\n` +
        `**Comptes** — inscription, connexion, mot de passe, rôles, profil\n` +
        `**Achat** — produits, panier, paiement mobile money, livraison, commandes, avis\n` +
        `**Vente** — ajouter des produits, profil fermier, prix et frais\n` +
        `**Coopérative & Admin** — guide coopérative, gestion des utilisateurs, modération\n` +
        `**Agriculture** — saisons, météo, scan des cultures (AgriAI)\n` +
        `**Mises à jour** — nouvelles fonctionnalités du système`,
      chips: ['Comment créer un compte ?', 'Comment ajouter un produit ?', 'Comment payer par mobile money ?', 'Comment suivre ma commande ?', 'Quelles sont les saisons agricoles ?'],
    },
    rw: {
      text:
        `Nshobora kugufasha kuri byose birebana na FarmerJoin. Ikibazo cyawe nticyanyuze ku ngingo yihariye, dore ingingo nzi:\n\n` +
        `**Konti** — kwiyandikisha, kwinjira, password, roles za konti, guhindura amakuru\n` +
        `**Kugura** — ibicuruzwa, cart, kwishyura (mobile money), kohereza, orders, reviews\n` +
        `**Kwicuruza** — kongera igicuruzwa, umwirondoro w'umuhinzi, ibiciro\n` +
        `**Koperative & Admin** — koperative, abakoresha, kubuza konti\n` +
        `**Ubuhinzi** — ibihe by'umwaka (A/B/C), ikirere, scan y'ibimera (AgriAI)\n` +
        `**Amahinduka** — ibibishya muri sisiteme`,
      chips: ['Nigute ninjira?', 'Nigute nongera igicuruzwa?', 'Nigute nishyura?', 'Mwomenge ibihe by\'ubuhinzi', 'Ni iki kigaragaza muri FarmerJoin?'],
    },
  };
  return base[lang] || base.en;
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
    // Fuzzy fallback: answer from the most word-overlapping topic so every
    // system-related question still gets a real response.
    const qwords = tokens(cleaned);
    let hintBest = null;
    let hintScore = 0;
    for (const topic of searchSpace) {
      const s = closestHintScore(topic, qwords);
      if (s > hintScore) {
        hintScore = s;
        hintBest = topic;
      }
    }
    if (hintBest) {
      if (hintBest.id === 'systemChangelog') {
        return {
          success: true,
          provider: 'built-in',
          topic: hintBest.id,
          language: detected,
          answer: (localizedIntro(detected) || '') + changelogAnswer(context ? context.changes : null, detected),
          followUps: hintBest.followUps || [],
        };
      }
      let rendered = (hintBest.message({ role: ctxRole, lang: detected }) || '').trim();
      if (LIVE_FACTS_TOPICS.has(hintBest.id)) rendered += factsBlock(context ? context.facts : null);
      return {
        success: true,
        provider: 'built-in',
        topic: hintBest.id,
        language: detected,
        answer: (localizedIntro(detected) || '') + hintIntro(detected) + rendered,
        followUps: hintBest.followUps || [],
      };
    }

    const fb = structuredFallback(detected);
    return {
      success: true,
      provider: 'built-in',
      topic: 'fallback',
      language: detected,
      answer: (localizedIntro(detected) || '') + fb.text,
      followUps: fb.chips,
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