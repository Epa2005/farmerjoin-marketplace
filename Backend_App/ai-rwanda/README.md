# 🇷🇼 AI Rwanda Agriculture — v2.0

Plug-and-play AI features for any **Node.js + React** farmer system in Rwanda.
**No login. No sign-up. No auth.** Just call the REST endpoints.

## ✨ Features

| Feature | Endpoint | What it does |
|---|---|---|
| 🌱 **Crop Scan** | `POST /api/ai/scan-crop` | Upload a photo → identifies the crop, detects diseases, gives treatment + prevention |
| 🦠 **Disease Info** | `GET /api/ai/diseases/:crop` | Returns all known diseases for a crop with measures |
| ☁️ **Weather Now** | `GET /api/ai/weather/:location` | Current weather for any Rwanda district / province |
| 🔮 **Weather Forecast** | `GET /api/ai/weather/:location/forecast?days=7` | 1–7 day climate prediction with farming advice |
| 🤖 **AI Assistant** | `POST /api/ai/assistant` | Bilingual (EN / RW) chatbot — answers ANY agriculture question |
| 📍 **Locations** | `GET /api/ai/locations` | List all Rwanda provinces & districts |
| 🌾 **Crops** | `GET /api/ai/crops` | List all supported crops |

## 🚀 Quick Start

```bash
unzip ai-rwanda-agriculture.zip
cd ai-rwanda-agriculture
npm install
cp .env.example .env       # add your LOVABLE_API_KEY (or use Ollama)
npm start
```

Server runs on `http://localhost:5005`.

## 🔌 Integrate Into Your Existing Node.js System

Just **mount the router**:

```js
const express = require('express');
const aiRouter = require('./ai-rwanda-agriculture/routes/ai.routes');

const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);     // ← that's it
```

## ⚛️ React Usage

```jsx
// Ask the assistant
const res = await fetch('http://localhost:5005/api/ai/assistant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Ni ryari nakwiye gutera ibigori i Musanze?',
    language: 'rw'   // or 'en' or omit for auto-detect
  })
});

// Scan a crop
const fd = new FormData();
fd.append('image', fileInput.files[0]);
fd.append('crop', 'banana');   // optional
fd.append('language', 'en');
const scan = await fetch('http://localhost:5005/api/ai/scan-crop', {
  method: 'POST', body: fd
});
```

## 🧠 AI Backends

The package supports **two AI providers** out of the box and falls back gracefully:

1. **Lovable AI Gateway** — fastest setup (`LOVABLE_API_KEY`)
2. **Ollama** — fully offline (`OLLAMA_HOST`)

If both are missing, the system uses its built-in Rwanda agricultural knowledge base.

## 📚 Training Data Included

`/data/` contains curated Rwanda-specific datasets used to ground the AI:

- `crops.json` — 12+ Rwanda crops with planting calendars, soil, altitude
- `diseases.json` — 30+ crop diseases with symptoms / treatment / prevention (EN + RW)
- `locations.json` — All 5 provinces, 30 districts with coordinates & elevation
- `seasons.json` — Rwanda agricultural seasons A, B, C
- `kinyarwanda-glossary.json` — Bilingual agriculture vocabulary

## 📄 License
MIT — use it anywhere.
