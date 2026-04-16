import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { GradientText } from '@/src/components/GradientText';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { UPLOAD_ENDPOINT, STATIC_IMAGES_BASE_URL } from '@/src/constants/network';
import { CreateFridgeItemInput, useInventoryStore } from '@/src/store/useInventoryStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const quickDateOptions = [
  { label: '今天', offsetDays: 0 },
  { label: '明天', offsetDays: 1 },
] as const;

export default function IntakeTabScreen() {
  const params = useLocalSearchParams<{
    photo_uri?: string;
    photo_feedback?: string;
  }>();
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const addItem = useInventoryStore((state) => state.addItem);
  const clearError = useInventoryStore((state) => state.clearError);

  const [draft, setDraft] = useState<CreateFridgeItemInput>({
    name: '未命名食材',
    photoUri: '',
    category: 'ingredient',
    storageSpace: 'chilled',
    expiresOn: '',
  });
  const [selectedQuickDate, setSelectedQuickDate] = useState<number | null>(null);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const inventoryCount = useMemo(() => items.filter((item) => item.status === 'active').length, [items]);

  useEffect(() => {
    if (!initialized) void fetchItems();
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (!params.photo_uri && !params.photo_feedback) return;
    if (params.photo_uri) updateDraft('photoUri', params.photo_uri);
    if (params.photo_feedback) setSuccessMessage(params.photo_feedback);
  }, [params.photo_feedback, params.photo_uri]);

  function updateDraft<K extends keyof CreateFridgeItemInput>(key: K, value: CreateFridgeItemInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function createDateString(offsetDays: number) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function applyQuickDate(offsetDays: number) {
    updateDraft('expiresOn', createDateString(offsetDays));
    setSelectedQuickDate(offsetDays);
    setCustomDaysInput(offsetDays >= 2 ? String(offsetDays) : '');
  }

  function handlePhotoCapture() {
    setFormError('');
    clearError();
    router.push('/scan/product-photo');
  }

  async function uploadImage(uri: string): Promise<string | null> {
    try {
      // 1. Pre-process: Resize and compress to save space on your computer
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }], // Resize to 1000px width
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('file', {
        uri: manipResult.uri,
        name: 'item_photo.jpg',
        type: 'image/jpeg',
      } as any);

      // 3. Upload to your computer
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      // Return the full URL for viewing
      return STATIC_IMAGES_BASE_URL + result.url;
    } catch (error) {
      console.error('[Upload Error]', error);
      return null;
    }
  }

  async function handleQuickAdd() {
    if (!draft.photoUri) {
      setFormError('请先拍一张食物照片');
      return;
    }
    if (!draft.expiresOn) {
      setFormError('请设定到期时间');
      return;
    }

    setFormError('');
    setSuccessMessage('');
    clearError();

    try {
      // Step A: Upload to your computer server first
      const cloudUrl = await uploadImage(draft.photoUri);
      if (!cloudUrl) {
        setFormError('上传到电脑失败，请确认电脑服务已开启且手机连接了同一 Wi-Fi');
        return;
      }

      // Step B: Save with the new computer URL
      await addItem({ 
        ...draft, 
        name: draft.name.trim() || '未命名食材',
        photoUri: cloudUrl // Use the URL on your computer
      });

      setSuccessMessage('已存入您的电脑并加入库存。');
      setDraft({
        name: '未命名食材',
        photoUri: '',
        category: 'ingredient',
        storageSpace: 'chilled',
        expiresOn: '',
      });
      setSelectedQuickDate(null);
      setCustomDaysInput('');
    } catch {
      setFormError('新增失败，请稍后再试');
    }
  }

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>NEW INVENTORY</Text>
            <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.title}>
              添加一件
            </GradientText>
            <View style={styles.syncRow}>
              <View style={[styles.syncDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.subtitle}>{inventoryCount} 件在库</Text>
            </View>
          </View>
        </View>

        {/* Photo Section */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.glassCard}>
              <View style={styles.sectionTop}>
                <View>
                  <Text style={styles.sectionEyebrow}>STEP 01</Text>
                  <Text style={styles.sectionTitle}>先拍食物</Text>
                </View>
                {draft.photoUri ? (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.statusBadgeText}>已采集</Text>
                  </View>
                ) : null}
              </View>

              {successMessage ? <FeedbackBanner tone="success" text={successMessage} /> : null}
              {formError ? <FeedbackBanner tone="error" text={formError} /> : null}

              <Pressable onPress={handlePhotoCapture} style={styles.previewContainer}>
                {draft.photoUri ? (
                  <Image source={{ uri: draft.photoUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderBox}>
                    <View style={styles.placeholderIcon}>
                      <Ionicons name="camera-outline" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.placeholderTitle}>拍一张照片</Text>
                    <Text style={styles.placeholderDesc}>照片可以帮你更快识别冰箱深处的物品</Text>
                  </View>
                )}
              </Pressable>

              <Pressable onPress={handlePhotoCapture} style={styles.captureBtn}>
                <Ionicons name="scan-outline" size={18} color="#FFF" />
                <Text style={styles.captureBtnText}>{draft.photoUri ? '重拍照片' : '立即拍一张'}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.glassCard}>
              <View style={styles.sectionTop}>
                <View>
                  <Text style={styles.sectionEyebrow}>STEP 02</Text>
                  <Text style={styles.sectionTitle}>设定到期</Text>
                </View>
              </View>

              <View style={styles.dateSelector}>
                <View style={styles.chipRow}>
                  {quickDateOptions.map((option) => {
                    const active = selectedQuickDate === option.offsetDays;
                    return (
                      <Pressable
                        key={option.label}
                        onPress={() => applyQuickDate(option.offsetDays)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.inputBox}>
                  <TextInput
                    value={customDaysInput}
                    onChangeText={(value) => {
                      const normalized = value.replace(/[^0-9]/g, '');
                      setCustomDaysInput(normalized);
                      if (!normalized) {
                        updateDraft('expiresOn', '');
                        setSelectedQuickDate(null);
                        return;
                      }
                      const offsetDays = Number(normalized);
                      if (Number.isFinite(offsetDays)) {
                        updateDraft('expiresOn', createDateString(offsetDays));
                        setSelectedQuickDate(offsetDays <= 1 ? offsetDays : null);
                      }
                    }}
                    placeholder="或者输入天数"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                  <Text style={styles.inputSuffix}>天后过期</Text>
                </View>
                
                {draft.expiresOn ? (
                  <Text style={styles.dateHint}>
                    预计过期日期：<Text style={styles.dateVal}>{draft.expiresOn}</Text>
                  </Text>
                ) : null}
              </View>

              <View style={styles.actionRow}>
                <Pressable 
                  onPress={() => void handleQuickAdd()} 
                  disabled={isMutating} 
                  style={[styles.submitBtn, isMutating && styles.btnDisabled]}
                >
                  <Text style={styles.submitBtnText}>{isMutating ? '同步中...' : '加入冰箱'}</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/(tabs)/inventory')} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>以后再说</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function FeedbackBanner({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  return (
    <View style={[styles.feedback, tone === 'success' ? styles.fbSuccess : styles.fbError]}>
      <Text style={[styles.fbText, tone === 'success' ? styles.ftSuccess : styles.ftError]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 24,
  },
  header: {
    marginTop: 8,
  },
  headerText: {
    gap: 2,
  },
  kicker: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: typography.bodyBold,
    letterSpacing: 2.5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontFamily: typography.displayBold,
    letterSpacing: -0.5,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  syncDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.bodyMedium,
    opacity: 0.8,
  },
  cardWrapper: {
    ...shadows.card,
  },
  cardBorder: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  glassCard: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    gap: 20,
  },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionEyebrow: {
    fontSize: 9,
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: typography.displayBold,
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: typography.bodyBold,
    color: colors.success,
  },
  previewContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  previewImage: {
    width: '100%',
    height: 240,
  },
  placeholderBox: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: typography.displayBold,
    color: colors.textPrimary,
  },
  placeholderDesc: {
    fontSize: 14,
    fontFamily: typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  captureBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadows.soft,
  },
  captureBtnText: {
    fontSize: 15,
    fontFamily: typography.bodyBold,
    color: '#FFF',
  },
  dateSelector: {
    gap: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  chipActive: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
  },
  chipText: {
    fontSize: 13,
    fontFamily: typography.bodyBold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.bodyBold,
    color: colors.textPrimary,
  },
  inputSuffix: {
    fontSize: 13,
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
  },
  dateHint: {
    fontSize: 12,
    fontFamily: typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dateVal: {
    fontFamily: typography.bodyBold,
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: typography.bodyBold,
    color: '#FFF',
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: typography.bodyBold,
    color: colors.textSecondary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  feedback: {
    padding: 12,
    borderRadius: 12,
  },
  fbSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  fbError: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  fbText: {
    fontSize: 13,
    fontFamily: typography.bodyMedium,
    textAlign: 'center',
  },
  ftSuccess: {
    color: colors.success,
  },
  ftError: {
    color: colors.danger,
  },
});
