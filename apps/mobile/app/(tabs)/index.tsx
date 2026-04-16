import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { getDaysUntilExpiration, getExpirePriority } from '@/src/lib/expiry';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';
import { FridgeItem } from '@/src/types/item';

export default function HomeTabScreen() {
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const urgentItems = useMemo(() => currentItems.filter((item) => getExpirePriority(item) <= 1), [currentItems]);
  const safeItems = useMemo(() => currentItems.filter((item) => getExpirePriority(item) > 3), [currentItems]);
  const focusItems = currentItems.slice(0, 3);
  const syncText = formatLastSyncedAt(lastSyncedAt);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await fetchItems();
    } finally {
      setIsRefreshing(false);
    }
  }

  const headline =
    currentItems.length === 0
      ? '开始记录'
      : urgentItems.length > 0
        ? '先处理'
        : '状态稳定';

  const description =
    currentItems.length === 0
      ? '从一件开始。'
      : urgentItems.length > 0
        ? `${urgentItems.length} 件临近到期`
        : `${currentItems.length} 件在库`;

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
          <View style={styles.headerText}>
            <Text style={styles.kicker}>总览</Text>
            <Text style={styles.title}>冰箱</Text>
            <Text style={styles.subtitle}>{syncText}</Text>
          </View>
          <Pressable onPress={() => void handleRefresh()} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={18} color={colors.primaryDeep} />
          </Pressable>
        </View>

        <View style={styles.summaryBlock}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryText}>
              <Text style={styles.summaryEyebrow}>状态</Text>
              <Text style={styles.summaryHeadline}>{headline}</Text>
              <Text style={styles.summaryDescription}>{description}</Text>
            </View>
            <View style={styles.summaryBadge}>
              <View style={styles.summaryBadgeIconShell}>
                <Ionicons name="apps-outline" size={15} color={colors.primaryDeep} />
              </View>
              <Text style={styles.summaryBadgeValue}>{currentItems.length}</Text>
              <Text style={styles.summaryBadgeLabel}>总数</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <OverviewMetric label="临期" value={urgentItems.length} icon="alert-circle-outline" tint={colors.danger} backgroundColor="#FFF2F0" />
            <OverviewMetric label="安全" value={safeItems.length} icon="shield-checkmark-outline" tint={colors.success} backgroundColor="#EFFAF6" />
            <OverviewMetric label="在库" value={currentItems.length} icon="cube-outline" tint={colors.info} backgroundColor="#EEF6FC" />
          </View>
        </View>

        <View style={styles.focusSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>优先序列</Text>
            <Text style={styles.sectionMeta}>按到期排序</Text>
          </View>

          {focusItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconShell}>
                <Ionicons name="camera-outline" size={28} color={colors.primaryDeep} />
              </View>
              <Text style={styles.emptyTitle}>还没有记录</Text>
              <Text style={styles.emptyDescription}>拍一张照片，库存会从这里出现。</Text>
            </View>
          ) : (
            <View style={styles.focusList}>
              {focusItems.map((item) => {
                const tone = getFocusTone(item);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                    style={styles.focusCard}
                  >
                    {item.photoUri ? (
                      <Image source={{ uri: item.photoUri }} style={styles.focusImage} />
                    ) : (
                      <View style={styles.focusFallback}>
                        <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                      </View>
                    )}

                    <View style={styles.focusBody}>
                      <View style={styles.focusTopRow}>
                        <View />
                        <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
                      </View>

                      <View style={styles.focusInfoBlock}>
                        <Text style={[styles.focusPrimary, { color: tone.text }]} numberOfLines={1}>
                          {formatRemainingText(item)}
                        </Text>
                        <Text style={styles.focusSecondary} numberOfLines={1}>
                          {item.expiresOn ? `到期日 ${item.expiresOn.slice(0, 10)}` : '未设置日期'}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function OverviewMetric({
  label,
  value,
  icon,
  tint,
  backgroundColor,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  backgroundColor: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconShell, { backgroundColor }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={[styles.metricValue, { color: tint }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function getFocusTone(item: FridgeItem) {
  const days = getDaysUntilExpiration(item);

  if (days === null) {
    return {
      text: colors.textSecondary,
    };
  }

  if (days <= 1) {
    return {
      text: colors.danger,
    };
  }

  if (days <= 3) {
    return {
      text: colors.warning,
    };
  }

  return {
    text: colors.info,
  };
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
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(111,214,255,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.bodyBold,
    letterSpacing: 1.4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontFamily: typography.displayHeavy,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.bodyMedium,
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
  summaryBlock: {
    gap: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  summaryText: {
    flex: 1,
    gap: 6,
  },
  summaryEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.bodyBold,
    letterSpacing: 1.2,
  },
  summaryHeadline: {
    color: colors.textPrimary,
    fontSize: 44,
    lineHeight: 50,
    fontFamily: typography.displayHeavy,
    maxWidth: 220,
  },
  summaryDescription: {
    color: colors.textSecondary,
    lineHeight: 20,
    maxWidth: 220,
    fontFamily: typography.bodyMedium,
  },
  summaryBadge: {
    minWidth: 86,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
    backgroundColor: '#F3F9FD',
    borderWidth: 1,
    borderColor: '#D6E7F2',
    gap: 4,
  },
  summaryBadgeIconShell: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#E6F2F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeValue: {
    color: colors.primaryDeep,
    fontSize: 28,
    fontFamily: typography.displayBold,
  },
  summaryBadgeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodyBold,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
    ...shadows.soft,
  },
  metricIconShell: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
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
  focusSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.bodyBold,
    letterSpacing: 0.4,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodySemibold,
  },
  emptyCard: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.soft,
  },
  emptyIconShell: {
    width: 62,
    height: 62,
    borderRadius: 999,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 21,
    maxWidth: 260,
    fontFamily: typography.bodyMedium,
  },
  focusList: {
    gap: spacing.sm,
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  focusImage: {
    width: 118,
    height: 118,
    borderRadius: radii.md,
  },
  focusFallback: {
    width: 118,
    height: 118,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  focusBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingRight: 2,
  },
  focusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  focusInfoBlock: {
    gap: 6,
    justifyContent: 'center',
  },
  focusPrimary: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: typography.displayBold,
  },
  focusSecondary: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: typography.bodySemibold,
  },
});
