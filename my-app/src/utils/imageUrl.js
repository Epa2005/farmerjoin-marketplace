import API from '../api';

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

  // If image already starts with http, replace localhost with current hostname if needed
  if (imageUrl.startsWith('http')) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return imageUrl.replace('localhost', hostname);
    }
    return imageUrl;
  }

  // Otherwise, use the current origin so the browser requests the same host
  const baseUrl = getBackendUrl();
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  if (imageUrl.startsWith('uploads/')) {
    return `${baseUrl}/${imageUrl}`;
  }
  return `${baseUrl}/uploads/products/${imageUrl}`;
};

// Build a Supabase public object URL for a filename and optional prefix
export const buildSupabasePublicUrl = (filename, prefix = '') => {
  try {
    const sup = (typeof window !== 'undefined' && window.__SUPABASE) ? window.__SUPABASE : null;
    if (!sup || !sup.url || !sup.bucket) return null;
    const cleanPrefix = prefix ? `${prefix.replace(/^\/+|\/+$/g, '')}/` : '';
    const key = `${cleanPrefix}${filename}`;
    return `${sup.url.replace(/\/$/, '')}/storage/v1/object/public/${sup.bucket}/${encodeURIComponent(key)}`;
  } catch (e) {
    return null;
  }
};

export default buildImageUrl;
