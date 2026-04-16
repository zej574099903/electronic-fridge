import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { lookupBarcode } from '@/src/lib/barcode';

export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isHandling, setIsHandling] = useState(false);

  async function handleRequestPermission() {
    await requestPermission();
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (isHandling) {
      return;
    }

    setIsHandling(true);

    try {
      const result = await lookupBarcode(data);

      if (!result) {
        router.replace({
          pathname: '/(tabs)/intake',
          params: {
            photo_feedback: '这次没有识别到商品信息，已回到手动录入。',
          },
        });
        return;
      }

      router.replace({
        pathname: '/(tabs)/intake',
        params: {
          photo_feedback: result.name
            ? result.source === 'barcode_db'
              ? `已从商品库带出：${result.name}`
              : `已帮你带出：${result.name}`
            : `已识别条码 ${result.rawCode}，但商品库暂时没有这件商品的信息。`,
        },
      });
    } catch {
      setIsHandling(false);
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
        <Text style={styles.kicker}>补充信息</Text>
        <Text style={styles.title}>扫包装</Text>
        <Text style={styles.subtitle}>对准包装条码或商品码，识别后会自动回填到库存流程。</Text>
      </View>

      {!granted ? (
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={28} color={colors.primaryDeep} />
          <Text style={styles.permissionTitle}>需要相机权限</Text>
          <Text style={styles.permissionText}>允许访问相机后，才能直接扫包装条码。</Text>
          <Pressable onPress={() => void handleRequestPermission()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>开启相机</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraShell}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
            onBarcodeScanned={isHandling ? undefined : handleBarcodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.overlayText}>{isHandling ? '正在读取包装信息...' : '把条码放进框内即可'}</Text>
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
    height: 150,
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
});
