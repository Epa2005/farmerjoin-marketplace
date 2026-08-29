// Loads optional runtime configuration from /config.json on the same origin.
// If present, sets window.__API_URL and window.__SUPABASE to be used by the app.
export async function initRuntimeConfig() {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const cfg = await res.json();
    if (cfg?.API_URL) {
      try {
        // Validate URL before assigning to window to avoid invalid URL issues
        try { new URL(cfg.API_URL); } catch (e) { throw new Error('Invalid API_URL in config.json'); }
        window.__API_URL = cfg.API_URL;
      } catch (e) {
        console.warn('runtimeConfig: invalid API_URL, ignoring:', cfg.API_URL, e?.message);
      }
    }
    if (cfg?.SUPABASE_URL || cfg?.SUPABASE_BUCKET) {
      try {
        const supUrl = cfg.SUPABASE_URL || cfg.SUPABASEURL || null;
        const supBucket = cfg.SUPABASE_BUCKET || cfg.SUPABASEBUCKET || null;
        // simple validation: url must parse and bucket must be non-empty
        if (supUrl) {
          try { new URL(supUrl); } catch (e) { throw new Error('Invalid SUPABASE_URL in config.json'); }
        }
        window.__SUPABASE = { url: supUrl, bucket: supBucket };
      } catch (e) {
        console.warn('runtimeConfig: invalid SUPABASE settings, ignoring:', e?.message);
      }
    }
    return cfg;
  } catch (e) {
    return null;
  }
}

export default initRuntimeConfig;
