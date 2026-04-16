import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, ImageProps, ViewStyle } from 'react-native';
import { getImagePath } from '@/src/constants/network';
import { colors } from '@/src/constants/colors';

interface RemoteImageProps extends Omit<ImageProps, 'source'> {
  photoUri: string | undefined | null;
  containerStyle?: ViewStyle;
}

/**
 * 具备自动寻址与加载反馈能力的远程图片组件
 */
export const RemoteImage = ({ photoUri, containerStyle, style, ...props }: RemoteImageProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // 如果没有路径，显示占位符逻辑交给父组件处理（或者这里也可以扩展）
  if (!photoUri) return null;

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        {...props}
        source={{ uri: getImagePath(photoUri) }}
        style={[styles.image, style]}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />
      {isLoading && (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // 朦胧的背景色让加载过程更柔和
  },
});
