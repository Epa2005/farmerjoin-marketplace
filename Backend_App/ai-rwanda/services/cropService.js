/**
 * Crop Scan + Disease Detection
 * Sends image to a vision model and returns structured disease info.
 * Falls back to the disease database if AI is unavailable.
 */
const ai = require('./aiProvider');
const { systemPrompt } = require('./language');
const diseases = require('../data/diseases.json');
const crops    = require('../data/crops.json');

const SUPPORTED_CROPS = Object.keys(diseases);

function bilingualDB(lang = 'en') {
  const out = {};
  for (const crop of SUPPORTED_CROPS) {
    out[crop] = {};
    for (const [key, d] of Object.entries(diseases[crop])) {
      out[crop][key] = {
        name:       d.name[lang]      || d.name.en,
        symptoms:   d.symptoms[lang]  || d.symptoms.en,
        treatment:  d.treatment[lang] || d.treatment.en,
        prevention: d.prevention[lang]|| d.prevention.en,
        severity:   d.severity,
      };
    }
  }
  return out;
}

function visionInstruction(crop, lang) {
  const cropHint = crop ? ` The farmer says this is a ${crop} crop.` : '';
  if (lang === 'rw') {
    return `Reba neza iyi shusho y'igihingwa.${cropHint} Subiza mu buryo bwa JSON gusa (nta makuru ya hejuru):
{
  "crop": "ubwoko bw'igihingwa (e.g. banana, maize, coffee)",
  "is_healthy": true/false,
  "disease": "izina ry'indwara (cyangwa null niba ari kizima)",
  "symptoms": "ibimenyetso wabonye",
  "treatment": "uburyo bwo kuvura mu Kinyarwanda",
  "prevention": "uburyo bwo kwirinda mu Kinyarwanda",
  "severity": "low | moderate | high",
  "confidence": 0.0-1.0
}`;
  }
  return `Carefully analyze this crop image.${cropHint} Respond with ONLY a JSON object (no prose):
{
  "crop": "the crop type (e.g. banana, maize, coffee)",
  "is_healthy": true/false,
  "disease": "disease name (or null if healthy)",
  "symptoms": "what you can see",
  "treatment": "concrete treatment steps",
  "prevention": "how to prevent it",
  "severity": "low | moderate | high",
  "confidence": 0.0-1.0
}`;
}

function tryParseJSON(text) {
  if (!text) return null;
  // Strip markdown fences and find first {...}
  const cleaned = text.replace(/```json|```/gi, '').trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function scan({ imageBuffer, mime = 'image/jpeg', crop = null, language = 'en' }) {
  const lang = language === 'rw' ? 'rw' : 'en';

  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    return { success: false, error: 'imageBuffer (Buffer) is required' };
  }
  const base64 = imageBuffer.toString('base64');

  const sys = systemPrompt(lang) + '\n\nYou are also a crop disease vision specialist. Always reply with strict JSON when asked.';
  const r = await ai.vision(sys, visionInstruction(crop, lang), base64, mime);

  if (r.ok) {
    const parsed = tryParseJSON(r.text);
    if (parsed) {
      return {
        success: true,
        provider: r.provider,
        aiPowered: true,
        language: lang,
        result: {
          crop:        parsed.crop || crop || 'unknown',
          is_healthy:  Boolean(parsed.is_healthy),
          disease:     parsed.disease || null,
          symptoms:    parsed.symptoms || '',
          treatment:   parsed.treatment || '',
          prevention:  parsed.prevention || '',
          severity:    parsed.severity || 'unknown',
          confidence:  Number(parsed.confidence) || 0.7,
        },
        recommendations: {
          immediate:  parsed.treatment,
          longTerm:   parsed.prevention,
          escalate:   parsed.severity === 'high'
            ? 'Contact Rwanda Agriculture Board (RAB) immediately'
            : 'Monitor closely; contact extension if it worsens',
        },
        timestamp: new Date().toISOString(),
      };
    }
    // AI replied but couldn't parse — return raw text
    return {
      success: true,
      provider: r.provider,
      aiPowered: true,
      language: lang,
      raw: r.text,
      result: { crop: crop || 'unknown', disease: null, severity: 'unknown', confidence: 0.5 },
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback to DB
  const db = bilingualDB(lang);
  if (crop && db[crop]) {
    return {
      success: true,
      aiPowered: false,
      language: lang,
      note: 'AI vision unavailable — returning known diseases for this crop',
      result: { crop, possible_diseases: db[crop] },
      timestamp: new Date().toISOString(),
    };
  }
  return {
    success: false,
    error: 'AI vision unavailable and no crop type provided',
    available_crops: SUPPORTED_CROPS,
  };
}

function listDiseases(crop, language = 'en') {
  const lang = language === 'rw' ? 'rw' : 'en';
  if (!crop) {
    return { success: true, language: lang, all_crops: bilingualDB(lang) };
  }
  if (!diseases[crop]) {
    return { success: false, error: `Crop "${crop}" not found`, supported: SUPPORTED_CROPS };
  }
  return { success: true, language: lang, crop, diseases: bilingualDB(lang)[crop] };
}

function listCrops() {
  return {
    success: true,
    crops: Object.entries(crops).map(([key, c]) => ({
      key,
      english: c.names.en,
      kinyarwanda: c.names.rw,
      altitude_m: c.altitude_m,
      season: c.season,
      maturity_months: c.maturity_months,
    })),
  };
}

module.exports = { scan, listDiseases, listCrops, SUPPORTED_CROPS };
