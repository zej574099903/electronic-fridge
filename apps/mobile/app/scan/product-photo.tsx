import { useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { persistPhotoUri } from '@/src/lib/photo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductPhotoScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  async function handleCapture() {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!picture?.uri) throw new Error('capture failed');
      const persistedUri = await persistPhotoUri(picture.uri);
      router.replace({
        pathname: '/(tabs)/intake',
        params: {
          photo_uri: persistedUri,
          photo_feedback: '照片已采集。',
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <BlurView intensity={20} tint="light" style={styles.backBlur}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </BlurView>
        </Pressable>
        <View style={styles.headerTitleGroup}>
           <Text style={styles.kicker}>VISUAL CAPTURE</Text>
           <Text style={styles.title}>拍摄外观</Text>
        </View>
      </View>

      {!granted ? (
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.glassCard}>
               <View style={styles.iconCircle}>
                  <Ionicons name="camera" size={32} color={colors.primary} />
               </View>
               <Text style={styles.cardTitle}>需要相机权限</Text>
               <Text style={styles.cardDesc}>我们需要使用相机来拍摄食材外观，以便在库存中直观展示。</Text>
               <Pressable onPress={() => void requestPermission()} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>开启相机</Text>
               </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraBorder}>
             <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
             <View style={styles.overlay}>
                <View style={styles.maskTop} />
                <View style={styles.scanRow}>
                   <View style={styles.maskSide} />
                   <View style={styles.focusFrame}>
                      <View style={[styles.corner, styles.tl]} />
                      <View style={[styles.corner, styles.tr]} />
                      <View style={[styles.corner, styles.bl]} />
                      <View style={[styles.corner, styles.br]} />
                   </View>
                   <View style={styles.maskSide} />
                </View>
                <View style={styles.maskBottom}>
                   <Text style={styles.hint}>{isCapturing ? '正在保存...' : '将食物置于框内拍摄'}</Text>
                   <Pressable onPress={handleCapture} disabled={isCapturing} style={[styles.captureBtn, isCapturing && styles.btnDisabled]}>
                      <View style={styles.captureInner}>
                         <Ionicons name="camera" size={24} color="#FFF" />
                      </View>
                   </Pressable>
                </View>
             </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, paddingHorizontal: 24 },
  backBtn: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  backBlur: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  headerTitleGroup: { gap: 2 },
  kicker: { color: colors.primary, fontSize: 10, fontFamily: typography.bodyBold, letterSpacing: 2 },
  title: { color: colors.textPrimary, fontSize: 28, fontFamily: typography.displayBold, letterSpacing: -0.5 },
  cardWrapper: { padding: 24, ...shadows.card },
  cardBorder: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  glassCard: { padding: 32, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', gap: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  cardTitle: { fontSize: 20, fontFamily: typography.displayBold, color: colors.textPrimary },
  cardDesc: { fontSize: 14, fontFamily: typography.bodyMedium, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  primaryBtn: { height: 50, paddingHorizontal: 32, borderRadius: 25, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...shadows.soft },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontFamily: typography.bodyBold },
  cameraContainer: { flex: 1, padding: 24 },
  cameraBorder: { flex: 1, borderRadius: 32, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  overlay: { ...StyleSheet.absoluteFillObject },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  scanRow: { flexDirection: 'row', height: 280 },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  focusFrame: { width: 280, position: 'relative' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: colors.primary, borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  maskBottom: { flex: 1.5, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', paddingTop: 32, gap: 24 },
  hint: { color: '#FFF', fontSize: 14, fontFamily: typography.bodyBold, opacity: 0.8 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  captureInner: { flex: 1, borderRadius: 34, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  btnDisabled: { opacity: 0.5 },
});
