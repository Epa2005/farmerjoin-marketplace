import API from '../api';

const normalizeUploadsPath = (value) => {
  if (!value) return value;

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  const normalized = String(value).replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('uploads/products/uploads/products/')) {
    return normalized.replace(/^uploads\/products\/uploads\/products\//, 'uploads/products/');
  }
  return normalized;
};

// Helper function to get the correct backend URL for images
export const getBackendUrl = () => {
  // Prefer the configured API baseURL (matches where API requests go).
  // Fall back to window.location.origin if API isn't available.
  try {
    const base = API?.defaults?.baseURL;
    if (base) return base.replace(/\/$/, '');
  } catch (e) {
    // ignore
  }
  return window.location.origin;
};

// Helper function to fix/build image URLs
export const buildImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  const normalizedImageUrl = normalizeUploadsPath(imageUrl);

  // If image already starts with http(s), try to normalize it to the configured API origin
  if (normalizedImageUrl.startsWith('http')) {
    try {
      const parsed = new URL(normalizedImageUrl);
      const pathname = parsed.pathname + (parsed.search || '') + (parsed.hash || '');
      const baseUrl = getBackendUrl();
      // If the URL points to an uploads path on the backend, return a URL built from our active backend base
      if (pathname.startsWith('/uploads') || pathname.startsWith('/uploads/')) {
        return `${baseUrl.replace(/\/$/, '')}${pathname}`;
      }
      // If it's pointing at localhost (dev) or same host as backend, prefer the active backend base URL
      const host = parsed.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || baseUrl.includes(host)) {
        return `${baseUrl.replace(/\/$/, '')}${pathname}`;
      }
      // If an external URL (Supabase, CDN, etc.) contains /uploads/ in path, return as-is
      if (normalizedImageUrl.includes('/uploads/')) {
        return normalizedImageUrl;
      }
      // Otherwise return original (external) absolute URL
      return normalizedImageUrl;
    } catch (e) {
      // Fall through to treat it as a relative path
    }
  }

  // Otherwise, use the current origin so the browser requests the same host
  const baseUrl = getBackendUrl();
  if (normalizedImageUrl.startsWith('/')) {
    return `${baseUrl}${normalizedImageUrl}`;
  }
  if (normalizedImageUrl.startsWith('uploads/')) {
    return `${baseUrl}/${normalizedImageUrl}`;
  }
  return `${baseUrl}/uploads/products/${normalizedImageUrl}`;
};

// Build a Supabase public object URL for a filename and optional prefix
export const buildSupabasePublicUrl = (filename, prefix = '') => {
  try {
    const supFromWindow = (typeof window !== 'undefined' && window.__SUPABASE) ? window.__SUPABASE : null;
    const supUrl = supFromWindow?.url || (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_PUBLIC_URL || '');
    const supBucket = supFromWindow?.bucket || (import.meta.env?.VITE_SUPABASE_PUBLIC_BUCKET || import.meta.env?.VITE_SUPABASE_BUCKET || '');
    if (!supUrl || !supBucket) return null;
    const cleanPrefix = prefix ? `${prefix.replace(/^\/+|\/+$/g, '')}/` : '';
    const key = `${cleanPrefix}${filename}`;
    return `${supUrl.replace(/\/$/, '')}/storage/v1/object/public/${supBucket}/${encodeURIComponent(key)}`;
  } catch (e) {
    return null;
  }
};

export default buildImageUrl;
