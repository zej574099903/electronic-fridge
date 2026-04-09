import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<NoticeFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    if (selectedFilter === 'unread') return notices.filter((notice) => !notice.isRead);
    if (selectedFilter === 'read') return notices.filter((notice) => notice.isRead);
    return notices;
  }, [notices, selectedFilter]);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
      return;
    }
    void fetchNoticeReadState();
  }, [fetchItems, fetchNoticeReadState, initialized]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try { await fetchItems(); } finally { setIsRefreshing(false); }
  }

  return (
    <ScreenContainer edges={['left', 'right']} style={{ backgroundColor: 'transparent' }}>
      <StatusBar style="dark" translucent />
      <View style={StyleSheet.absoluteFill}>
        <Image source={require('../../assets/branding/arctic_bg_v3_light.png')} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={10} />
        <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: 'transparent' }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor="#1e293b" />}
      >
        <View style={styles.heroTransparent}>
          <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
            <View>
              <Text style={styles.titleLight}>智能提醒</Text>
              <Text style={styles.heroSubTextLight}>临期预警 · 剩菜管理 · 健康关怀</Text>
            </View>
            <Ionicons name="notifications" size={28} color="#1e293b" style={{ opacity: 0.8 }} />
          </View>

          <View style={styles.statsRow}>
            <BlurView intensity={80} tint="light" style={styles.statCardGlass}>
              <Text style={styles.statValueLight}>{notices.length}</Text>
              <Text style={styles.statLabelLight}>总提醒</Text>
            </BlurView>
            <BlurView intensity={80} tint="light" style={styles.statCardGlass}>
              <Text style={styles.statValueLight}>{unreadCount}</Text>
              <Text style={styles.statLabelLight}>未处理</Text>
            </BlurView>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleLight}>分类通知</Text>
            {unreadCount > 0 && (
              <Pressable onPress={() => markAllNoticesAsRead(notices.filter((n) => !n.isRead).map((n) => n.id))}>
                <Text style={styles.markAllTextLight}>全部已读</Text>
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {noticeFilterOptions.map((option) => {
              const active = option.value === selectedFilter;
              return (
                <Pressable key={option.value} onPress={() => setSelectedFilter(option.value)} style={[styles.filterChipGlass, active && styles.filterChipActiveGlass]}>
                  <Text style={[styles.filterChipTextGlass, active && styles.filterChipTextActiveGlass]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.noticeList}>
            {isLoading && !initialized ? (
              <View style={styles.emptyContainer}><Ionicons name="sync" size={48} color="rgba(30,41,59,0.2)" /><Text style={styles.emptyTextLight}>正在生成智能提醒...</Text></View>
            ) : notices.length === 0 ? (
              <View style={styles.emptyContainer}><Ionicons name="notifications-off" size={48} color="rgba(30,41,59,0.2)" /><Text style={styles.emptyTextLight}>太棒了！目前没有任何临期风险。</Text></View>
            ) : filteredNotices.length === 0 ? (
              <View style={styles.emptyContainer}><Ionicons name="filter" size={48} color="rgba(30,41,59,0.2)" /><Text style={styles.emptyTextLight}>当前筛选下没有此类提醒。</Text></View>
            ) : (
              filteredNotices.map((notice) => (
                <BlurView key={notice.id} intensity={80} tint="light" style={[styles.noticeItemGlass, notice.isRead && { opacity: 0.6 }]}>
                  <Pressable
                    onPress={() => { markNoticeAsRead(notice.id); router.push({ pathname: '/(tabs)/inventory', params: { itemId: notice.itemId } }); }}
                    style={styles.noticeItemMainGlass}
                  >
                    <View style={[styles.noticeToneIconGlass, { backgroundColor: notice.tone === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)' }]}>
                      <Ionicons name={notice.tone === 'danger' ? 'alert-circle' : 'information-circle'} size={20} color={notice.tone === 'danger' ? '#ef4444' : '#3b82f6'} />
                    </View>
                    <View style={styles.noticeBody}>
                      <Text style={[styles.noticeTypeText, { color: notice.tone === 'danger' ? '#ef4444' : '#3b82f6' }]}>{notice.type}</Text>
                      <Text style={styles.noticeTitleTextLight}>{notice.title}</Text>
                      <Text style={styles.noticeTimeTextLight}>{notice.time}</Text>
                    </View>
                    {!notice.isRead && <View style={styles.unreadDotLight} />}
                  </Pressable>
                </BlurView>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 150 },
  mainContent: { flex: 1, paddingHorizontal: 20, marginTop: 0 },
  heroTransparent: { padding: 24, paddingTop: 40, paddingBottom: 24, gap: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleLight: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5, textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  heroSubTextLight: { fontSize: 13, color: 'rgba(30,41,59,0.5)', fontWeight: '700', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statCardGlass: { flex: 1, padding: 16, borderRadius: 24, gap: 4, overflow: 'hidden', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)' },
  statValueLight: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  statLabelLight: { fontSize: 11, color: 'rgba(30,41,59,0.4)', fontWeight: '700', textTransform: 'uppercase' },
  sectionTitleLight: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10, paddingHorizontal: 4 },
  markAllTextLight: { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
  filterRow: { gap: 10, marginBottom: 20, paddingHorizontal: 4 },
  filterChipGlass: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(30,41,59,0.03)', borderWidth: 1, borderColor: 'rgba(30,41,59,0.1)' },
  filterChipActiveGlass: { backgroundColor: 'rgba(30,41,59,0.1)', borderColor: 'rgba(30,41,59,0.2)' },
  filterChipTextGlass: { fontSize: 13, color: 'rgba(30,41,59,0.5)', fontWeight: '700' },
  filterChipTextActiveGlass: { color: '#1e293b' },
  noticeList: { gap: 12, paddingBottom: 40 },
  noticeItemGlass: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)' },
  noticeItemMainGlass: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  noticeToneIconGlass: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  noticeTitleTextLight: { fontSize: 16, color: '#1e293b', fontWeight: '700' },
  noticeTimeTextLight: { fontSize: 12, color: 'rgba(30,41,59,0.4)', fontWeight: '600' },
  noticeBody: { flex: 1, gap: 2 },
  noticeTypeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  unreadDotLight: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyTextLight: { fontSize: 15, color: 'rgba(30,41,59,0.4)', fontWeight: '600', textAlign: 'center' },
});
