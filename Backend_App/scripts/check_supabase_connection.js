const path = require('path');
const fs = require('fs');

// Load .env from repo root or Backend_App/.env
const tryEnvPaths = [path.join(__dirname, '..', '..', '.env'), path.join(__dirname, '..', '.env')];
let loadedEnv = false;
for (const p of tryEnvPaths) {
    if (fs.existsSync(p)) {
        require('dotenv').config({ path: p });
        loadedEnv = true;
        break;
    }
}
if (!loadedEnv) console.warn('No .env found at repo root or Backend_App; relying on environment variables');

const db = require('../dbConnection');

async function checkDb() {
    return new Promise((resolve) => {
        try {
            db.healthCheck((err, rows) => {
                if (err) return resolve({ ok: false, error: err.message || err });
                return resolve({ ok: true });
            });
        } catch (e) {
            return resolve({ ok: false, error: e.message || e });
        }
    });
}

async function checkSupabase() {
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    const BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || process.env.SUPABASE_BUCKET;

    if (!SUPABASE_URL || !SUPABASE_KEY) return { ok: false, error: 'SUPABASE_URL or SUPABASE_KEY not set' };

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
        if (!BUCKET) {
            // try list buckets
            const { data, error } = await supabase.storage.listBuckets();
            if (error) return { ok: false, error: error.message || error };
            return { ok: true, buckets: data.map(b => ({ name: b.name, public: b.public })).slice(0, 10) };
        } else {
            const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1 });
            if (error) return { ok: false, error: error.message || error };
            // Check the bucket's public flag
            let isPublic = null;
            try {
                const { data: buckets } = await supabase.storage.listBuckets();
                const found = (buckets || []).find(b => b.name === BUCKET);
                isPublic = found ? found.public : null;
            } catch (e) { /* ignore */ }
            return { ok: true, items: data.length, bucketPublic: isPublic };
        }
    } catch (e) {
        return { ok: false, error: e.message || e };
    }
}

(async () => {
    console.log('Checking database connection...');
    const dbRes = await checkDb();
    console.log('DB:', dbRes);

    console.log('Checking Supabase storage...');
    const sbRes = await checkSupabase();
    console.log('Supabase:', sbRes);

    if (!dbRes.ok || !sbRes.ok) process.exit(1);
    process.exit(0);
})();
