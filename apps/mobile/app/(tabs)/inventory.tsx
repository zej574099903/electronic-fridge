import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { GradientText } from '@/src/components/GradientText';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { RemoteImage } from '@/src/components/RemoteImage';
import { getImagePath, deleteRemoteImage } from '@/src/constants/network';
import { getDaysUntilExpiration, getExpirePriority } from '@/src/lib/expiry';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';
import { FridgeItem, ItemStatus } from '@/src/types/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const statusLabelMap: Record<ItemStatus, string> = {
  active: '库存中',
  eaten: '已吃掉',
  discarded: '已丢弃',
  expired: '已过期',
};

function formatRemainingText(item: FridgeItem) {
  const days = getDaysUntilExpiration(item);
  if (days === null) return '日期待补';
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return '今日到期';
  if (days === 1) return '明日到期';
  return `${days} 天后过期`;
}

export default function InventoryTabScreen() {
  const params = useLocalSearchParams<{ itemId?: string }>();
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
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
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime();
      });
  }, [items]);

  const urgentCount = useMemo(() => currentItems.filter((item) => getExpirePriority(item) <= 1).length, [currentItems]);
  const undatedCount = useMemo(() => currentItems.filter((item) => !item.expiresOn).length, [currentItems]);
  const syncText = formatLastSyncedAt(lastSyncedAt);

  useEffect(() => {
    if (!initialized) void fetchItems();
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (params.itemId) setExpandedItemId(params.itemId);
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
            const currentItem = items.find(i => i.id === id);
            await updateItemStatus(id, status);
            
            // 物理清理：处理完了就删掉照片
            if ((status === 'eaten' || status === 'discarded') && currentItem?.photoUri) {
              void deleteRemoteImage(currentItem.photoUri);
            }
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
            const currentItem = items.find(i => i.id === id);
            await removeItem(id);
            
            // 物理清理
            if (currentItem?.photoUri) {
              void deleteRemoteImage(currentItem.photoUri);
            }
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
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => void handleRefresh()} 
            tintColor={colors.primary} 
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>INVENTORY STATUS</Text>
            <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.title}>
              现有列表
            </GradientText>
            <View style={styles.syncRow}>
              <View style={styles.syncDot} />
              <Text style={styles.subtitle}>{syncText}</Text>
            </View>
          </View>
          <Pressable onPress={() => void handleRefresh()} style={styles.refreshButton}>
            <BlurView intensity={20} tint="light" style={styles.refreshBlur}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            </BlurView>
          </Pressable>
        </View>

        {/* Global Styled Metrics */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <BlurView intensity={40} tint="light" style={styles.summaryCard}>
              <View style={styles.metricsRow}>
                <OverviewMetric label="优先" value={urgentCount} icon="alert-circle" tint={colors.danger} />
                <View style={styles.metricDivider} />
                <OverviewMetric label="全部" value={currentItems.length} icon="cube" tint={colors.primary} />
                <View style={styles.metricDivider} />
                <OverviewMetric label="待补" value={undatedCount} icon="time" tint={colors.warning} />
              </View>
            </BlurView>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <View style={styles.sectionSlug} />
            <Text style={styles.sectionTitle}>库存清单</Text>
          </View>
          <Text style={styles.sectionLabel}>LIST</Text>
        </View>

        {currentItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <BlurView intensity={10} tint="light" style={styles.emptyBlur}>
              <View style={styles.emptyCircle}>
                <Ionicons name="cube-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>当前没有库存物品</Text>
              <Pressable onPress={() => router.push('/(tabs)/intake')} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>去入库</Text>
              </Pressable>
            </BlurView>
          </View>
        ) : (
          <View style={styles.itemGrid}>
            {currentItems.map((item, index) => {
              const priority = getExpirePriority(item);
              const toneColor = priority <= 1 ? colors.danger : priority <= 3 ? colors.warning : colors.primaryDeep;
              const expanded = expandedItemId === item.id;

              return (
                <View key={item.id} style={styles.itemWrapper}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                    onLongPress={() => setExpandedItemId(expanded ? null : item.id)}
                    style={[styles.itemCard, params.itemId === item.id && styles.itemCardHighlighted]}
                  >
                    <View style={styles.itemImageWrapper}>
                      {item.photoUri ? (
                        <RemoteImage 
                          photoUri={item.photoUri} 
                          style={styles.itemImage} 
                          resizeMode="cover" 
                        />
                      ) : (
                        <View style={styles.itemFallback}>
                          <Ionicons name="file-tray-full-outline" size={24} color={colors.textMuted} />
                        </View>
                      )}
                      {priority <= 1 && (
                        <BlurView intensity={60} tint="light" style={styles.urgentTag}>
                          <Text style={styles.urgentText}>紧急</Text>
                        </BlurView>
                      )}
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.itemHeaderInner}>
                        <Text style={styles.itemLabel}>ITEM #{index + 1}</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                      </View>
                      <View style={styles.itemTextContent}>
                        <Text style={styles.itemName} numberOfLines={1}>{formatRemainingText(item)}</Text>
                        <Text style={styles.itemSubtext}>
                          过期日期: {item.expiresOn?.slice(0, 10) || '未设定'}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {expanded && (
                    <BlurView intensity={20} tint="light" style={styles.actionRow}>
                      <MiniAction
                        label="吃掉"
                        icon="restaurant-outline"
                        color={colors.success}
                        onPress={() => void handleStatusUpdate(item.id, item.name, 'eaten')}
                      />
                      <View style={styles.actionDivider} />
                      <MiniAction
                        label="丢弃"
                        icon="trash-outline"
                        color={colors.danger}
                        onPress={() => void handleStatusUpdate(item.id, item.name, 'discarded')}
                      />
                      <View style={styles.actionDivider} />
                      <MiniAction
                        label="删除"
                        icon="close-outline"
                        color={colors.textSecondary}
                        onPress={() => handleDelete(item.id, item.name)}
                      />
                    </BlurView>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function OverviewMetric({ label, value, icon, tint }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; tint: string; }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIconBox}>
        <Ionicons name={icon} size={15} color={tint} />
      </View>
      <View>
        <Text style={styles.metricVal}>{value}</Text>
        <Text style={styles.metricLab}>{label}</Text>
      </View>
    </View>
  );
}

function MiniAction({ label, icon, color, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void; }) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#34D399',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.bodyMedium,
    opacity: 0.8,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  refreshBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
  summaryCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  metricVal: {
    fontSize: 18,
    fontFamily: typography.displayBold,
    color: colors.textPrimary,
  },
  metricLab: {
    fontSize: 11,
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionSlug: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.displayBold,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  emptyBox: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  emptyBlur: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  itemGrid: {
    gap: 16,
  },
  itemWrapper: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadows.soft,
  },
  itemCardHighlighted: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  itemImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(218, 106, 94, 0.4)',
  },
  urgentText: {
    fontSize: 7,
    fontFamily: typography.bodyHeavy,
    color: colors.danger,
    letterSpacing: 0.5,
  },
  itemDetails: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 4,
    gap: 4,
  },
  itemHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 8,
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  itemTextContent: {
    gap: 0,
  },
  itemName: {
    fontSize: 20,
    fontFamily: typography.displayBold,
    color: colors.textPrimary,
  },
  itemSubtext: {
    fontSize: 12,
    fontFamily: typography.bodySemibold,
    opacity: 0.9,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginLeft: 12,
    marginRight: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: typography.bodyBold,
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
