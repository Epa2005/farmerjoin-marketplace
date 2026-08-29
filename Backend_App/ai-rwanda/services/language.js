/**
 * Bilingual EN/RW utilities + Rwanda agriculture system prompt
 */
const glossary = require('../data/kinyarwanda-glossary.json');
const seasons  = require('../data/seasons.json');

const KW_HINTS = ['ni','kuri','mu','ku','na','za','ubu','buri','ko','nka',
  'gutera','gusarura','imvura','izuba','ubuhinzi','umuhinzi','umurima','ubutaka',
  'ifumbire','indwara','udukoko','isoko','ibigori','ibishyimbo','ikawa','igitoki',
  'ibirayi','imyumbati','umuceri','amasaka','icyayi','inyanya','Musanze','Nyagatare',
  'ryari','niki','nigute','aho','sebahangwa','muraho','amakuru'];

function detectLanguage(text = '') {
  const t = text.toLowerCase();
  let hits = 0;
  for (const w of KW_HINTS) if (t.includes(w)) hits++;
  return hits >= 2 ? 'rw' : 'en';
}

function systemPrompt(lang = 'en') {
  const seasonStr = JSON.stringify(seasons);
  if (lang === 'rw') {
    return `Uri umufasha w'ubwenge bwu Rwanda mu by'ubuhinzi (Rwanda Agriculture AI Assistant).
Ufasha abahinzi b'u Rwanda gusubiza ibibazo byabo byose ku buhinzi: gutera, kurwanya indwara, ifumbire, ubutaka, ikirere, isoko, n'ibindi.
Subiza mu KINYARWANDA cyiza kandi cyumvikana, ucishije mu magambo make.
Niba ikibazo nta sano gifite n'ubuhinzi, isubiza neza nk'umufasha rusange wa AI.
Ibihembwe by'ubuhinzi bwo mu Rwanda: ${seasonStr}.
Niba ikibazo gisaba inama y'umwuga, vuga ko bagomba kwiyambaza Rwanda Agriculture Board (RAB).`;
  }
  return `You are an expert AI assistant for Rwanda agriculture.
You help Rwandan farmers and the public with ANY question about agriculture: planting, harvesting, diseases, pests, fertilizer, soil, weather, markets, and Rwanda-specific best practices.
Answer clearly and concisely. If a question is not about agriculture, still answer helpfully as a general AI assistant.
Rwanda agricultural seasons: ${seasonStr}.
For severe disease outbreaks, recommend contacting Rwanda Agriculture Board (RAB).
ALWAYS reply in the SAME LANGUAGE as the user's question (English or Kinyarwanda).`;
}

module.exports = { detectLanguage, systemPrompt, glossary };
