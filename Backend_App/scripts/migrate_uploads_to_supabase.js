const path = require('path');
const fs = require('fs');
// determine mime lookup availability (mime-types preferred)
let contentTypeLib = null;
let useMimeTypes = false;
try {
    contentTypeLib = require('mime-types');
    useMimeTypes = true;
} catch (e) {
    try {
        contentTypeLib = require('mime');
        useMimeTypes = false;
    } catch (e2) {
        contentTypeLib = null;
    }
}

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
if (!loadedEnv) {
    console.warn('No .env file found at repo root or Backend_App; relying on environment variables');
}
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || process.env.SUPABASE_BUCKET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !BUCKET) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY or SUPABASE_PUBLIC_BUCKET env vars.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');

async function uploadFile(fileName) {
    const filePath = path.join(uploadsDir, fileName);
    const getContentType = (p) => {
        try {
            if (contentTypeLib) {
                if (useMimeTypes && typeof contentTypeLib.lookup === 'function') return contentTypeLib.lookup(p);
                if (!useMimeTypes && typeof contentTypeLib.getType === 'function') return contentTypeLib.getType(p);
            }
        } catch (e) {
            // ignore
        }
        const ext = path.extname(p).toLowerCase();
        const map = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml'
        };
        return map[ext] || 'application/octet-stream';
    };
    const contentType = getContentType(filePath) || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(filePath);

    console.log('Uploading', fileName, 'content-type', contentType);

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, fileBuffer, { contentType, upsert: true });

    if (error) {
        console.error('Failed to upload', fileName, error.message || error);
        return false;
    }

    const publicUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(fileName)}`;
    console.log('Uploaded:', fileName, '->', publicUrl);
    return true;
}

async function run() {
    if (!fs.existsSync(uploadsDir)) {
        console.error('Uploads directory not found:', uploadsDir);
        process.exit(1);
    }

    const files = fs.readdirSync(uploadsDir).filter(f => fs.statSync(path.join(uploadsDir, f)).isFile());
    console.log('Found', files.length, 'files to upload.');

    for (const f of files) {
        // skip hidden files
        if (f.startsWith('.')) continue;
        try {
            await uploadFile(f);
        } catch (e) {
            console.error('Error uploading', f, e.message || e);
        }
    }

    console.log('Migration complete. Verify files in Supabase dashboard and set bucket to public if needed.');
}

run().catch(err => {
    console.error('Migration failed', err);
    process.exit(1);
});
