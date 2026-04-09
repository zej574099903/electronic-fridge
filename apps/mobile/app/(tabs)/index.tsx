import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/colors';
import { buildInventoryTasks, getExpirePriority } from '@/src/lib/expiry';
import { formatLastSyncedAt, getInventorySummary, useInventoryStore } from '@/src/store/useInventoryStore';

export default function HomeTabScreen() {
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isLoading = useInventoryStore((state) => state.isLoading);
  const error = useInventoryStore((state) => state.error);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const fetchItems = useInventoryStore((state) => state.fetchItems);

  const activeItems = items.filter((item) => item.status === 'active');
  const summary = getInventorySummary(items);
  const todayTasks = buildInventoryTasks(items);
  const prioritizedItems = [...activeItems].sort((left, right) => getExpirePriority(left) - getExpirePriority(right)).slice(0, 6);
  const recentItems = [...items]
    .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
    .slice(0, 5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const syncText = formatLastSyncedAt(lastSyncedAt);

  // Health Calculation
  const healthPercent = activeItems.length === 0 ? 100 : Math.max(0, Math.round(((activeItems.length - summary.urgentCount) / activeItems.length) * 100));
  const healthLevel = healthPercent > 80 ? '极佳' : healthPercent > 50 ? '优良' : '注意';
  const healthColor = healthPercent > 80 ? colors.success : healthPercent > 50 ? colors.secondary : colors.danger;

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

  return (
    <ScreenContainer edges={['left', 'right']} style={{ backgroundColor: 'transparent' }}>
      <StatusBar style="dark" translucent />

      {/* Arctic Realm Background Texture v3 (Pure Ice Light) */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={require('../../assets/branding/arctic_bg_v3_light.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={10}
        />

        {/* Soft Light Overlay for Text Readability */}
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: 'transparent' }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor="#fff" />}
      >
        {/* Arctic Fresh Dashboard Header */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)']}
          style={styles.dashboardHero}
        >
          <View style={[styles.headerTop, { paddingTop: insets.top + 8 }]}>
            <View>
              <Text style={styles.greeting}>极智保鲜</Text>
              <Text style={styles.syncTextSmall}>已同步 {syncText}</Text>
            </View>
            <View style={styles.headerRight}>
              <Ionicons name="snow-outline" size={24} color="rgba(255,255,255,0.8)" />
            </View>
          </View>

          <View style={styles.healthHero}>
            <View style={styles.gaugeGlow}>
              <View style={[styles.healthGaugev2, { borderColor: 'rgba(255,255,255,0.3)', borderTopColor: healthColor, borderRightColor: healthColor }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'transparent']}
                  style={styles.gaugeGlassOverlay}
                />
                <Text style={styles.healthValueBigLight}>{healthPercent}%</Text>
                <Text style={styles.healthUnitv2Light}>新鲜状态</Text>
              </View>
              <View style={[styles.gaugeInnerRim, { borderColor: 'rgba(255,255,255,0.2)' }]} />
            </View>
            <View style={styles.healthTextCenter}>
              <Text style={styles.healthStatusLabelLight}>冰箱环境：{healthLevel}</Text>
              <Text style={styles.healthSubLabelLight}>{activeItems.length} 件库存正在智能管理中</Text>
            </View>
          </View>

          <View style={styles.quickStatRow}>
            <BlurView intensity={80} tint="light" style={styles.miniStatCard}>
              <Ionicons name="alert-circle" size={18} color={colors.warning} />
              <Text style={styles.miniStatValue}>{summary.urgentCount}</Text>
              <Text style={styles.miniStatTitle}>今日临期</Text>
            </BlurView>
            <BlurView intensity={80} tint="light" style={styles.miniStatCard}>
              <Ionicons name="restaurant" size={18} color={colors.secondary} />
              <Text style={styles.miniStatValue}>{summary.leftoverCount}</Text>
              <Text style={styles.miniStatTitle}>剩菜提醒</Text>
            </BlurView>
            <BlurView intensity={80} tint="light" style={styles.miniStatCard}>
              <Ionicons name="cube" size={18} color="#fff" />
              <Text style={styles.miniStatValue}>{activeItems.length}</Text>
              <Text style={styles.miniStatTitle}>总共物品</Text>
            </BlurView>
          </View>
        </LinearGradient>

        {/* Fridge Overview Analysis */}
        <BlurView intensity={80} tint="light" style={styles.glassSection}>
          <Text style={styles.sectionTitleGlass}>冰箱概览</Text>
          <View style={styles.overviewGridGlass}>
            <View style={styles.overviewCardGlass}>
              <Text style={styles.overviewValueGlass}>{activeItems.length - summary.urgentCount}</Text>
              <Text style={styles.overviewLabelGlass}>状态良好</Text>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            </View>
            <View style={styles.overviewCardGlass}>
              <Text style={styles.overviewValueGlass}>{summary.urgentCount}</Text>
              <Text style={styles.overviewLabelGlass}>需要关注</Text>
              <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            </View>
            <View style={[styles.overviewCardGlass, { borderRightWidth: 0 }]}>
              <Text style={styles.overviewValueGlass}>{items.filter(i => i.status === 'expired').length}</Text>
              <Text style={styles.overviewLabelGlass}>产生浪费</Text>
              <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
            </View>
          </View>
          <View style={styles.insightPlateGlass}>
            <Ionicons name="bulb-outline" size={18} color={colors.secondary} />
            <Text style={styles.insightTextGlass}>
              {summary.urgentCount > 0
                ? `本周有 ${summary.urgentCount} 件食材即将过期，建议优先处理。`
                : "目前冰箱环境健康，继续保持良好的采买习惯！"}
            </Text>
          </View>
        </BlurView>

        {/* Eat Now Priority Action List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleGlass}>优先食用清单</Text>
            <Link href="/(tabs)/inventory" style={styles.seeAllLinkGlass}>查看全部库存 ›</Link>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.priorityList}
          >
            {prioritizedItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={styles.priorityCard}
              >
                <BlurView intensity={80} tint="light" style={styles.priorityCardGlass}>
                  <LinearGradient
                    colors={getExpirePriority(item) < 2 ? ['rgba(239,68,68,0.2)', 'rgba(185,28,28,0.1)'] : ['rgba(59,130,246,0.2)', 'rgba(29,78,216,0.1)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons
                    name={getExpirePriority(item) < 2 ? "time" : "fast-food"}
                    size={28}
                    color="#fff"
                    style={styles.priorityIcon}
                  />
                  <Text style={styles.priorityName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.priorityMeta}>{item.expireAt ? `${item.expireAt} 过期` : '未设置日期'}</Text>
                </BlurView>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push('/(tabs)/inventory')}
              style={styles.addPriorityCardGlass}
            >
              <Ionicons name="add-circle-outline" size={32} color="rgba(255,255,255,0.6)" />
              <Text style={styles.addPriorityTextGlass}>新增库存</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
  lightRay: {
    position: 'absolute',
    opacity: 0.5,
  },
  dashboardHero: {
    padding: 24,
    borderBottomLeftRadius: 56,
    borderBottomRightRadius: 56,
    gap: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  syncTextSmall: {
    fontSize: 13,
    color: 'rgba(30,41,59,0.5)',
    fontWeight: '500',
    marginTop: 4,
  },
  healthValueBigLight: {
    fontSize: 48,
    fontWeight: '300',
    color: '#1e293b',
  },
  healthUnitv2Light: {
    fontSize: 12,
    color: 'rgba(30,41,59,0.4)',
    fontWeight: '600',
  },
  healthStatusLabelLight: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '600',
  },
  healthSubLabelLight: {
    fontSize: 14,
    color: 'rgba(30,41,59,0.5)',
  },
  headerRight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthHero: {
    alignItems: 'center',
    gap: 20,
    marginTop: 10,
  },
  gaugeGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  healthGaugev2: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  gaugeGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  gaugeInnerRim: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
  },
  gaugeShimmer: {
    position: 'absolute',
    top: 20,
    left: 40,
    width: 30,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    transform: [{ rotate: '-15deg' }],
  },
  healthValueBig: {
    fontSize: 52,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -2,
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  healthUnitv2: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  healthTextCenter: {
    alignItems: 'center',
    gap: 4,
  },
  healthStatusLabel: {
    fontSize: 20,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 0.5,
  },
  healthSubLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  quickStatRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
  },
  miniStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    gap: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatValue: {
    fontSize: 28,
    fontWeight: '300',
    color: '#fff',
    marginTop: 2,
  },
  miniStatTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  glassSection: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 40,
    padding: 24,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  sectionTitleGlass: {
    fontSize: 22,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -0.5,
  },
  seeAllLinkGlass: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  overviewGridGlass: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  overviewCardGlass: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  overviewValueGlass: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  overviewLabelGlass: {
    fontSize: 12,
    color: 'rgba(30,41,59,0.4)',
    fontWeight: '700',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  insightPlateGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  insightTextGlass: {
    fontSize: 14,
    color: 'rgba(30,41,59,0.5)',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  priorityList: {
    paddingRight: 20,
    gap: 16,
  },
  priorityCard: {
    width: 220,
    height: 140,
    borderRadius: 32,
    overflow: 'hidden',
  },
  priorityCardGlass: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    gap: 4,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderRightColor: 'rgba(0,0,0,0.1)',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  priorityIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    opacity: 0.2,
  },
  priorityName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  priorityMeta: {
    fontSize: 13,
    color: 'rgba(30,41,59,0.5)',
    fontWeight: '600',
  },
  addPriorityCardGlass: {
    width: 140,
    height: 140,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 8,
  },
  addPriorityTextGlass: {
    fontSize: 14,
    color: 'rgba(30,41,59,0.4)',
    fontWeight: '700',
  },
});
