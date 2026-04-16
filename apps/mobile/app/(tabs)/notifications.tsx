import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { GradientText } from '@/src/components/GradientText';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { buildInventoryNotices, groupInventoryNotices } from '@/src/lib/expiry';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';
import { ItemStatus } from '@/src/types/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    if (selectedFilter === 'unread') return notices.filter((notice) => !notice.isRead);
    if (selectedFilter === 'read') return notices.filter((notice) => notice.isRead);
    return notices;
  }, [notices, selectedFilter]);

  const groupedNotices = useMemo(() => groupInventoryNotices(filteredNotices), [filteredNotices]);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    } else {
      void fetchNoticeReadState();
    }
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
    if (unreadNoticeIds.length > 0) markAllNoticesAsRead(unreadNoticeIds);
  }

  function handleProcessNotice(itemId: string, noticeId: string, status: ItemStatus) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    Alert.alert('处理提醒', `确认将「${item.name}」标记为已${status === 'eaten' ? '吃掉' : '丢弃'}吗？`, [
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
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>NOTIFICATIONS</Text>
            <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.title}>
              提醒中心
            </GradientText>
            <View style={styles.syncRow}>
              <View style={[styles.syncDot, { backgroundColor: unreadCount > 0 ? colors.danger : '#34D399' }]} />
              <Text style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} 条待处理` : '暂无新通知'}</Text>
            </View>
          </View>
          
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadVal}>{unreadCount}</Text>
            <Text style={styles.unreadLab}>未读</Text>
          </View>
        </View>

        {/* Global Action Block */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.glassCard}>
              <View style={styles.summaryTop}>
                 <GradientText colors={['#1F7A8C', '#48CAE4']} style={styles.summaryTitle}>
                   一键清理所有已读
                 </GradientText>
                 <Text style={styles.summaryDesc}>临期食材建议优先处理，避免过期浪费。</Text>
              </View>
              <Pressable 
                onPress={handleMarkAllRead} 
                disabled={unreadCount === 0} 
                style={[styles.markReadBtn, unreadCount === 0 && styles.btnDisabled]}
              >
                <Text style={styles.markReadBtnText}>全部标为已读</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Tab Filters */}
        <View style={styles.filterBar}>
          {noticeFilterOptions.map((opt) => {
            const active = selectedFilter === opt.value;
            return (
              <Pressable key={opt.value} onPress={() => setSelectedFilter(opt.value)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Notifications List */}
        <View style={styles.listContainer}>
          {groupedNotices.length === 0 ? (
            <View style={styles.emptyView}>
               <BlurView intensity={10} tint="light" style={styles.emptyBlur}>
                  <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.emptyText}>当前没有相关提醒</Text>
               </BlurView>
            </View>
          ) : (
            groupedNotices.map((group) => (
              <View key={group.key} style={styles.group}>
                <View style={styles.groupHeader}>
                   <View style={styles.groupIndicator} />
                   <Text style={styles.groupTitle}>{group.title}</Text>
                </View>

                {group.notices.map((notice) => {
                  const tone = notice.tone === 'danger' ? colors.danger : colors.warning;
                  return (
                    <View key={notice.id} style={styles.cardWrapper}>
                       <View style={styles.cardBorder}>
                          <Pressable 
                            onPress={() => {
                              markNoticeAsRead(notice.id);
                              router.push({ pathname: '/item/[id]', params: { id: notice.itemId } });
                            }}
                            style={[styles.noticeCard, notice.isRead && styles.cardRead]}
                          >
                            <View style={styles.noticeMain}>
                               <View style={[styles.noticeIcon, { backgroundColor: `${tone}15` }]}>
                                  <Ionicons name={notice.tone === 'danger' ? 'alert' : 'notifications'} size={18} color={tone} />
                               </View>
                               <View style={styles.noticeBody}>
                                  <Text style={[styles.noticeKicker, { color: tone }]}>{notice.type}</Text>
                                  <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                                  <Text style={styles.noticeTime}>{notice.time}</Text>
                               </View>
                               {!notice.isRead && <View style={styles.dot} />}
                            </View>

                            <View style={styles.actionRow}>
                               <NoticeAction 
                                 label="吃掉" 
                                 icon="restaurant-outline" 
                                 color={colors.success} 
                                 onPress={() => handleProcessNotice(notice.itemId, notice.id, 'eaten')} 
                               />
                               <View style={styles.vDiv} />
                               <NoticeAction 
                                 label="丢弃" 
                                 icon="trash-outline" 
                                 color={colors.danger} 
                                 onPress={() => handleProcessNotice(notice.itemId, notice.id, 'discarded')} 
                               />
                               <View style={styles.vDiv} />
                               <NoticeAction 
                                 label="去查看" 
                                 icon="chevron-forward" 
                                 color={colors.primary} 
                                 onPress={() => {
                                    markNoticeAsRead(notice.id);
                                    router.push({ pathname: '/item/[id]', params: { id: notice.itemId } });
                                 }} 
                               />
                            </View>
                          </Pressable>
                       </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function NoticeAction({ label, icon, color, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={styles.nAction}>
       <Ionicons name={icon} size={14} color={color} />
       <Text style={[styles.nActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  headerText: { gap: 2 },
  kicker: { color: colors.primary, fontSize: 10, fontFamily: typography.bodyBold, letterSpacing: 2.5 },
  title: { color: colors.textPrimary, fontSize: 34, fontFamily: typography.displayBold, letterSpacing: -0.5 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  syncDot: { width: 5, height: 5, borderRadius: 3 },
  subtitle: { color: colors.textSecondary, fontSize: 12, fontFamily: typography.bodyMedium, opacity: 0.8 },
  unreadBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  unreadVal: { fontSize: 24, fontFamily: typography.displayBold, color: colors.primaryDeep },
  unreadLab: { fontSize: 10, fontFamily: typography.bodyBold, color: colors.textMuted },
  cardWrapper: { ...shadows.card },
  cardBorder: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  glassCard: { padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.4)', gap: 20 },
  summaryTop: { gap: 4 },
  summaryTitle: { fontSize: 20, fontFamily: typography.displayBold, color: colors.textPrimary },
  summaryDesc: { fontSize: 13, fontFamily: typography.bodyMedium, color: colors.textSecondary, opacity: 0.8 },
  markReadBtn: { height: 48, borderRadius: 24, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  markReadBtnText: { color: '#FFF', fontSize: 14, fontFamily: typography.bodyBold },
  btnDisabled: { opacity: 0.5 },
  filterBar: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  chipActive: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontSize: 13, fontFamily: typography.bodyBold, color: colors.textSecondary },
  chipTextActive: { color: '#FFF' },
  listContainer: { gap: 24 },
  group: { gap: 12 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  groupIndicator: { width: 4, height: 14, borderRadius: 2, backgroundColor: colors.primary },
  groupTitle: { fontSize: 16, fontFamily: typography.displayBold, color: colors.textPrimary },
  noticeCard: { padding: 16, backgroundColor: 'rgba(255,255,255,0.4)', gap: 16 },
  cardRead: { opacity: 0.5 },
  noticeMain: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  noticeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noticeBody: { flex: 1, gap: 2 },
  noticeKicker: { fontSize: 9, fontFamily: typography.bodyBold, letterSpacing: 0.5 },
  noticeTitle: { fontSize: 16, fontFamily: typography.bodyBold, color: colors.textPrimary },
  noticeTime: { fontSize: 12, fontFamily: typography.bodyMedium, color: colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 4, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12 },
  nAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  nActionText: { fontSize: 12, fontFamily: typography.bodyBold },
  vDiv: { width: 1, height: 14, backgroundColor: 'rgba(0,0,0,0.05)' },
  emptyView: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  emptyBlur: { padding: 40, alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  emptyText: { fontSize: 14, fontFamily: typography.bodyMedium, color: colors.textMuted },
});
