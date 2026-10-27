import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { normalizeMediaUrl, optimizeCloudinaryUrl, getPlaceholderData } from '../../utils/mediaUtils';

const GOLD = '#8fc441';

/**
 * Optimized Image component with automatic caching, placeholders, and error handling
 * Falls back to React Native Image if expo-image is not available
 */
const OptimizedImage = React.memo(({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  showLoadingIndicator = false,
  fallbackComponent = null,
  optimizeCloudinary = true,
  cloudinaryOptions = {},
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(showLoadingIndicator);
  const [hasError, setHasError] = useState(false);

  // Normalize the source URL
  const normalizedUrl = typeof source === 'string' 
    ? normalizeMediaUrl(source) 
    : source?.uri ? normalizeMediaUrl(source.uri) : null;

  // Apply Cloudinary optimizations if enabled
  const optimizedUrl = optimizeCloudinary && normalizedUrl
    ? optimizeCloudinaryUrl(normalizedUrl, cloudinaryOptions)
    : normalizedUrl;

  const handleLoad = (event) => {
    setIsLoading(false);
    onLoad?.(event);
  };

  const handleError = (error) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
    console.log('OptimizedImage load error:', { source, normalizedUrl, optimizedUrl, error });
  };

  // Show fallback component if image failed to load
  if (hasError && fallbackComponent) {
    return fallbackComponent;
  }

  // Show default error state
  if (hasError) {
    return (
      <View style={[style, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#666', fontSize: 12 }}>Image unavailable</Text>
      </View>
    );
  }

  // Show loading indicator if requested
  if (isLoading && showLoadingIndicator) {
    return (
      <View style={[style, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={GOLD} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: optimizedUrl }}
      style={style}
      resizeMode={contentFit}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;