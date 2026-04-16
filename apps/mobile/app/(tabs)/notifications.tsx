import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { buildInventoryNotices, groupInventoryNotices } from '@/src/lib/expiry';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';
import { ItemStatus } from '@/src/types/item';

type NoticeFilter = 'all' | 'unread' | 'read';

const noticeFilterOptions: Array<{ label: string; value: NoticeFilter }> = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '已读', value: 'read' },
];

export default function NotificationsTabScreen() {
  const [selectedFilter, setSelectedFilter] = useState<NoticeFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const noticeReadState = useInventoryStore((state) => state.noticeReadState);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const fetchNoticeReadState = useInventoryStore((state) => state.fetchNoticeReadState);
  const markNoticeAsRead = useInventoryStore((state) => state.markNoticeAsRead);
  const markAllNoticesAsRead = useInventoryStore((state) => state.markAllNoticesAsRead);
  const updateItemStatus = useInventoryStore((state) => state.updateItemStatus);

  const notices = buildInventoryNotices(items).map((notice) => ({
    ...notice,
    isRead: Boolean(noticeReadState[notice.id]),
  }));
  const unreadCount = notices.filter((notice) => !notice.isRead).length;
  const syncText = formatLastSyncedAt(lastSyncedAt);

  const filteredNotices = useMemo(() => {
    if (selectedFilter === 'unread') {
      return notices.filter((notice) => !notice.isRead);
    }
    if (selectedFilter === 'read') {
      return notices.filter((notice) => notice.isRead);
    }
    return notices;
  }, [notices, selectedFilter]);
  const groupedNotices = useMemo(() => groupInventoryNotices(filteredNotices), [filteredNotices]);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
      return;
    }

    void fetchNoticeReadState();
  }, [fetchItems, fetchNoticeReadState, initialized]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await fetchItems();
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleMarkAllRead() {
    const unreadNoticeIds = notices.filter((notice) => !notice.isRead).map((notice) => notice.id);
    if (unreadNoticeIds.length === 0) {
      return;
    }
    markAllNoticesAsRead(unreadNoticeIds);
  }

  function handleProcessNotice(itemId: string, noticeId: string, status: ItemStatus) {
    const item = items.find((currentItem) => currentItem.id === itemId);
    if (!item) {
      return;
    }

    const actionLabel = status === 'eaten' ? '吃掉' : '丢弃';
    Alert.alert('处理提醒', `确认把「${item.name}」标记为已${actionLabel}吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          try {
            await updateItemStatus(itemId, status);
            markNoticeAsRead(noticeId);
          } catch {
            Alert.alert('处理失败', '请稍后再试');
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
            <Text style={styles.kicker}>提醒</Text>
            <Text style={styles.title}>处理队列</Text>
            <Text style={styles.subtitle}>{unreadCount === 0 ? '当前没有待处理提醒' : `${unreadCount} 条提醒等待处理`}</Text>
            <Text style={styles.syncText}>{syncText}</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterValue}>{unreadCount}</Text>
            <Text style={styles.counterLabel}>未读</Text>
          </View>
        </View>

        <View style={styles.summaryBlock}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryEyebrow}>批量操作</Text>
            <Text style={styles.summaryTitle}>先把临期项处理掉</Text>
            <Text style={styles.summaryDescription}>提醒只做一件事：把快过期的库存尽快变成行动。</Text>
          </View>
          <Pressable disabled={unreadCount === 0} onPress={handleMarkAllRead} style={[styles.summaryButton, unreadCount === 0 && styles.summaryButtonDisabled]}>
            <Text style={[styles.summaryButtonText, unreadCount === 0 && styles.summaryButtonTextDisabled]}>全部已读</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {noticeFilterOptions.map((option) => {
            const active = option.value === selectedFilter;
            return (
              <Pressable key={option.value} onPress={() => setSelectedFilter(option.value)} style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionEyebrow}>待处理提醒</Text>
              <Text style={styles.sectionTitle}>按时间分组</Text>
            </View>
            <Text style={styles.sectionMeta}>{filteredNotices.length} 条</Text>
          </View>

          {groupedNotices.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconShell}>
                <Ionicons name="notifications-off-outline" size={24} color={colors.primaryDeep} />
              </View>
              <Text style={styles.emptyTitle}>没有符合条件的提醒</Text>
              <Text style={styles.emptyDescription}>当前库存状态比较稳定，先继续保持就好。</Text>
            </View>
          ) : (
            groupedNotices.map((group) => (
              <View key={group.key} style={styles.groupBlock}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <Text style={styles.groupCount}>{group.notices.length} 条</Text>
                </View>
                <View style={styles.groupList}>
                  {group.notices.map((notice) => {
                    const toneColor = notice.tone === 'danger' ? colors.danger : notice.tone === 'warning' ? colors.warning : colors.success;
                    return (
                      <View key={notice.id} style={[styles.noticeCard, notice.isRead && styles.noticeCardRead]}>
                        <Pressable
                          onPress={() => {
                            markNoticeAsRead(notice.id);
                            router.push({ pathname: '/(tabs)/inventory', params: { itemId: notice.itemId } });
                          }}
                          style={styles.noticeMain}
                        >
                          <View style={[styles.noticeIcon, { backgroundColor: `${toneColor}18` }]}>
                            <Ionicons name={notice.tone === 'danger' ? 'warning-outline' : 'notifications-outline'} size={18} color={toneColor} />
                          </View>
                          <View style={styles.noticeBody}>
                            <Text style={[styles.noticeType, { color: toneColor }]}>{notice.type}</Text>
                            <Text style={styles.noticeTitle}>{notice.title}</Text>
                            <Text style={styles.noticeTime}>{notice.time}</Text>
                          </View>
                          {!notice.isRead ? <View style={styles.unreadDot} /> : null}
                        </Pressable>
                        <View style={styles.noticeActions}>
                          <MiniAction
                            label="吃掉"
                            icon="restaurant-outline"
                            color={colors.success}
                            disabled={isMutating}
                            onPress={() => handleProcessNotice(notice.itemId, notice.id, 'eaten')}
                          />
                          <MiniAction
                            label="丢弃"
                            icon="trash-outline"
                            color={colors.danger}
                            disabled={isMutating}
                            onPress={() => handleProcessNotice(notice.itemId, notice.id, 'discarded')}
                          />
                          <MiniAction
                            label="查看"
                            icon="arrow-forward-outline"
                            color={colors.primary}
                            disabled={false}
                            onPress={() => {
                              markNoticeAsRead(notice.id);
                              router.push({ pathname: '/item/[id]', params: { id: notice.itemId } });
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MiniAction({
  label,
  icon,
  color,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.actionChip, disabled && styles.actionChipDisabled]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.actionChipText}>{label}</Text>
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
    top: -110,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(111,214,255,0.11)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 34,
    color: colors.textPrimary,
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
  counterBadge: {
    minWidth: 82,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.soft,
  },
  counterValue: {
    fontSize: 28,
    color: colors.primaryDeep,
    fontFamily: typography.displayBold,
  },
  counterLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: typography.bodyBold,
  },
  summaryBlock: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  summaryText: {
    gap: 4,
  },
  summaryEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: typography.bodyBold,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: typography.displayBold,
  },
  summaryDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: typography.bodyMedium,
  },
  summaryButton: {
    alignSelf: 'flex-start',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryButtonText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  summaryButtonTextDisabled: {
    color: colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
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
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  filterChipTextActive: {
    color: colors.textOnDark,
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
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodyBold,
    paddingTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
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
  groupBlock: {
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: typography.displayBold,
  },
  groupCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodyBold,
  },
  groupList: {
    gap: spacing.sm,
  },
  noticeCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  noticeCardRead: {
    opacity: 0.64,
  },
  noticeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noticeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBody: {
    flex: 1,
    gap: 3,
  },
  noticeType: {
    fontSize: 11,
    letterSpacing: 0.5,
    fontFamily: typography.bodyBold,
  },
  noticeTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: typography.bodyBold,
  },
  noticeTime: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodyMedium,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  noticeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionChipDisabled: {
    opacity: 0.5,
  },
  actionChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
});
