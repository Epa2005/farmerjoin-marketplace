// Helper function to get the correct backend URL for images
export const getBackendUrl = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:5000' : `http://${hostname}:5000`;
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
  
  // Otherwise, prepend the backend URL
  const baseUrl = getBackendUrl();
  if (imageUrl.startsWith('uploads/')) {
    return `${baseUrl}/${imageUrl}`;
  }
  return `${baseUrl}/uploads/products/${imageUrl}`;
};

export default buildImageUrl;
