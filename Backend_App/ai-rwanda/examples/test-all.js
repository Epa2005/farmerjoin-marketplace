/**
 * Smoke test — runs locally without needing a real AI key
 * (functions return graceful fallbacks).
 *
 *   node examples/test-all.js
 */
require('dotenv').config();
const { assistant, crop, weather } = require('..');

(async () => {
  console.log('\n--- 1. List crops ---');
  console.log(JSON.stringify(crop.listCrops(), null, 2).slice(0, 400) + '...');

  console.log('\n--- 2. Diseases for banana (Kinyarwanda) ---');
  console.log(JSON.stringify(crop.listDiseases('banana', 'rw'), null, 2).slice(0, 600) + '...');

  console.log('\n--- 3. Weather (current) for Musanze ---');
  console.log(JSON.stringify(await weather.getCurrent('Musanze', 'en'), null, 2));

  console.log('\n--- 4. Forecast 3 days for Nyagatare (Kinyarwanda) ---');
  console.log(JSON.stringify(await weather.getForecast('Nyagatare', 3, 'rw'), null, 2));

  console.log('\n--- 5. AI Assistant question (English) ---');
  console.log(await assistant.ask({ query: 'When should I plant maize in Musanze?' }));

  console.log('\n--- 6. AI Assistant question (Kinyarwanda, auto-detected) ---');
  console.log(await assistant.ask({ query: 'Ni ryari nakwiye gutera ibigori i Musanze?' }));
})();
