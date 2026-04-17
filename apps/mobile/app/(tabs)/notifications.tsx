import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { GradientText } from '@/src/components/GradientText';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { buildActivityTimeline, groupActivityTimeline, ActivityLog } from '@/src/lib/expiry';
import { useInventoryStore } from '@/src/store/useInventoryStore';
import { RemoteImage } from '@/src/components/RemoteImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NotificationsTabScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const fetchItems = useInventoryStore((state) => state.fetchItems);

  const timeline = useMemo(() => buildActivityTimeline(items), [items]);
  const groupedTimeline = useMemo(() => groupActivityTimeline(timeline), [timeline]);

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

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'intake': return { name: 'camera', color: colors.primary, label: '入库了' };
      case 'eaten': return { name: 'restaurant', color: colors.success, label: '吃掉了' };
      case 'discarded': return { name: 'trash', color: colors.danger, label: '清理了' };
      default: return { name: 'notifications', color: colors.textMuted, label: '记录' };
    }
  };

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
            <Text style={styles.kicker}>ACTIVITY TIMELINE</Text>
            <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.title}>
              冰箱时间轴
            </GradientText>
            <View style={styles.syncRow}>
              <View style={styles.syncDot} />
              <Text style={styles.subtitle}>记录每一份新鲜的流转</Text>
            </View>
          </View>
          
          <View style={styles.activeBadge}>
             <Ionicons name="infinite" size={24} color={colors.primaryDeep} />
             <Text style={styles.activeLabel}>全时追踪</Text>
          </View>
        </View>

        <View style={styles.timelineContainer}>
          {groupedTimeline.length === 0 ? (
            <View style={styles.emptyView}>
               <BlurView intensity={10} tint="light" style={styles.emptyBlur}>
                  <Ionicons name="trail-sign-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.emptyText}>还没有任何活跃印记</Text>
               </BlurView>
            </View>
          ) : (
            groupedTimeline.map((group) => (
              <View key={group.key} style={styles.group}>
                <View style={styles.groupHeader}>
                   <Text style={styles.groupTitle}>{group.title}</Text>
                </View>

                {group.activities.map((activity, index) => {
                  const action = getActionIcon(activity.type);
                  const isLast = index === group.activities.length - 1;
                  
                  return (
                    <View key={activity.id} style={styles.timelineItem}>
                      {/* Timeline Stem */}
                      <View style={styles.stemContainer}>
                         <View style={[styles.dot, { backgroundColor: `${action.color}20`, borderColor: action.color }]}>
                            <Ionicons name={action.name as any} size={12} color={action.color} />
                         </View>
                         {!isLast && <View style={styles.line} />}
                      </View>

                      <Pressable 
                        onPress={() => router.push({ pathname: '/item/[id]', params: { id: activity.itemId } })}
                        style={styles.activityCard}
                      >
                         <View style={styles.photoContainer}>
                            <RemoteImage uri={activity.photoUri} style={styles.miniPhoto} />
                         </View>
                         
                         <View style={styles.activityContent}>
                            <View style={styles.activityHeader}>
                               <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
                               <Text style={styles.activityTime}>
                                 {new Date(activity.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                               </Text>
                            </View>
                            <Text style={styles.activityTitle} numberOfLines={1}>
                               {activity.title}
                            </Text>
                         </View>
                         
                         <Ionicons name="chevron-forward" size={12} color={colors.textMuted} opacity={0.5} />
                      </Pressable>
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

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  headerText: { gap: 2 },
  kicker: { color: colors.primary, fontSize: 10, fontFamily: typography.bodyBold, letterSpacing: 2.5 },
  title: { color: colors.textPrimary, fontSize: 34, fontFamily: typography.displayBold, letterSpacing: -0.5 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  syncDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#34D399' },
  subtitle: { color: colors.textSecondary, fontSize: 12, fontFamily: typography.bodyMedium, opacity: 0.8 },
  activeBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...shadows.soft, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  activeLabel: { fontSize: 8, fontFamily: typography.bodyBold, color: colors.textMuted, marginTop: 2 },
  
  timelineContainer: { marginTop: 8 },
  group: { marginBottom: 32 },
  groupHeader: { marginBottom: 16, paddingLeft: 40 },
  groupTitle: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textMuted, opacity: 0.8 },
  
  timelineItem: { flexDirection: 'row', minHeight: 80 },
  stemContainer: { width: 40, alignItems: 'center' },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  line: { position: 'absolute', top: 26, bottom: -4, width: 1.5, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 },
  
  activityCard: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.4)', 
    borderRadius: 20, 
    padding: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.card,
    gap: 12
  },
  photoContainer: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)' },
  miniPhoto: { width: '100%', height: '100%' },
  activityContent: { flex: 1, gap: 2 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionLabel: { fontSize: 10, fontFamily: typography.bodyHeavy, letterSpacing: 0.5 },
  activityTime: { fontSize: 10, fontFamily: typography.bodyMedium, color: colors.textMuted },
  activityTitle: { fontSize: 15, fontFamily: typography.bodyBold, color: colors.textPrimary },
  
  emptyView: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', marginTop: 20 },
  emptyBlur: { padding: 40, alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  emptyText: { fontSize: 14, fontFamily: typography.bodyMedium, color: colors.textMuted },
});
