/**
 * Weather + Climate Prediction for Rwanda
 * - Real data from OpenWeatherMap (if WEATHER_API_KEY set)
 * - Otherwise simulated, using Rwanda elevation + typical climate model
 * - Adds AI-generated farming advice based on the forecast
 */
const axios = require('axios');
const ai = require('./aiProvider');
const { systemPrompt } = require('./language');
const locations = require('../data/locations.json');

const OWM_KEY  = process.env.WEATHER_API_KEY;
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

function findLocation(name) {
  if (!name) return null;
  const key = name.trim();
  const lowerKey = key.toLowerCase();
  
  // province (case-insensitive)
  for (const [prov, data] of Object.entries(locations)) {
    if (prov.toLowerCase() === lowerKey) {
      return { name: prov, type: 'province', ...data };
    }
  }
  
  // district (case-insensitive)
  for (const [prov, p] of Object.entries(locations)) {
    if (p.districts) {
      for (const [district, data] of Object.entries(p.districts)) {
        if (district.toLowerCase() === lowerKey) {
          return {
            name: district, type: 'district', province: prov,
            elevation_m: p.elevation_m, ...data,
          };
        }
      }
    }
  }
  return null;
}

function listAllLocations() {
  const provinces = Object.keys(locations);
  const districts = [];
  for (const [prov, p] of Object.entries(locations)) {
    for (const [d, c] of Object.entries(p.districts || {})) {
      districts.push({ district: d, province: prov, ...c });
    }
  }
  return { provinces, districts };
}

/** Simulated climate based on Rwanda month + elevation */
function simulate(loc, daysAhead = 0) {
  const date = new Date(); date.setDate(date.getDate() + daysAhead);
  const month = date.getMonth(); // 0=Jan
  // Rwanda: rainy seasons Sep-Dec (Season A), Mar-May (Season B); dry Jun-Aug
  const heavyRain  = [2, 3, 4, 9, 10, 11].includes(month);
  const moderateRain = [0, 1, 8].includes(month);
  const dry = [5, 6, 7].includes(month);

  const elev = loc.elevation_m || 1500;
  const baseTemp = 30 - (elev / 200);   // ~25 at 1000m, ~20 at 2000m
  const tempDay = Math.round(baseTemp + (dry ? 2 : 0) + (Math.random() * 2 - 1));
  const tempNight = Math.round(tempDay - (elev > 1800 ? 10 : 8));

  const rainChance = heavyRain ? 75 : moderateRain ? 40 : dry ? 10 : 25;
  const rainfall_mm = heavyRain ? 8 + Math.random() * 12 : moderateRain ? 2 + Math.random() * 5 : Math.random() * 2;
  const humidity = heavyRain ? 80 : dry ? 45 : 65;
  const condition = heavyRain && Math.random() > 0.3 ? 'Rain'
    : moderateRain && Math.random() > 0.5 ? 'Light rain'
    : Math.random() > 0.4 ? 'Partly cloudy' : 'Sunny';

  return {
    date: date.toISOString().slice(0, 10),
    temp_day_c: tempDay,
    temp_night_c: tempNight,
    rainfall_mm: Number(rainfall_mm.toFixed(1)),
    rain_chance_pct: rainChance,
    humidity_pct: humidity,
    wind_kph: Math.round(5 + Math.random() * 10),
    condition,
  };
}

async function fetchOWMCurrent(loc) {
  const r = await axios.get(`${OWM_BASE}/weather`, {
    params: { lat: loc.lat, lon: loc.lon, appid: OWM_KEY, units: 'metric' }, timeout: 15000,
  });
  const d = r.data;
  return {
    date: new Date().toISOString().slice(0, 10),
    temp_day_c: Math.round(d.main.temp_max),
    temp_night_c: Math.round(d.main.temp_min),
    rainfall_mm: d.rain?.['1h'] || 0,
    rain_chance_pct: d.clouds?.all || 0,
    humidity_pct: d.main.humidity,
    wind_kph: Math.round((d.wind?.speed || 0) * 3.6),
    condition: d.weather?.[0]?.main || 'Unknown',
  };
}

async function fetchOWMForecast(loc, days) {
  const r = await axios.get(`${OWM_BASE}/forecast`, {
    params: { lat: loc.lat, lon: loc.lon, appid: OWM_KEY, units: 'metric', cnt: days * 8 },
    timeout: 15000,
  });
  // group into days (take noon entry per day)
  const byDay = {};
  for (const it of r.data.list) {
    const day = it.dt_txt.slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(it);
  }
  return Object.entries(byDay).slice(0, days).map(([day, items]) => {
    const temps = items.map(i => i.main.temp);
    const rain  = items.reduce((s, i) => s + (i.rain?.['3h'] || 0), 0);
    return {
      date: day,
      temp_day_c: Math.round(Math.max(...temps)),
      temp_night_c: Math.round(Math.min(...temps)),
      rainfall_mm: Number(rain.toFixed(1)),
      rain_chance_pct: Math.round(items.reduce((s, i) => s + (i.clouds?.all || 0), 0) / items.length),
      humidity_pct: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length),
      wind_kph: Math.round((items.reduce((s, i) => s + (i.wind?.speed || 0), 0) / items.length) * 3.6),
      condition: items[0].weather?.[0]?.main || 'Unknown',
    };
  });
}

async function farmingAdvice(loc, forecast, language = 'en') {
  const summary = forecast.map(f => `${f.date}: ${f.condition}, ${f.temp_night_c}-${f.temp_day_c}°C, rain ${f.rainfall_mm}mm (${f.rain_chance_pct}%)`).join('\n');
  const q = language === 'rw'
    ? `Iherezo ry'ikirere ${loc.name} (Rwanda):\n${summary}\n\nTanga inama 3-5 ngufi z'ubuhinzi ku bahinzi mu Kinyarwanda (gutera, kuhira, kurwanya indwara, gusarura).`
    : `Weather forecast for ${loc.name}, Rwanda:\n${summary}\n\nGive 3-5 short, practical farming recommendations for farmers (planting, irrigation, disease risk, harvest timing).`;
  const r = await ai.chat(systemPrompt(language), q);
  return r.ok ? r.text.trim() : null;
}

async function getCurrent(locationName, language = 'en') {
  const loc = findLocation(locationName);
  if (!loc) return { success: false, error: `Location "${locationName}" not found`, hint: 'Try a Rwanda province or district', locations: listAllLocations() };

  let weather, source;
  try {
    if (OWM_KEY) { weather = await fetchOWMCurrent(loc); source = 'openweathermap'; }
    else throw new Error('no key');
  } catch {
    weather = simulate(loc, 0); source = 'simulated';
  }
  const advice = await farmingAdvice(loc, [weather], language);
  return { success: true, location: loc, source, language, weather, farming_advice: advice, timestamp: new Date().toISOString() };
}

async function getForecast(locationName, days = 5, language = 'en') {
  const loc = findLocation(locationName);
  if (!loc) return { success: false, error: `Location "${locationName}" not found`, locations: listAllLocations() };
  const d = Math.min(Math.max(parseInt(days, 10) || 5, 1), 7);

  let forecast, source;
  try {
    if (OWM_KEY) { forecast = await fetchOWMForecast(loc, d); source = 'openweathermap'; }
    else throw new Error('no key');
  } catch {
    forecast = Array.from({ length: d }, (_, i) => simulate(loc, i)); source = 'simulated';
  }
  const advice = await farmingAdvice(loc, forecast, language);
  return { success: true, location: loc, source, language, days: d, forecast, farming_advice: advice, timestamp: new Date().toISOString() };
}

module.exports = { getCurrent, getForecast, findLocation, listAllLocations };
