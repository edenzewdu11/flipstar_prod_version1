import config from '../config';

// Centralized media URL processing to avoid duplication across components
const API_BASE_URL_MEDIA = config.API_BASE_URL.replace('/api', '');

/**
 * Normalizes media URLs - handles both relative and absolute URLs
 * @param {string} url - The media URL to normalize
 * @returns {string|null} - Normalized URL or null if invalid
 */
export const normalizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://') || url.startsWith('content://')) {
    return url;
  }
  
  // Relative URL - prepend base URL
  return url.startsWith('/') ? `${API_BASE_URL_MEDIA}${url}` : `${API_BASE_URL_MEDIA}/${url}`;
};

/**
 * Optimizes Cloudinary URLs for better performance
 * @param {string} url - Original media URL
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  const {
    width = null,
    height = null,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;
  
  let optimizedUrl = url;
  
  // Video optimizations
  if (url.includes('/video/upload/')) {
    const transforms = [];
    if (height) transforms.push(`h_${height}`);
    if (width) transforms.push(`w_${width}`);
    transforms.push(`q_${quality === 'auto' ? '70' : quality}`);
    transforms.push('vc_h264'); // Video codec
    
    optimizedUrl = url.replace('/video/upload/', `/video/upload/${transforms.join(',')}/`);
  }
  // Image optimizations
  else if (url.includes('/image/upload/')) {
    const transforms = [];
    if (height) transforms.push(`h_${height}`);
    if (width) transforms.push(`w_${width}`);
    if (crop) transforms.push(`c_${crop}`);
    transforms.push(`q_${quality === 'auto' ? 'auto' : quality}`);
    transforms.push(`f_${format}`);
    
    optimizedUrl = url.replace('/image/upload/', `/image/upload/${transforms.join(',')}/`);
  }
  
  return optimizedUrl;
};

/**
 * Generates thumbnail URL for videos
 * @param {string} videoUrl - Original video URL
 * @param {Object} options - Thumbnail options
 * @returns {string} - Thumbnail URL
 */
export const generateThumbnailUrl = (videoUrl, options = {}) => {
  if (!videoUrl) return null;
  
  const { width = 400, height = 400, quality = 70 } = options;
  
  // Cloudinary video thumbnail
  if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/upload/')) {
    return videoUrl.replace(
      '/video/upload/',
      `/video/upload/w_${width},h_${height},c_fill,q_${quality},f_jpg,so_0/`
    );
  }
  
  // Fallback: try to get thumbnail from backend
  if (!videoUrl.startsWith('http')) {
    const normalizedUrl = normalizeMediaUrl(videoUrl);
    if (normalizedUrl) {
      return normalizedUrl.replace(/\.[^.]+$/, '_thumbnail.jpg');
    }
  }
  
  return videoUrl;
};

/**
 * Prefetch media URLs for better performance
 * @param {Array<string>} urls - Array of URLs to prefetch
 */
export const prefetchMediaUrls = async (urls) => {
  if (!urls || !Array.isArray(urls)) return;
  
  // Use Image.prefetch for React Native or similar mechanism
  const prefetchPromises = urls
    .filter(Boolean)
    .map(url => {
      const normalizedUrl = normalizeMediaUrl(url);
      if (normalizedUrl) {
        // For React Native Image prefetch
        if (typeof Image !== 'undefined' && Image.prefetch) {
          return Image.prefetch(normalizedUrl);
        }
      }
      return Promise.resolve();
    });
  
  try {
    await Promise.all(prefetchPromises);
  } catch (error) {
    console.log('Prefetch failed:', error);
  }
};

/**
 * Get appropriate placeholder/blurhash for content type
 * @param {string} type - Content type (image, video, avatar)
 * @returns {string} - Placeholder data
 */
export const getPlaceholderData = (type = 'image') => {
  const placeholders = {
    avatar: 'LKNJdf_3%Mof%%j?WBj[%Mof%%j?',
    image: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    video: 'L12Yfe_3%Mj?%%j?WBj[%Mj?%%j?',
  };
  
  return placeholders[type] || placeholders.image;
};