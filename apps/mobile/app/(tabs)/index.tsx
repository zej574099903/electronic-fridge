import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
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
  const prioritizedItems = [...activeItems].sort((left, right) => getExpirePriority(left) - getExpirePriority(right)).slice(0, 3);
  const recentItems = [...items]
    .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
    .slice(0, 3);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} />}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>今天优先吃</Text>
          <Text style={styles.description}>把最容易忘记的食物放到首页，先处理临期和剩菜。</Text>
          <Text style={styles.syncText}>{syncText}</Text>
          <View style={styles.quickActions}>
            <Pressable onPress={() => router.push('/leftover')} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>记录剩菜</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/inventory')} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>查看库存</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <SectionCard>
            <Text style={styles.errorText}>{error}</Text>
            <Link href="/(tabs)/inventory" style={styles.sectionLink}>
              去库存页处理
            </Link>
          </SectionCard>
        ) : null}

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今日任务</Text>
            <Link href="/(tabs)/notifications" style={styles.sectionLink}>
              查看全部提醒
            </Link>
          </View>
          {isLoading && !initialized ? (
            <Text style={styles.taskDescription}>正在生成今日任务...</Text>
          ) : todayTasks.length === 0 ? (
            <Text style={styles.taskDescription}>今天没有新的优先处理任务，保持得不错。</Text>
          ) : (
            todayTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { itemId: task.itemId } })}
                style={styles.taskRow}
              >
                <View style={[styles.taskBadge, styles[task.tone]]} />
                <View style={styles.taskTextGroup}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                </View>
              </Pressable>
            ))
          )}
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>库存概览</Text>
            <Link href="/(tabs)/inventory" style={styles.sectionLink}>
              去库存页
            </Link>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.totalCount}</Text>
              <Text style={styles.statLabel}>当前物品</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.urgentCount}</Text>
              <Text style={styles.statLabel}>今日临期</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.leftoverCount}</Text>
              <Text style={styles.statLabel}>剩菜待处理</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>建议优先处理</Text>
          {isLoading ? (
            <Text style={styles.itemMeta}>正在加载库存数据...</Text>
          ) : prioritizedItems.length === 0 ? (
            <Text style={styles.itemMeta}>当前没有待处理库存，去库存页新增或恢复物品吧。</Text>
          ) : (
            prioritizedItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.note ?? '未设置备注'}</Text>
                </View>
                <Text style={styles.expireText}>{item.expireAt ?? '未设置'}</Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>最近新增</Text>
          {isLoading ? (
            <Text style={styles.itemMeta}>正在加载库存数据...</Text>
          ) : recentItems.length === 0 ? (
            <Text style={styles.itemMeta}>还没有新增物品，去库存页或剩菜快捷入口试试。</Text>
          ) : (
            recentItems.map((item) => (
              <Pressable key={item.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.note ?? item.category}</Text>
                </View>
                <Text style={styles.expireText}>{item.expireAt ?? '未设置'}</Text>
              </Pressable>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 12,
    gap: 24,
  },
  hero: {
    paddingVertical: 12,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    opacity: 0.9,
  },
  syncText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  primaryAction: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '700',
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 16,
  },
  taskBadge: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  success: {
    backgroundColor: colors.success,
  },
  taskTextGroup: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textSecondary,
  },
  expireText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
  },
});
