import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Updates from 'expo-updates';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { GradientText } from '@/src/components/GradientText';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { useAuthStore } from '@/src/store/useAuthStore';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileTabScreen() {
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const currentHousehold = useInventoryStore((state) => state.currentHousehold);
  const householdMembers = useInventoryStore((state) => state.householdMembers);
  const items = useInventoryStore((state) => state.items);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const createHousehold = useInventoryStore((state) => state.createHousehold);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [createName, setCreateName] = useState('');
  const [familyMessage, setFamilyMessage] = useState('');
  const [familyError, setFamilyError] = useState('');
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

  async function handleCreateHousehold() {
    if (createName.trim().length === 0) {
      setFamilyError('请先填写家庭名称');
      return;
    }
    setFamilyError('');
    setFamilyMessage('');
    try {
      await createHousehold(createName.trim());
      setFamilyMessage(`已创建「${createName.trim()}」`);
      setCreateName('');
    } catch {
      setFamilyError('创建失败，请稍后再试');
    }
  }

  async function handleCheckUpdates() {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
      Alert.alert('提示', '当前运行在 Expo Go 环境。');
      return;
    }
    try {
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        Alert.alert('提示', '当前已是最新版本。');
        return;
      }
      Alert.alert('发现更新', '是否现在安装并重启？', [
        { text: '取消', style: 'cancel' },
        { text: '立即安装', onPress: async () => {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }},
      ]);
    } catch {
      Alert.alert('报错', '无法连接更新服务。');
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
           <Text style={styles.kicker}>USER PROFILE</Text>
           <GradientText colors={['#0F4C5C', '#2A9D8F']} style={styles.title}>
             个人中心
           </GradientText>
           <View style={styles.syncRow}>
              <View style={styles.syncDot} />
              <Text style={styles.subtitle}>{syncText}</Text>
           </View>
        </View>

        {/* User ID Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.userCard}>
               <View style={styles.userTop}>
                  <View style={styles.avatarBox}>
                     <Text style={styles.avatarTxt}>{userLabel.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.userNameGroup}>
                     <Text style={styles.userName}>{userLabel}</Text>
                     <Text style={styles.userMeta}>ID: {user?.id?.slice(-8) || 'FREE_ACCOUNT'}</Text>
                  </View>
               </View>
               
               <BlurView intensity={20} tint="light" style={styles.userMetrics}>
                  <UserMetric label="冰箱在库" value={activeItems.length} />
                  <View style={styles.vDiv} />
                  <UserMetric label="协作成员" value={householdMembers.length} />
                  <View style={styles.vDiv} />
                  <UserMetric label="家庭空间" value={currentHousehold ? 1 : 0} />
               </BlurView>
            </View>
          </View>
        </View>

        {/* Family Management */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.glassCard}>
              <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>家庭协作</Text>
                 <Ionicons name="people-outline" size={18} color={colors.primary} />
              </View>
              
              <View style={styles.infoList}>
                 <ProfileInfo icon="home-outline" label="当前名称" value={currentHousehold?.name || '--'} />
                 <ProfileInfo icon="key-outline" label="共享通行码" value={currentHousehold?.inviteCode || '未生成'} />
              </View>

              <View style={styles.divider} />

              <View style={styles.createBlock}>
                 <Text style={styles.createTitle}>创建新家庭</Text>
                 {familyMessage ? <Text style={styles.successMsg}>{familyMessage}</Text> : null}
                 {familyError ? <Text style={styles.errorMsg}>{familyError}</Text> : null}
                 <View style={styles.inputRow}>
                    <TextInput
                       value={createName}
                       onChangeText={setCreateName}
                       placeholder="如：杭州老家 / 公司冰箱"
                       placeholderTextColor={colors.textMuted}
                       style={styles.input}
                    />
                    <Pressable onPress={handleCreateHousehold} disabled={isMutating} style={[styles.inputBtn, isMutating && styles.btnDisabled]}>
                       <Ionicons name="add" size={24} color="#FFF" />
                    </Pressable>
                 </View>
              </View>
            </View>
          </View>
        </View>

        {/* System & About */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.glassCard}>
               <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>系统状态</Text>
                  <Ionicons name="settings-outline" size={18} color={colors.primary} />
               </View>
               
               <View style={styles.infoList}>
                  <Pressable onPress={handleCheckUpdates} style={styles.pressItem}>
                     <View style={styles.itemLeft}>
                        <Ionicons name="cloud-download-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.itemText}>检查 OTA 更新</Text>
                     </View>
                     <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                  <View style={styles.pressItem}>
                     <View style={styles.itemLeft}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.itemText}>当前版本</Text>
                     </View>
                     <Text style={styles.versionTxt}>v0.5.2 Arctic Frost</Text>
                  </View>
               </View>
            </View>
          </View>
        </View>

        {/* Logout */}
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
          <BlurView intensity={20} tint="light" style={styles.logoutBlur}>
             <Ionicons name="log-out-outline" size={18} color={colors.danger} />
             <Text style={styles.logoutTxt}>安全退出账号</Text>
          </BlurView>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function UserMetric({ label, value }: any) {
  return (
    <View style={styles.uMetric}>
       <Text style={styles.uMetricVal}>{value}</Text>
       <Text style={styles.uMetricLab}>{label}</Text>
    </View>
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
  avatarBox: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  avatarTxt: { color: '#FFF', fontSize: 28, fontFamily: typography.displayBold },
  userNameGroup: { gap: 2 },
  userName: { fontSize: 24, fontFamily: typography.displayBold, color: colors.textPrimary },
  userMeta: { fontSize: 11, fontFamily: typography.bodyBold, color: colors.textMuted, opacity: 0.8 },
  userMetrics: { flexDirection: 'row', padding: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  uMetric: { flex: 1, alignItems: 'center', gap: 2 },
  uMetricVal: { fontSize: 20, fontFamily: typography.displayBold, color: colors.textPrimary },
  uMetricLab: { fontSize: 10, fontFamily: typography.bodyBold, color: colors.textMuted },
  vDiv: { width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.05)' },
  glassCard: { padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.4)', gap: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontFamily: typography.displayBold, color: colors.textPrimary },
  infoList: { gap: 12 },
  pInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  pInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pInfoLab: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textSecondary },
  pInfoVal: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 4 },
  createBlock: { gap: 12 },
  createTitle: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textMuted, paddingHorizontal: 4 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.6)', paddingHorizontal: 20, fontSize: 14, fontFamily: typography.bodyMedium, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  inputBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  btnDisabled: { opacity: 0.5 },
  successMsg: { fontSize: 12, color: colors.success, paddingHorizontal: 4, fontFamily: typography.bodyBold },
  errorMsg: { fontSize: 12, color: colors.danger, paddingHorizontal: 4, fontFamily: typography.bodyBold },
  pressItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.textPrimary },
  versionTxt: { fontSize: 12, fontFamily: typography.bodyMedium, color: colors.textMuted },
  logoutBtn: { borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(218, 106, 94, 0.3)', marginTop: 8 },
  logoutBlur: { flexDirection: 'row', height: 50, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(248, 113, 113, 0.05)' },
  logoutTxt: { fontSize: 14, fontFamily: typography.bodyBold, color: colors.danger },
});
