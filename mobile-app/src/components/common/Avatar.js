import React, { useState } from 'react';
import { View, Text } from 'react-native';
import OptimizedImage from './OptimizedImage';

const GOLD = '#8fc441';

const Avatar = React.memo(({ uri, size = 36, name = '' }) => {
  const [hasError, setHasError] = useState(false);
  const safeName = name || '?';
  
  // Show fallback avatar if no URI or error occurred
  if (!uri || hasError) {
    return (
      <View style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2, 
        backgroundColor: GOLD, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ 
          color: '#000', 
          fontWeight: '700', 
          fontSize: size * 0.4 
        }}>
          {safeName[0].toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <OptimizedImage
      source={uri}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      optimizeCloudinary={true}
      cloudinaryOptions={{ width: size * 2, height: size * 2, quality: 'auto' }}
      onError={() => setHasError(true)}
      fallbackComponent={
        <View style={{ 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          backgroundColor: GOLD, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Text style={{ 
            color: '#000', 
            fontWeight: '700', 
            fontSize: size * 0.4 
          }}>
            {safeName[0].toUpperCase()}
          </Text>
        </View>
      }
    />
  );
});

Avatar.displayName = 'Avatar';

export default Avatar;
