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
import { useAuthStore } from '@/src/store/useAuthStore';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileTabScreen() {
  const initialized = useInventoryStore((state) => state.initialized);
  const currentHousehold = useInventoryStore((state) => state.currentHousehold);
  const householdMembers = useInventoryStore((state) => state.householdMembers);
  const items = useInventoryStore((state) => state.items);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeItems = useMemo(() => items.filter((item) => item.status === 'active'), [items]);
  const userLabel = user?.nickname ?? user?.phone?.slice(-4)?.padStart(4, '*') ?? '冰箱用户';
  const syncText = formatLastSyncedAt(lastSyncedAt);

  useEffect(() => {
    if (!initialized) void fetchItems();
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
           <Text style={styles.kicker}>PERSONAL CENTER</Text>
           <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.title}>
             个人中心
           </GradientText>
           <View style={styles.syncRow}>
              <View style={styles.syncDot} />
              <Text style={styles.subtitle}>{syncText}</Text>
           </View>
        </View>

        {/* User Identity Section */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.userCard}>
               <View style={styles.userTop}>
                  <View style={styles.avatarBox}>
                     <Text style={styles.avatarTxt}>{userLabel.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.userNameGroup}>
                     <Text style={styles.userName}>{userLabel}</Text>
                     <Text style={styles.userMeta}>冰箱守护者</Text>
                  </View>
               </View>
               
               <BlurView intensity={20} tint="light" style={styles.statGrid}>
                  <View style={styles.statItem}>
                     <Text style={styles.statVal}>{activeItems.length}</Text>
                     <Text style={styles.statLab}>正式在库</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                     <Text style={styles.statVal}>{householdMembers.length}</Text>
                     <Text style={styles.statLab}>家庭成员</Text>
                  </View>
               </BlurView>
            </View>
          </View>
        </View>

        {/* Space Info Section */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
             <View style={styles.glassCard}>
                <View style={styles.sectionHeader}>
                   <Text style={styles.sectionTitle}>空间信息</Text>
                   <Ionicons name="location-outline" size={18} color={colors.primary} />
                </View>
                
                <View style={styles.infoList}>
                   <ProfileInfo icon="home-outline" label="家庭空间" value={currentHousehold?.name || '默认家庭'} />
                   <ProfileInfo icon="key-outline" label="邀请码" value={currentHousehold?.inviteCode || 'DEFAULT'} />
                </View>
             </View>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
             <View style={styles.glassCard}>
                <View style={styles.sectionHeader}>
                   <Text style={styles.sectionTitle}>关于系统</Text>
                   <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                </View>
                
                <View style={styles.infoList}>
                   <View style={styles.pInfo}>
                      <View style={styles.pInfoLeft}>
                         <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
                         <Text style={styles.pInfoLab}>数据安全</Text>
                      </View>
                      <Text style={styles.pInfoVal}>本地局域网加密</Text>
                   </View>
                   <View style={styles.pInfo}>
                      <View style={styles.pInfoLeft}>
                         <Ionicons name="server-outline" size={16} color={colors.textMuted} />
                         <Text style={styles.pInfoLab}>服务器状态</Text>
                      </View>
                      <Text style={[styles.pInfoVal, { color: colors.success }]}>运行正常</Text>
                   </View>
                </View>
             </View>
          </View>
        </View>

        {/* Logout Action */}
        <Pressable 
          onPress={() => {
            Alert.alert('退出登录', '确定要退出当前账号吗？', [
              { text: '取消', style: 'cancel' },
              { text: '退出', style: 'destructive', onPress: () => {
                logout();
                router.replace('/(auth)/login');
              }},
            ]);
          }}
          style={styles.logoutBtn}
        >
          <BlurView intensity={30} tint="light" style={styles.logoutBlur}>
             <Ionicons name="power-outline" size={18} color={colors.danger} />
             <Text style={styles.logoutTxt}>安全退出登录</Text>
          </BlurView>
        </Pressable>

        {/* Visual Footer */}
        <View style={styles.footer}>
           <Text style={styles.versionLabel}>ARCTIC FROST ENGINE</Text>
           <Text style={styles.versionVal}>v0.5.8 Build Final</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function ProfileInfo({ icon, label, value }: any) {
  return (
    <View style={styles.pInfo}>
       <View style={styles.pInfoLeft}>
          <Ionicons name={icon} size={16} color={colors.textMuted} />
          <Text style={styles.pInfoLab}>{label}</Text>
       </View>
       <Text style={styles.pInfoVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 24 },
  header: { marginTop: 8, gap: 2 },
  kicker: { color: colors.primary, fontSize: 10, fontFamily: typography.bodyBold, letterSpacing: 2.5 },
  title: { color: colors.textPrimary, fontSize: 34, fontFamily: typography.displayBold, letterSpacing: -0.5 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  syncDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#34D399' },
  subtitle: { color: colors.textSecondary, fontSize: 12, fontFamily: typography.bodyMedium, opacity: 0.8 },
  
  cardWrapper: { ...shadows.card },
  cardBorder: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  userCard: { padding: 24, backgroundColor: 'rgba(255, 255, 255, 0.4)', gap: 24 },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarBox: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  avatarTxt: { color: '#FFF', fontSize: 26, fontFamily: typography.displayBold },
  userNameGroup: { gap: 2 },
  userName: { fontSize: 24, fontFamily: typography.displayBold, color: colors.textPrimary },
  userMeta: { fontSize: 11, fontFamily: typography.bodyBold, color: colors.textMuted, opacity: 0.6 },
  
  statGrid: { flexDirection: 'row', padding: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 22, fontFamily: typography.displayBold, color: colors.textPrimary },
  statLab: { fontSize: 10, fontFamily: typography.bodyBold, color: colors.textMuted },
  statDivider: { width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'center' },
  
  glassCard: { padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.4)', gap: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontFamily: typography.displayBold, color: colors.textPrimary },
  infoList: { gap: 14 },
  pInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  pInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pInfoLab: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textSecondary },
  pInfoVal: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textPrimary },
  
  logoutBtn: { borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(218, 106, 94, 0.2)', marginTop: 8 },
  logoutBlur: { flexDirection: 'row', height: 50, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  logoutTxt: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.danger },
  
  footer: { alignItems: 'center', marginTop: 12, gap: 4, opacity: 0.3 },
  versionLabel: { fontSize: 9, fontFamily: typography.bodyBold, letterSpacing: 2, color: colors.textMuted },
  versionVal: { fontSize: 10, fontFamily: typography.bodyMedium, color: colors.textMuted },
});
