import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { CreateFridgeItemInput, useInventoryStore } from '@/src/store/useInventoryStore';

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
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (!params.photo_uri && !params.photo_feedback) {
      return;
    }

    if (params.photo_uri) {
      setDraft((current) => ({
        ...current,
        photoUri: params.photo_uri,
      }));
    }

    if (params.photo_feedback) {
      setSuccessMessage(params.photo_feedback);
    }
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

  async function handleQuickAdd() {
    if (!draft.photoUri) {
      setFormError('请先拍一张食物照片');
      return;
    }

    if (!draft.expiresOn) {
      setFormError('请先补一个到期时间');
      return;
    }

    setFormError('');
    setSuccessMessage('');
    clearError();

    try {
      await addItem({
        ...draft,
        name: draft.name.trim() || '未命名食材',
      });

      setSuccessMessage('已加入库存。');
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
        <View style={styles.topGlow} />

        <View style={styles.header}>
          <Text style={styles.kicker}>入库</Text>
          <Text style={styles.title}>添加一件</Text>
          <Text style={styles.subtitle}>只保留拍照和到期时间两步。</Text>
          <Text style={styles.meta}>{inventoryCount} 件在库</Text>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionEyebrow}>照片</Text>
              <Text style={styles.sectionTitle}>先拍食物</Text>
            </View>
            <Text style={styles.sectionMeta}>{draft.photoUri ? '已完成' : '待拍'}</Text>
          </View>

          {successMessage ? <FeedbackBanner tone="success" text={successMessage} /> : null}
          {formError ? <FeedbackBanner tone="error" text={formError} /> : null}

          <Pressable onPress={handlePhotoCapture} style={styles.photoPreviewCard}>
            {draft.photoUri ? (
              <Image source={{ uri: draft.photoUri }} style={styles.photoPreviewImage} />
            ) : (
              <View style={styles.photoPreviewPlaceholder}>
                <View style={styles.photoPreviewIconShell}>
                  <Ionicons name="camera-outline" size={26} color={colors.primaryDeep} />
                </View>
                <Text style={styles.photoPreviewTitle}>拍一张照片</Text>
                <Text style={styles.photoPreviewText}>后面看库存时，直接靠照片辨认冰箱里有什么。</Text>
              </View>
            )}
          </Pressable>

          <Pressable onPress={handlePhotoCapture} style={styles.primaryToolButton}>
            <Ionicons name="camera-outline" size={16} color={colors.textOnDark} />
            <Text style={styles.primaryToolText}>{draft.photoUri ? '重拍照片' : '拍食物'}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionEyebrow}>日期</Text>
              <Text style={styles.sectionTitle}>设一个到期时间</Text>
            </View>
            <Text style={styles.sectionMeta}>{draft.expiresOn ? '已选择' : '待设'}</Text>
          </View>

          <Text style={styles.sectionDescription}>今天、明天，或者输入几天后。</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {quickDateOptions.map((option) => {
              const active = selectedQuickDate === option.offsetDays;

              return (
                <Pressable
                  key={option.label}
                  onPress={() => applyQuickDate(option.offsetDays)}
                  style={[styles.quickDateChip, active && styles.quickDateChipActive]}
                >
                  <Text style={[styles.quickDateChipText, active && styles.quickDateChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.customDaysRow}>
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
                if (!Number.isFinite(offsetDays)) {
                  return;
                }

                updateDraft('expiresOn', createDateString(offsetDays));
                setSelectedQuickDate(offsetDays <= 1 ? offsetDays : null);
              }}
              placeholder="输入天数"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.customDaysInput}
            />
            <Text style={styles.customDaysSuffix}>天后到期</Text>
          </View>

          {draft.expiresOn ? <Text style={styles.selectedDateHint}>预计到期日 {draft.expiresOn}</Text> : null}

          <View style={styles.actionRow}>
            <Pressable onPress={() => void handleQuickAdd()} disabled={isMutating} style={[styles.primaryButton, isMutating && styles.buttonDisabled]}>
              <Text style={styles.primaryButtonText}>{isMutating ? '处理中...' : '加入库存'}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/inventory')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>现有库存</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function FeedbackBanner({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  return (
    <View style={[styles.feedbackBanner, tone === 'success' ? styles.feedbackBannerSuccess : styles.feedbackBannerError]}>
      <Text style={[styles.feedbackText, tone === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 136,
    gap: spacing.xl,
  },
  topGlow: {
    position: 'absolute',
    top: -120,
    right: -84,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(111,214,255,0.11)',
  },
  header: {
    gap: 4,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.4,
    fontFamily: typography.bodyBold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontFamily: typography.displayHeavy,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodySemibold,
  },
  sectionBlock: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: typography.bodyBold,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.displayBold,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    paddingTop: 6,
    fontFamily: typography.bodyBold,
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  feedbackBanner: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  feedbackBannerSuccess: {
    backgroundColor: '#EFFAF6',
  },
  feedbackBannerError: {
    backgroundColor: '#FFF3F1',
  },
  feedbackText: {
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  feedbackTextSuccess: {
    color: colors.success,
  },
  feedbackTextError: {
    color: colors.danger,
  },
  photoPreviewCard: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 260,
  },
  photoPreviewImage: {
    width: '100%',
    height: 260,
  },
  photoPreviewPlaceholder: {
    minHeight: 260,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  photoPreviewIconShell: {
    width: 60,
    height: 60,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPreviewTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: typography.displayBold,
  },
  photoPreviewText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
    fontFamily: typography.bodyMedium,
  },
  primaryToolButton: {
    minHeight: 50,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.soft,
  },
  primaryToolText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  chipRow: {
    gap: spacing.sm,
  },
  quickDateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickDateChipActive: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
  },
  quickDateChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  quickDateChipTextActive: {
    color: colors.textOnDark,
  },
  customDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  customDaysInput: {
    flex: 1,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.bodyBold,
  },
  customDaysSuffix: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodySemibold,
  },
  selectedDateHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodyBold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1.2,
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  primaryButtonText: {
    color: colors.textOnDark,
    fontSize: 15,
    fontFamily: typography.bodyBold,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
