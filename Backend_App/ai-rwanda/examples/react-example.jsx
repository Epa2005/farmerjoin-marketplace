/**
 * React component example — drop into your existing React app.
 * No auth required.
 */
import { useState } from 'react';

const API = 'http://localhost:5005/api/ai';

export default function FarmerAI() {
  const [query, setQuery] = useState('');
  const [lang, setLang]   = useState('en');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  async function ask(e) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch(`${API}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language: lang }),
    });
    const d = await r.json();
    setAnswer(d.answer);
    setLoading(false);
  }

  async function scanCrop(file) {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('language', lang);
    setLoading(true);
    const r = await fetch(`${API}/scan-crop`, { method: 'POST', body: fd });
    setScanResult(await r.json());
    setLoading(false);
  }

  async function loadWeather(location) {
    const r = await fetch(`${API}/weather/${encodeURIComponent(location)}/forecast?days=5&language=${lang}`);
    const d = await r.json();
    alert(JSON.stringify(d.forecast, null, 2));
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🇷🇼 Farmer AI Assistant</h1>

      <select value={lang} onChange={e => setLang(e.target.value)}>
        <option value="en">English</option>
        <option value="rw">Kinyarwanda</option>
      </select>

      <form onSubmit={ask} style={{ margin: '12px 0' }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
               placeholder={lang === 'rw' ? 'Baza ikibazo...' : 'Ask anything...'}
               style={{ width: 400, padding: 8 }} />
        <button disabled={loading}>{loading ? '...' : 'Ask'}</button>
      </form>
      {answer && <div style={{ background: '#f3f4f6', padding: 12 }}>{answer}</div>}

      <h3>Scan a crop</h3>
      <input type="file" accept="image/*" onChange={e => scanCrop(e.target.files[0])} />
      {scanResult && <pre>{JSON.stringify(scanResult, null, 2)}</pre>}

      <h3>Weather</h3>
      <button onClick={() => loadWeather('Musanze')}>Musanze 5-day forecast</button>
      <button onClick={() => loadWeather('Nyagatare')}>Nyagatare</button>
      <button onClick={() => loadWeather('Huye')}>Huye</button>
    </div>
  );
}
