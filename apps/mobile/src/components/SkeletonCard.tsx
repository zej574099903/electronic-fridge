import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, radii } from '@/src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 带有呼吸感动画的骨架屏卡片
 */
export const SkeletonCard = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 创建呼吸灯效果
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.contentPlaceholder}>
        <View style={styles.labelPlaceholder} />
        <View style={styles.titlePlaceholder} />
        <View style={styles.subtextPlaceholder} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  contentPlaceholder: {
    flex: 1,
    paddingLeft: 16,
    gap: 8,
  },
  labelPlaceholder: {
    width: 60,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  },
  titlePlaceholder: {
    width: '80%',
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  subtextPlaceholder: {
    width: '50%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
});
