import { useEffect, useMemo, useState } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { formatStorageSpaceLabel, getDaysUntilExpiration } from '@/src/lib/expiry';
import { CreateFridgeItemInput, useInventoryStore } from '@/src/store/useInventoryStore';
import { ItemCategory, ItemStatus, StorageSpace } from '@/src/types/item';

const statusLabelMap = {
  active: '库存中',
  eaten: '已吃掉',
  discarded: '已丢弃',
  expired: '已过期',
} as const;

const categoryLabelMap: Record<ItemCategory, string> = {
  ingredient: '食材',
  fruit: '水果',
  drink: '饮品',
  dessert: '甜品',
  snack: '零食',
  leftover: '剩菜',
  prepared: '熟食',
  other: '其他',
};

const quickAddCategoryOptions: Array<{ label: string; value: ItemCategory }> = [
  { label: '食材', value: 'ingredient' },
  { label: '水果', value: 'fruit' },
  { label: '饮品', value: 'drink' },
  { label: '甜品', value: 'dessert' },
  { label: '零食', value: 'snack' },
  { label: '剩菜', value: 'leftover' },
  { label: '熟食', value: 'prepared' },
  { label: '其他', value: 'other' },
];

const quickAddStorageOptions: Array<{ label: string; value: StorageSpace }> = [
  { label: '冷藏', value: 'chilled' },
  { label: '冷冻', value: 'frozen' },
  { label: '其他', value: 'other' },
];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const updateItemStatus = useInventoryStore((state) => state.updateItemStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const clearError = useInventoryStore((state) => state.clearError);
  const item = useMemo(() => items.find((currentItem) => currentItem.id === id), [id, items]);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<CreateFridgeItemInput>({
    name: '',
    category: 'ingredient',
    storageSpace: 'chilled',
    expiresOn: '',
    quantity: undefined,
    quantityUnit: '',
    note: '',
  });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (!item) {
      return;
    }

    setEditDraft({
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace ?? 'chilled',
      expiresOn: item.expiresOn ? item.expiresOn.slice(0, 10) : '',
      quantity: item.quantity,
      quantityUnit: item.quantityUnit ?? '',
      note: item.note ?? '',
    });
  }, [item]);

  function updateEditDraft<K extends keyof CreateFridgeItemInput>(key: K, value: CreateFridgeItemInput[K]) {
    setEditDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetEditDraft() {
    if (!item) {
      return;
    }

    setEditDraft({
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace ?? 'chilled',
      expiresOn: item.expiresOn ? item.expiresOn.slice(0, 10) : '',
      quantity: item.quantity,
      quantityUnit: item.quantityUnit ?? '',
      note: item.note ?? '',
    });
  }

  function handleStatusUpdate(status: ItemStatus) {
    if (!item) {
      return;
    }

    const actionText = statusLabelMap[status];

    Alert.alert('更新库存状态', `确定将「${item.name}」标记为${actionText}吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          clearError();
          setEditError('');
          try {
            await updateItemStatus(item.id, status);
            setFeedbackMessage(`已更新状态：${actionText}`);
          } catch {
            setEditError('更新状态失败，请稍后再试');
          }
        },
      },
    ]);
  }

  async function handleSaveEdit() {
    if (!item) {
      return;
    }

    if (editDraft.name.trim().length === 0) {
      setEditError('请先填写物品名称');
      return;
    }

    if (editDraft.quantity !== undefined && (!Number.isFinite(editDraft.quantity) || editDraft.quantity <= 0)) {
      setEditError('数量必须是大于 0 的数字');
      return;
    }

    clearError();
    setEditError('');

    try {
      await updateItem(item.id, {
        name: editDraft.name,
        category: editDraft.category,
        storageSpace: editDraft.storageSpace,
        expiresOn: editDraft.expiresOn,
        quantity: editDraft.quantity && editDraft.quantity > 0 ? editDraft.quantity : undefined,
        quantityUnit: editDraft.quantityUnit,
        note: editDraft.note,
      });
      setFeedbackMessage('详情已更新');
      setIsEditing(false);
    } catch {
      setEditError('保存失败，请稍后再试');
    }
  }

  function handleDeleteItem() {
    if (!item) {
      return;
    }

    Alert.alert('确认删除', `确定要删除「${item.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          clearError();
          setEditError('');

          try {
            await removeItem(item.id);
            router.replace('/(tabs)/inventory');
          } catch {
            setEditError('删除失败，请稍后再试');
          }
        },
      },
    ]);
  }

  function toggleEdit() {
    if (isEditing) {
      resetEditDraft();
      setEditError('');
    }
    setFeedbackMessage('');
    setIsEditing((current) => !current);
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topGlow} />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={18} color={colors.primaryDeep} />
            <Text style={styles.backText}>返回</Text>
          </Pressable>
          <Text style={styles.pageEyebrow}>库存详情</Text>
          <Text style={styles.pageTitle}>{item?.name ?? '物品详情'}</Text>
          {item ? <Text style={styles.pageSubtitle}>{statusLabelMap[item.status]}</Text> : null}
        </View>

        {!item ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.emptyTitle}>未找到该物品</Text>
            <Text style={styles.emptyDescription}>可能已经被删除，或者库存数据尚未同步。</Text>
          </View>
        ) : (
          <>
            <HeroDecisionCard
              itemName={item.name}
              photoUri={item.photoUri}
              status={item.status}
              expireAt={item.expireAt}
              daysUntilExpiration={getDaysUntilExpiration(item)}
              storageSpace={item.storageSpace}
            />

            {feedbackMessage ? <FeedbackBanner tone="success" text={feedbackMessage} /> : null}
            {editError ? <FeedbackBanner tone="error" text={editError} /> : null}

            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionEyebrow}>主操作</Text>
                  <Text style={styles.sectionTitle}>调整当前状态</Text>
                </View>
              </View>

              {item.status === 'active' ? (
                <View style={styles.primaryActionGrid}>
                  <PrimaryActionCard icon="restaurant-outline" title="标记吃掉" description="这件食材已经处理完成。" color={colors.success} onPress={() => handleStatusUpdate('eaten')} />
                  <PrimaryActionCard icon="trash-outline" title="标记丢弃" description="这条记录会退出当前库存。" color={colors.danger} onPress={() => handleStatusUpdate('discarded')} />
                </View>
              ) : (
                <PrimaryActionCard icon="refresh-outline" title="恢复到库存中" description="如果刚才误操作，可以恢复回来。" color={colors.info} onPress={() => handleStatusUpdate('active')} />
              )}

              <View style={styles.secondaryActions}>
                {item.status === 'active' ? (
                  <MiniActionButton label="标记过期" icon="alert-circle-outline" color={colors.warning} onPress={() => handleStatusUpdate('expired')} />
                ) : null}
                <MiniActionButton label="删除记录" icon="close-outline" color={colors.textSecondary} onPress={handleDeleteItem} />
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionEyebrow}>记录信息</Text>
                  <Text style={styles.sectionTitle}>基础字段</Text>
                </View>
                <Pressable onPress={toggleEdit}>
                  <Text style={styles.editLinkText}>{isEditing ? '收起编辑' : '编辑'}</Text>
                </Pressable>
              </View>

              {isEditing ? (
                <View style={styles.editPanel}>
                  <TextInput
                    value={editDraft.name}
                    onChangeText={(value) => {
                      updateEditDraft('name', value);
                      if (editError) {
                        setEditError('');
                      }
                    }}
                    placeholder="物品名称"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {quickAddCategoryOptions.map((option) => {
                      const active = option.value === editDraft.category;
                      return (
                        <Pressable
                          key={`detail-category-${option.value}`}
                          onPress={() => updateEditDraft('category', option.value)}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {quickAddStorageOptions.map((option) => {
                      const active = option.value === editDraft.storageSpace;
                      return (
                        <Pressable
                          key={`detail-storage-${option.value}`}
                          onPress={() => updateEditDraft('storageSpace', option.value)}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.inlineInputs}>
                    <TextInput
                      value={editDraft.expiresOn ?? ''}
                      onChangeText={(value) => updateEditDraft('expiresOn', value)}
                      placeholder="到期日期，如 2026-04-09"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, styles.flexInput]}
                    />
                    <TextInput
                      value={editDraft.quantity ? String(editDraft.quantity) : ''}
                      onChangeText={(value) => updateEditDraft('quantity', value ? Number(value) : undefined)}
                      placeholder="数量"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      style={[styles.input, styles.smallInput]}
                    />
                  </View>
                  <View style={styles.inlineInputs}>
                    <TextInput
                      value={editDraft.quantityUnit ?? ''}
                      onChangeText={(value) => updateEditDraft('quantityUnit', value)}
                      placeholder="单位"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, styles.smallInput]}
                    />
                    <TextInput
                      value={editDraft.note ?? ''}
                      onChangeText={(value) => updateEditDraft('note', value)}
                      placeholder="备注"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, styles.flexInput]}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <Pressable
                      onPress={() => {
                        resetEditDraft();
                        setIsEditing(false);
                        setEditError('');
                      }}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>取消</Text>
                    </Pressable>
                    <Pressable onPress={() => void handleSaveEdit()} disabled={isMutating} style={[styles.primaryButton, isMutating && styles.buttonDisabled]}>
                      <Text style={styles.primaryButtonText}>{isMutating ? '保存中...' : '保存修改'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.infoGrid}>
                  <InfoCard label="状态" value={statusLabelMap[item.status]} />
                  <InfoCard label="分类" value={categoryLabelMap[item.category]} />
                  <InfoCard label="位置" value={formatStorageSpaceLabel(item.storageSpace)} />
                  <InfoCard label="到期" value={item.expireAt ?? '未设置'} />
                  <InfoCard label="数量" value={item.quantity ? `${item.quantity}${item.quantityUnit ?? ''}` : '--'} />
                  <InfoCard label="备注" value={item.note ?? '暂无备注'} fullWidth />
                </View>
              )}
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionEyebrow}>时间信息</Text>
                <Text style={styles.sectionTitle}>记录轨迹</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>创建时间</Text>
                <Text style={styles.detailValue}>{item.createdAt ?? '未知'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>更新时间</Text>
                <Text style={styles.detailValue}>{item.updatedAt ?? '未知'}</Text>
              </View>
            </View>

            <Pressable onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { itemId: item.id } })} style={styles.bottomActionButton}>
              <Text style={styles.bottomActionText}>回到库存列表定位这件食材</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function HeroDecisionCard({
  itemName,
  photoUri,
  status,
  expireAt,
  daysUntilExpiration,
  storageSpace,
}: {
  itemName: string;
  photoUri?: string;
  status: ItemStatus;
  expireAt?: string;
  daysUntilExpiration: number | null;
  storageSpace?: StorageSpace;
}) {
  const decision = getDecisionState(status, daysUntilExpiration);

  return (
    <View style={[styles.heroCard, { backgroundColor: decision.backgroundColor }]}> 
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.heroPhoto} />
      ) : (
        <View style={styles.heroPhotoFallback}>
          <Ionicons name="image-outline" size={30} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.heroTopRow}>
        <View style={[styles.heroIconWrap, { backgroundColor: `${decision.color}18` }]}> 
          <Ionicons name={decision.icon} size={22} color={decision.color} />
        </View>
        <View style={styles.heroTextGroup}>
          <Text style={styles.heroKicker}>{statusLabelMap[status]}</Text>
          <Text style={styles.heroTitle}>{itemName}</Text>
        </View>
      </View>
      <Text style={[styles.heroDecisionTitle, { color: decision.color }]}>{decision.title}</Text>
      <Text style={styles.heroDecisionDescription}>{decision.description}</Text>
      <View style={styles.heroMetaRow}>
        <HeroPill icon="calendar-outline" text={expireAt ?? '未设置日期'} />
        <HeroPill icon="snow-outline" text={formatStorageSpaceLabel(storageSpace)} />
      </View>
    </View>
  );
}

function HeroPill({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.heroPill}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.heroPillText}>{text}</Text>
    </View>
  );
}

function FeedbackBanner({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  return (
    <View style={[styles.feedbackBanner, tone === 'success' ? styles.feedbackBannerSuccess : styles.feedbackBannerError]}>
      <Text style={[styles.feedbackText, tone === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError]}>{text}</Text>
    </View>
  );
}

function PrimaryActionCard({
  icon,
  title,
  description,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.primaryActionCard}>
      <View style={[styles.primaryActionIcon, { backgroundColor: `${color}18` }]}> 
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.primaryActionBody}>
        <Text style={styles.primaryActionTitle}>{title}</Text>
        <Text style={styles.primaryActionDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

function MiniActionButton({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.miniActionButton}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.miniActionButtonText}>{label}</Text>
    </Pressable>
  );
}

function InfoCard({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <View style={[styles.infoCard, fullWidth && styles.infoCardFull]}>
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </View>
  );
}

function getDecisionState(status: ItemStatus, daysUntilExpiration: number | null) {
  if (status === 'eaten') {
    return {
      title: '已处理',
      description: '这条记录会继续保留在归档里。',
      color: colors.success,
      backgroundColor: '#F3FBF8',
      icon: 'checkmark-done-outline' as const,
    };
  }

  if (status === 'discarded' || status === 'expired') {
    return {
      title: '已退出库存',
      description: '如果是误操作，可以恢复到库存中。',
      color: colors.danger,
      backgroundColor: '#FFF5F3',
      icon: 'warning-outline' as const,
    };
  }

  if (daysUntilExpiration === null) {
    return {
      title: '待补日期',
      description: '补一个到期时间后，提醒会更准确。',
      color: colors.info,
      backgroundColor: '#F4F8FC',
      icon: 'time-outline' as const,
    };
  }

  if (daysUntilExpiration < 0) {
    return {
      title: '已经过期',
      description: '建议尽快确认状态并处理。',
      color: colors.danger,
      backgroundColor: '#FFF5F3',
      icon: 'alert-circle-outline' as const,
    };
  }

  if (daysUntilExpiration === 0) {
    return {
      title: '今天到期',
      description: '适合今天优先安排掉。',
      color: colors.danger,
      backgroundColor: '#FFF8F4',
      icon: 'flash-outline' as const,
    };
  }

  if (daysUntilExpiration === 1) {
    return {
      title: '明天到期',
      description: '建议提前处理，避免忘记。',
      color: colors.warning,
      backgroundColor: '#FFF9EF',
      icon: 'moon-outline' as const,
    };
  }

  return {
    title: `还能放 ${daysUntilExpiration} 天`,
    description: '当前状态稳定。',
    color: colors.success,
    backgroundColor: '#F2FBF8',
    icon: 'leaf-outline' as const,
  };
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
    top: -110,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(111,214,255,0.11)',
  },
  header: {
    gap: spacing.xs,
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
  pageEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: typography.bodyBold,
  },
  pageTitle: {
    fontSize: 34,
    color: colors.textPrimary,
    fontFamily: typography.displayHeavy,
  },
  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.bodyMedium,
  },
  heroCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.card,
  },
  heroPhoto: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
  },
  heroPhotoFallback: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextGroup: {
    flex: 1,
    gap: 2,
  },
  heroKicker: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    fontFamily: typography.bodyBold,
  },
  heroTitle: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: typography.displayBold,
  },
  heroDecisionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: typography.displayBold,
  },
  heroDecisionDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroPillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodyBold,
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
  sectionBlock: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: typography.displayBold,
  },
  primaryActionGrid: {
    gap: spacing.sm,
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBody: {
    flex: 1,
    gap: 4,
  },
  primaryActionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: typography.bodyBold,
  },
  primaryActionDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.bodyMedium,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  miniActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniActionButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  editLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: typography.bodyBold,
    paddingTop: 6,
  },
  editPanel: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: typography.bodyMedium,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bodyBold,
  },
  filterChipTextActive: {
    color: colors.textOnDark,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexInput: {
    flex: 1,
  },
  smallInput: {
    width: 110,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
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
  buttonDisabled: {
    opacity: 0.55,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  infoCardFull: {
    width: '100%',
  },
  infoCardLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodyBold,
  },
  infoCardValue: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.bodyBold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.bodyMedium,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
    fontFamily: typography.bodyBold,
  },
  emptyTitle: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: typography.displayBold,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  bottomActionButton: {
    minHeight: 54,
    backgroundColor: colors.primaryDeep,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  bottomActionText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
});
