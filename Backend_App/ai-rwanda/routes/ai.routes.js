/**
 * Express router — mount with: app.use('/api/ai', require('./routes/ai.routes'))
 * NO authentication. All endpoints are public.
 */
const express = require('express');
const multer  = require('multer');

const assistant = require('../services/assistant');
const crop      = require('../services/cropService');
const weather   = require('../services/weatherService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// --- Health ---
router.get('/', (_, res) => res.json({
  ok: true, service: 'AI Rwanda Agriculture', version: '2.0.0',
  endpoints: [
    'POST /assistant            { query, language?, history? }',
    'POST /scan-crop            multipart: image, crop?, language?',
    'GET  /diseases             ?crop=&language=',
    'GET  /diseases/:crop       ?language=',
    'GET  /crops',
    'GET  /weather/:location    ?language=',
    'GET  /weather/:location/forecast  ?days=5&language=',
    'GET  /locations',
  ],
}));

// --- AI Assistant (bilingual EN/RW, answers anything) ---
router.post('/assistant', async (req, res) => {
  const { query, language, history } = req.body || {};
  const out = await assistant.ask({ query, language, history });
  res.status(out.success ? 200 : 400).json(out);
});

// --- Crop scan (image upload) ---
router.post('/scan-crop', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'image file is required (multipart field "image")' });
  const out = await crop.scan({
    imageBuffer: req.file.buffer,
    mime: req.file.mimetype,
    crop: req.body.crop || null,
    language: req.body.language || 'en',
  });
  // Return 400 for configuration errors, 500 for server errors
  const statusCode = out.success ? 200 : (out.error?.includes('unavailable') ? 400 : 500);
  res.status(statusCode).json(out);
});

// --- Diseases ---
router.get('/diseases', (req, res) => res.json(crop.listDiseases(req.query.crop, req.query.language)));
router.get('/diseases/:crop', (req, res) => res.json(crop.listDiseases(req.params.crop, req.query.language)));

// --- Crops ---
router.get('/crops', (_, res) => res.json(crop.listCrops()));

// --- Weather ---
router.get('/weather/:location/forecast', async (req, res) => {
  const out = await weather.getForecast(req.params.location, req.query.days, req.query.language);
  res.status(out.success ? 200 : 404).json(out);
});
router.get('/weather/:location', async (req, res) => {
  const out = await weather.getCurrent(req.params.location, req.query.language);
  res.status(out.success ? 200 : 404).json(out);
});

// --- Locations ---
router.get('/locations', (_, res) => res.json({ success: true, ...weather.listAllLocations() }));

module.exports = router;
