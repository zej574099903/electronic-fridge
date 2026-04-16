import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { getDaysUntilExpiration, getExpirePriority } from '@/src/lib/expiry';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';
import { FridgeItem, ItemStatus } from '@/src/types/item';

const statusLabelMap: Record<ItemStatus, string> = {
  active: '库存中',
  eaten: '已吃掉',
  discarded: '已丢弃',
  expired: '已过期',
};

export default function InventoryTabScreen() {
  const params = useLocalSearchParams<{
    itemId?: string;
  }>();
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const updateItemStatus = useInventoryStore((state) => state.updateItemStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const fetchItems = useInventoryStore((state) => state.fetchItems);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(params.itemId ?? null);

  const currentItems = useMemo(() => {
    return [...items]
      .filter((item) => item.status === 'active')
      .sort((left, right) => {
        const priorityDelta = getExpirePriority(left) - getExpirePriority(right);
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime();
      });
  }, [items]);

  const urgentCount = useMemo(() => currentItems.filter((item) => getExpirePriority(item) <= 1).length, [currentItems]);
  const undatedCount = useMemo(() => currentItems.filter((item) => !item.expiresOn).length, [currentItems]);
  const syncText = formatLastSyncedAt(lastSyncedAt);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (params.itemId) {
      setExpandedItemId(params.itemId);
    }
  }, [params.itemId]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await fetchItems();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleStatusUpdate(id: string, name: string, status: ItemStatus) {
    Alert.alert('更新库存状态', `确定将「${name}」标记为${statusLabelMap[status]}吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          try {
            await updateItemStatus(id, status);
          } catch {
            Alert.alert('更新失败', '请稍后再试');
          }
        },
      },
    ]);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('确认删除', `确定要删除「${name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItem(id);
          } catch {
            Alert.alert('删除失败', '请稍后再试');
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor={colors.primary} />}
      >
        <View style={styles.topGlow} />

        <View style={styles.header}>
          <View style={styles.headerBody}>
            <Text style={styles.kicker}>库存</Text>
            <Text style={styles.title}>现有库存</Text>
            <Text style={styles.subtitle}>{currentItems.length} 件在库，按到期顺序排列</Text>
            <Text style={styles.syncText}>{syncText}</Text>
          </View>
          <Pressable onPress={() => void handleRefresh()} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={18} color={colors.primaryDeep} />
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <InventoryMetric label="优先" value={urgentCount} />
          <InventoryMetric label="在库" value={currentItems.length} />
          <InventoryMetric label="未设日期" value={undatedCount} />
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionEyebrow}>列表</Text>
              <Text style={styles.sectionTitle}>按到期排列</Text>
            </View>
            <Text style={styles.sectionMeta}>{currentItems.length} 件</Text>
          </View>
          <Text style={styles.sectionDescription}>长按卡片可直接标记吃掉、丢弃或删除。</Text>

          {currentItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconShell}>
                <Ionicons name="cube-outline" size={24} color={colors.primaryDeep} />
              </View>
              <Text style={styles.emptyTitle}>现在还没有库存</Text>
              <Text style={styles.emptyDescription}>从中间的入库按钮开始，第一件记录会出现在这里。</Text>
              <Pressable onPress={() => router.push('/(tabs)/intake')} style={styles.emptyActionButton}>
                <Text style={styles.emptyActionText}>去入库</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.inventoryList}>
              {currentItems.map((item) => {
                const priority = getExpirePriority(item);
                const toneColor = priority <= 1 ? colors.danger : priority <= 3 ? colors.warning : colors.success;
                const expanded = expandedItemId === item.id;

                return (
                  <View key={item.id} style={[styles.itemCard, params.itemId === item.id && styles.itemCardHighlighted]}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                      onLongPress={() => setExpandedItemId(expanded ? null : item.id)}
                    >
                      <View style={styles.itemTop}>
                        {item.photoUri ? (
                          <Image source={{ uri: item.photoUri }} style={styles.itemPhoto} />
                        ) : (
                          <View style={[styles.itemPhotoFallback, { backgroundColor: `${toneColor}18` }]}>
                            <Ionicons name="image-outline" size={22} color={toneColor} />
                          </View>
                        )}

                        <View style={styles.itemBody}>
                          <View style={styles.itemMetaRow}>
                            <View style={[styles.itemExpirePill, { backgroundColor: `${toneColor}14` }]}>
                              <Text style={[styles.itemExpirePillText, { color: toneColor }]}>{formatRemainingText(item)}</Text>
                            </View>
                          </View>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>{item.expiresOn ? `到期日 ${item.expiresOn.slice(0, 10)}` : '未设置日期'}</Text>
                        </View>
                      </View>
                    </Pressable>

                    {expanded ? (
                      <View style={styles.itemActionRow}>
                        <MiniAction
                          label="吃掉"
                          icon="restaurant-outline"
                          color={colors.success}
                          backgroundColor="#EFFAF6"
                          borderColor="#CFECDD"
                          onPress={() => void handleStatusUpdate(item.id, item.name, 'eaten')}
                        />
                        <MiniAction
                          label="丢弃"
                          icon="trash-outline"
                          color={colors.danger}
                          backgroundColor="#FFF4F2"
                          borderColor="#F3D3CF"
                          onPress={() => void handleStatusUpdate(item.id, item.name, 'discarded')}
                        />
                        <MiniAction
                          label="删除"
                          icon="close-outline"
                          color={colors.textSecondary}
                          backgroundColor="#F5F8FB"
                          borderColor={colors.border}
                          onPress={() => handleDelete(item.id, item.name)}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InventoryMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatRemainingText(item: FridgeItem) {
  const days = getDaysUntilExpiration(item);

  if (days === null) {
    return '未设日期';
  }

  if (days < 0) {
    return `已过期 ${Math.abs(days)} 天`;
  }

  if (days === 0) {
    return '今天到期';
  }

  if (days === 1) {
    return '明天到期';
  }

  return `${days} 天后到期`;
}

function MiniAction({
  label,
  icon,
  color,
  backgroundColor,
  borderColor,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  borderColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.miniAction, { backgroundColor, borderColor }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.miniActionText, { color }]}>{label}</Text>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerBody: {
    flex: 1,
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
  syncText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodySemibold,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.displayBold,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodyBold,
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
    fontFamily: typography.bodyBold,
    paddingTop: 6,
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  emptyCard: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIconShell: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: typography.displayBold,
  },
  emptyDescription: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  emptyActionButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  emptyActionText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  inventoryList: {
    gap: spacing.sm,
  },
  itemCard: {
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  itemCardHighlighted: {
    borderColor: colors.primaryDeep,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  itemPhoto: {
    width: 90,
    height: 90,
    borderRadius: radii.md,
  },
  itemPhotoFallback: {
    width: 90,
    height: 90,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemExpirePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  itemExpirePillText: {
    fontSize: 12,
    fontFamily: typography.bodyBold,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: typography.displayBold,
  },
  itemMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodyMedium,
  },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 2,
  },
  miniAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  miniActionText: {
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
});
