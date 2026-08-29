const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const bucket = process.env.SUPABASE_PUBLIC_BUCKET || process.env.SUPABASE_BUCKET || 'uploads';

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
}

const getContentType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml'
    };
    return map[ext] || 'application/octet-stream';
};

const uploadFile = async (localFilePath, storagePath) => {
    if (!supabase) return null;
    if (!fs.existsSync(localFilePath)) return null;
    try {
        const fileBuffer = fs.readFileSync(localFilePath);
        const contentType = getContentType(localFilePath);
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(storagePath, fileBuffer, { contentType, upsert: true });
        if (error) {
            console.error('Supabase Storage upload error:', error.message || error);
            return null;
        }
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(storagePath);
        return publicUrlData?.publicUrl || null;
    } catch (err) {
        console.error('Supabase Storage upload failed:', err.message || err);
        return null;
    }
};

const getPublicUrl = (storagePath) => {
    if (!supabase) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return data?.publicUrl || null;
};

const fileExists = async (storagePath) => {
    if (!supabase) return false;
    try {
        const { data, error } = await supabase.storage.from(bucket).list('', {
            limit: 1,
            search: path.basename(storagePath)
        });
        if (error) return false;
        return data && data.length > 0;
    } catch {
        return false;
    }
};

const deleteFile = async (storagePath) => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.storage.from(bucket).remove([storagePath]);
        return !error;
    } catch {
        return false;
    }
};

module.exports = { uploadFile, getPublicUrl, fileExists, deleteFile };
