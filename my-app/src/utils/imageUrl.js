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

export default buildImageUrl;
