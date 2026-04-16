import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { GradientText } from '@/src/components/GradientText';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { RemoteImage } from '@/src/components/RemoteImage';
import { getDaysUntilExpiration, getExpirePriority } from '@/src/lib/expiry';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';
import { FridgeItem } from '@/src/types/item';
import { SkeletonCard } from '@/src/components/SkeletonCard';
import { useRef } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeTabScreen() {
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 刷新按钮动画控制器
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRefreshing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRefreshing, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
  
  // 优化显示逻辑：如果存在临期物品，则展示全部临期物品（最多展示6个，防止列表过长）；否则展示最新入库的3个
  const focusItems = useMemo(() => {
    if (urgentItems.length > 0) {
      return urgentItems.slice(0, 6);
    }
    return currentItems.slice(0, 3);
  }, [urgentItems, currentItems]);
  
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

  const headline = currentItems.length === 0 ? '添加新物品' : urgentItems.length > 0 ? '过期预警报告' : '状态正常';
  const description = currentItems.length === 0 ? '你的冰箱目前没有任何记录，请点击下方拍摄入库' : urgentItems.length > 0 ? `有 ${urgentItems.length} 件物品即将过期，建议优先处理` : `目前所有库存均在保质期内，共有 ${currentItems.length} 件记录`;

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      
      {/* Refined Background Gradient */}
      <LinearGradient
        colors={['#E6F0F5', '#F3F7FB', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topGlow} />

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
            <Text style={styles.kicker}>EXPIRY MANAGER</Text>
            <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.brandTitle}>
              电子冰箱
            </GradientText>
            <View style={styles.syncRow}>
              <View style={styles.syncDot} />
              <Text style={styles.subtitle}>{syncText}</Text>
            </View>
          </View>
          <Pressable onPress={() => void handleRefresh()} style={styles.refreshButton}>
            <BlurView intensity={20} tint="light" style={styles.refreshBlur}>
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              </Animated.View>
            </BlurView>
          </Pressable>
        </View>

        {/* Improved Glassmorphism Summary Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <BlurView intensity={40} tint="light" style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>核心摘要</Text>
                  <GradientText colors={['#1F7A8C', '#48CAE4']} style={styles.summaryHeadline}>
                    {headline}
                  </GradientText>
                  <Text style={styles.summaryDesc}>{description}</Text>
                </View>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalValue}>{currentItems.length}</Text>
                  <Text style={styles.totalLabel}>总数</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <OverviewMetric label="临期" value={urgentItems.length} icon="alert-circle" tint={colors.danger} />
                <View style={styles.metricDivider} />
                <OverviewMetric label="安全" value={safeItems.length} icon="shield-checkmark" tint={colors.success} />
                <View style={styles.metricDivider} />
                <OverviewMetric label="在库" value={currentItems.length} icon="cube" tint={colors.info} />
              </View>
            </BlurView>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <View style={styles.sectionSlug} />
            <Text style={styles.sectionTitle}>临期处理清单</Text>
          </View>
          <Text style={styles.sectionLabel}>LIST VIEW</Text>
        </View>

        {/* 数据加载状态展示 */}
        {!initialized || (isRefreshing && currentItems.length === 0) ? (
          <View style={styles.itemGrid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : focusItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <BlurView intensity={10} tint="light" style={styles.emptyBlur}>
              <View style={styles.emptyCircle}>
                <Ionicons name="scan-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>通过扫描包装快速入库</Text>
            </BlurView>
          </View>
        ) : (
          <View style={styles.itemGrid}>
            {focusItems.map((item, index) => {
              const tone = getFocusTone(item);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  style={styles.itemCard}
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
                        <Ionicons name="file-tray-full-outline" size={30} color={colors.textMuted} />
                      </View>
                    )}
                    {getExpirePriority(item) <= 1 && (
                      <BlurView intensity={60} tint="light" style={styles.urgentTag}>
                        <Text style={styles.urgentText}>紧急</Text>
                      </BlurView>
                    )}
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemLabel}>优先项目 #{index + 1}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                    </View>
                    <View style={styles.itemTextContent}>
                      <Text style={[styles.itemTitle, { color: tone.text }]} numberOfLines={1}>
                        {formatRemainingText(item)}
                      </Text>
                      <Text style={styles.itemSubtext}>过期日期: {item.expiresOn?.slice(0, 10) || '未设置'}</Text>
                    </View>
                  </View>
                </Pressable>
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
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View>
        <Text style={styles.metricVal}>{value}</Text>
        <Text style={styles.metricLab}>{label}</Text>
      </View>
    </View>
  );
}

function getFocusTone(item: FridgeItem) {
  const days = getDaysUntilExpiration(item);
  if (days === null) return { text: colors.textSecondary };
  if (days <= 1) return { text: colors.danger };
  if (days <= 3) return { text: colors.warning };
  return { text: colors.primaryDeep };
}

function formatRemainingText(item: FridgeItem) {
  const days = getDaysUntilExpiration(item);
  if (days === null) return '未设置截止日期';
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return '今日到期';
  if (days === 1) return '明日到期';
  return `${days} 天后过期`;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 28,
  },
  topGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(31, 122, 140, 0.08)',
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
  brandTitle: {
    color: '#0F4C5C',
    fontSize: 32,
    fontFamily: typography.displayBold,
    letterSpacing: 0.5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontFamily: typography.displayHeavy,
    letterSpacing: -1.2,
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
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  summaryInfo: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: typography.bodyBold,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  summaryHeadline: {
    fontSize: 30,
    fontFamily: typography.displayBold,
    color: '#1F7A8C',
    letterSpacing: 0,
    lineHeight: 38,
  },
  summaryDesc: {
    fontSize: 13,
    fontFamily: typography.bodyMedium,
    color: colors.textSecondary,
    opacity: 0.8,
    marginTop: 2,
  },
  totalBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 122, 140, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(31, 122, 140, 0.1)',
  },
  totalValue: {
    fontSize: 32,
    fontFamily: typography.displayBold,
    color: colors.primaryDeep,
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: typography.bodyBold,
    color: colors.primary,
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 16,
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
    fontSize: 20,
    fontFamily: typography.displayBold,
    color: colors.textPrimary,
  },
  metricLab: {
    fontSize: 12,
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
  itemGrid: {
    gap: 16,
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
  itemImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 18,
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
    top: 6,
    right: 6,
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
  itemHeader: {
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
    gap: 2,
  },
  itemTitle: {
    fontSize: 22,
    fontFamily: typography.displayBold,
  },
  itemSubtext: {
    fontSize: 12,
    fontFamily: typography.bodySemibold,
    color: colors.textMuted,
    opacity: 0.7,
  },
});
