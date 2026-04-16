import { useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { persistPhotoUri } from '@/src/lib/photo';

export default function ProductPhotoScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  async function handleRequestPermission() {
    await requestPermission();
  }

  async function handleCapture() {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });

      if (!picture?.uri) {
        throw new Error('capture failed');
      }

      const persistedUri = await persistPhotoUri(picture.uri);

      router.replace({
        pathname: '/(tabs)/intake',
        params: {
          photo_uri: persistedUri,
          photo_feedback: '已拍好照片，选个到期时间就能入库。',
        },
      });
    } catch {
      setIsCapturing(false);
    }
  }

  const granted = permission?.granted;

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back-outline" size={18} color={colors.primaryDeep} />
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <Text style={styles.kicker}>快速入库</Text>
        <Text style={styles.title}>拍食物</Text>
        <Text style={styles.subtitle}>拍下外观，后面会直接用照片识别库存。</Text>
      </View>

      {!granted ? (
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={28} color={colors.primaryDeep} />
          <Text style={styles.permissionTitle}>需要相机权限</Text>
          <Text style={styles.permissionText}>允许访问相机后，才能用真机直接拍照入库。</Text>
          <Pressable onPress={() => void handleRequestPermission()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>开启相机</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraShell}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.overlayText}>{isCapturing ? '正在保存照片...' : '把食物放进框内后点击拍照'}</Text>
            <Pressable onPress={() => void handleCapture()} disabled={isCapturing} style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}>
              <Ionicons name="camera" size={18} color={colors.textOnDark} />
              <Text style={styles.captureText}>{isCapturing ? '保存中...' : '拍照带回'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: typography.bodyBold,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: typography.bodyBold,
  },
  title: {
    fontSize: 32,
    color: colors.textPrimary,
    fontFamily: typography.displayHeavy,
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 21,
    maxWidth: 300,
    fontFamily: typography.bodyMedium,
  },
  permissionCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.soft,
  },
  permissionTitle: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: typography.displayBold,
  },
  permissionText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  primaryButton: {
    minWidth: 180,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  cameraShell: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0E2233',
    ...shadows.soft,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
  },
  overlayText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
});
