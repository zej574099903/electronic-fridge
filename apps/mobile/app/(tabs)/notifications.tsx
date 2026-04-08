import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/constants/colors';
import { buildInventoryNotices } from '@/src/lib/expiry';
import { useInventoryStore } from '@/src/store/useInventoryStore';

type NoticeFilter = 'all' | 'unread' | 'read';

const noticeFilterOptions: Array<{ label: string; value: NoticeFilter }> = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '已读', value: 'read' },
];

export default function NotificationsTabScreen() {
  const [selectedFilter, setSelectedFilter] = useState<NoticeFilter>('all');
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isLoading = useInventoryStore((state) => state.isLoading);
  const noticeReadState = useInventoryStore((state) => state.noticeReadState);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const fetchNoticeReadState = useInventoryStore((state) => state.fetchNoticeReadState);
  const markNoticeAsRead = useInventoryStore((state) => state.markNoticeAsRead);
  const markAllNoticesAsRead = useInventoryStore((state) => state.markAllNoticesAsRead);
  const notices = buildInventoryNotices(items).map((notice) => ({
    ...notice,
    isRead: Boolean(noticeReadState[notice.id]),
  }));
  const unreadCount = notices.filter((notice) => !notice.isRead).length;
  const filteredNotices = useMemo(() => {
    if (selectedFilter === 'unread') {
      return notices.filter((notice) => !notice.isRead);
    }

    if (selectedFilter === 'read') {
      return notices.filter((notice) => notice.isRead);
    }

    return notices;
  }, [notices, selectedFilter]);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
      return;
    }

    void fetchNoticeReadState();
  }, [fetchItems, fetchNoticeReadState, initialized]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>提醒</Text>
          <Text style={styles.description}>这里集中处理临期提醒、剩菜提醒和每日库存关注项。</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{notices.length}</Text>
              <Text style={styles.statLabel}>全部提醒</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{unreadCount}</Text>
              <Text style={styles.statLabel}>未读提醒</Text>
            </View>
          </View>
        </View>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今日提醒</Text>
            {unreadCount > 0 ? (
              <Pressable onPress={() => markAllNoticesAsRead(notices.filter((notice) => !notice.isRead).map((notice) => notice.id))}>
                <Text style={styles.markAllText}>全部标为已读</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {noticeFilterOptions.map((option) => {
              const active = option.value === selectedFilter;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedFilter(option.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {isLoading && !initialized ? (
            <Text style={styles.emptyText}>正在生成提醒...</Text>
          ) : notices.length === 0 ? (
            <Text style={styles.emptyText}>当前没有新的临期或剩菜提醒。</Text>
          ) : filteredNotices.length === 0 ? (
            <Text style={styles.emptyText}>当前筛选条件下没有匹配的提醒。</Text>
          ) : (
            filteredNotices.map((notice) => (
              <Pressable
                key={notice.id}
                onPress={() => {
                  markNoticeAsRead(notice.id);
                  router.push({ pathname: '/(tabs)/inventory', params: { itemId: notice.itemId } });
                }}
                style={[styles.noticeRow, notice.isRead && styles.noticeRowRead]}
              >
                <View style={[styles.noticeBadge, styles[notice.tone]]} />
                <View style={styles.noticeContent}>
                  <Text style={[styles.noticeType, styles[`${notice.tone}Text`]]}>{notice.type}</Text>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                </View>
                <Text style={styles.noticeTime}>{notice.time}</Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  markAllText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '700',
  },
  filterRow: {
    gap: 10,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noticeRowRead: {
    opacity: 0.5,
  },
  noticeBadge: {
    width: 6,
    height: 48,
    borderRadius: 3,
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
  noticeContent: {
    flex: 1,
    gap: 4,
  },
  noticeType: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  warningText: {
    color: colors.warning,
  },
  dangerText: {
    color: colors.danger,
  },
  successText: {
    color: colors.success,
  },
  noticeTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  noticeTime: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
