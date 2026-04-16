import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    router.replace({
      pathname: '/(tabs)/intake',
      params: { barcode: data, photo_feedback: `成功读取条码: ${data}` },
    });
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
           <Text style={styles.kicker}>BARCODE SCANNER</Text>
           <Text style={styles.title}>扫码入库</Text>
        </View>
      </View>

      {!granted ? (
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.glassCard}>
               <View style={styles.iconCircle}>
                  <Ionicons name="qr-code" size={32} color={colors.primary} />
               </View>
               <Text style={styles.cardTitle}>需要相机权限</Text>
               <Text style={styles.cardDesc}>允许访问相机后，才能直接通过条形码识别商品信息并自动填表。</Text>
               <Pressable onPress={() => void requestPermission()} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>开启相机</Text>
               </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraBorder}>
             <CameraView 
               onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
               style={StyleSheet.absoluteFill} 
             />
             <View style={styles.overlay}>
                <View style={styles.maskTop} />
                <View style={styles.scanRow}>
                   <View style={styles.maskSide} />
                   <View style={styles.focusFrame}>
                      <View style={[styles.corner, styles.tl]} />
                      <View style={[styles.corner, styles.tr]} />
                      <View style={[styles.corner, styles.bl]} />
                      <View style={[styles.corner, styles.br]} />
                      <View style={styles.scanLine} />
                   </View>
                   <View style={styles.maskSide} />
                </View>
                <View style={styles.maskBottom}>
                   <Text style={styles.hint}>请对准商品条形码</Text>
                   <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>直接手动添加</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, paddingHorizontal: 24 },
  backBtn: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  backBlur: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  headerTitleGroup: { gap: 2 },
  kicker: { color: colors.primary, fontSize: 10, fontFamily: typography.bodyBold, letterSpacing: 2 },
  title: { color: colors.textPrimary, fontSize: 28, fontFamily: typography.displayBold, letterSpacing: -0.5 },
  cardWrapper: { padding: 24, ...shadows.card },
  cardBorder: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  glassCard: { padding: 32, backgroundColor: 'rgba(255, 255, 255, 0.4)', alignItems: 'center', gap: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  cardTitle: { fontSize: 20, fontFamily: typography.displayBold, color: colors.textPrimary },
  cardDesc: { fontSize: 14, fontFamily: typography.bodyMedium, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  primaryBtn: { height: 50, paddingHorizontal: 32, borderRadius: 25, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...shadows.soft },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontFamily: typography.bodyBold },
  cameraContainer: { flex: 1, padding: 24 },
  cameraBorder: { flex: 1, borderRadius: 32, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  overlay: { ...StyleSheet.absoluteFillObject },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scanRow: { flexDirection: 'row', height: 200 },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  focusFrame: { width: 280, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.primary, borderWidth: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', top: '50%', left: '10%', right: '10%', height: 2, backgroundColor: colors.primary, opacity: 0.6 },
  maskBottom: { flex: 2, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', paddingTop: 40, gap: 32 },
  hint: { color: '#FFF', fontSize: 15, fontFamily: typography.bodyBold, opacity: 0.9 },
  cancelBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cancelBtnText: { color: '#FFF', fontSize: 13, fontFamily: typography.bodyBold },
});
