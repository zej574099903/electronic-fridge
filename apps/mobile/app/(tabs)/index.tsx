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
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 16,
  },
  hero: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  syncText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 14,
    color: colors.primary,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  taskRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
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
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  expireText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '600',
  },
});
