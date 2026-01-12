/**
 * Image URL Resolution Utility
 * Centralized helper for resolving image URLs from Cloudflare R2
 */

const ASSETS_BASE_URL = import.meta.env.VITE_ASSETS_BASE_URL || import.meta.env.HC_CF_BUCKET_PUBLIC_URL || '';

// Fallback image for missing/broken images
const FALLBACK_IMAGE = 'global/ui/no-image.png';

/**
 * Resolve image URL from path or full URL
 * 
 * @param {string|null|undefined} imagePath - Relative path or full URL
 * @returns {string} - Full URL to image
 * 
 * @example
 * resolveImageUrl('products/footwear/nike/hr-416/white-grey/catalogue/hero.jpg')
 * // => 'https://assets.hcfashionhouse.com/products/footwear/nike/hr-416/white-grey/catalogue/hero.jpg'
 * 
 * resolveImageUrl('https://example.com/image.jpg')
 * // => 'https://example.com/image.jpg'
 * 
 * resolveImageUrl(null)
 * // => 'https://assets.hcfashionhouse.com/global/ui/no-image.png'
 */
export function resolveImageUrl(imagePath) {
  // Handle null/undefined/empty
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return `${ASSETS_BASE_URL}/${FALLBACK_IMAGE}`;
  }

  const trimmedPath = imagePath.trim();

  // If already a full URL (http/https), return as-is
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }

  // If it's a data URL (base64), return as-is
  if (trimmedPath.startsWith('data:')) {
    return trimmedPath;
  }

  // Otherwise, prepend base URL
  // Remove leading slash if present to avoid double slashes
  const cleanPath = trimmedPath.startsWith('/') ? trimmedPath.slice(1) : trimmedPath;
  
  return `${ASSETS_BASE_URL}/${cleanPath}`;
}

/**
 * Get fallback image URL
 * @returns {string}
 */
export function getFallbackImageUrl() {
  return `${ASSETS_BASE_URL}/${FALLBACK_IMAGE}`;
}

/**
 * Get optimized image attributes for lazy loading
 * @param {string} imagePath - Image path or URL
 * @param {string} alt - Alt text
 * @returns {object} - Props to spread on img tag
 */
export function getImageProps(imagePath, alt = '') {
  return {
    src: resolveImageUrl(imagePath),
    alt: alt,
    loading: 'lazy',
    decoding: 'async',
    onError: (e) => {
      // Fallback on error
      if (e.target.src !== getFallbackImageUrl()) {
        e.target.src = getFallbackImageUrl();
      }
    }
  };
}

/**
 * Extract image URL from media object
 * Handles both old (cloudinary_url) and new (media_url/cloudinary_url as R2 path) formats
 * 
 * @param {object|string} media - Media object or direct URL/path
 * @returns {string} - Resolved image URL
 */
export function extractMediaUrl(media) {
  if (!media) {
    return getFallbackImageUrl();
  }

  // If media is already a string (direct URL/path)
  if (typeof media === 'string') {
    return resolveImageUrl(media);
  }

  // Extract from media object (try multiple fields for compatibility)
  const imagePath = media.cloudinary_url || media.media_url || media.url || media.path;
  return resolveImageUrl(imagePath);
}

export default resolveImageUrl;
