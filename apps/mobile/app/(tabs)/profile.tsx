import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/colors';
import { useInventoryStore } from '@/src/store/useInventoryStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import * as Updates from 'expo-updates';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StatusBar } from 'expo-status-bar';

export default function ProfileTabScreen() {
  const insets = useSafeAreaInsets();
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const currentHousehold = useInventoryStore((state) => state.currentHousehold);
  const householdMembers = useInventoryStore((state) => state.householdMembers);
  const items = useInventoryStore((state) => state.items);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const createHousehold = useInventoryStore((state) => state.createHousehold);

  const activeItems = items.filter((item) => item.status === 'active');
  const [createName, setCreateName] = useState('');
  const [familyMessage, setFamilyMessage] = useState('');
  const [familyError, setFamilyError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  async function handleCreateHousehold() {
    if (createName.trim().length === 0) {
      setFamilyError('请先填写家庭名称');
      return;
    }
    setFamilyError('');
    try {
      await createHousehold(createName);
      setFamilyMessage(`已创建家庭：${createName.trim()}`);
      setCreateName('');
    } catch {
      setFamilyError('创建家庭失败，请稍后再试');
    }
  }

  async function handleCheckUpdates() {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
      Alert.alert('提示', '您当前正在使用 Expo Go。同步最新代码的方法是：\n\n1. 杀掉 App 进程并重启\n2. 在 Expo Go 首页下拉刷新项目列表\n3. 重新进入项目即可', [{ text: '知道了' }]);
      return;
    }
    if (!Updates.isEnabled) {
      Alert.alert('提示', '当前环境不支持热更新。');
      return;
    }
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('发现新版本', '已经准备好新代码包，是否立即安装并重启应用？', [
          { text: '稍后', style: 'cancel' },
          {
            text: '立即安装',
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              } catch (e) {
                Alert.alert('安装失败', '无法下载更新。');
              }
            }
          },
        ]);
      } else {
        Alert.alert('提示', '当前已是最新同步版本！');
      }
    } catch (error) {
      Alert.alert('检查失败', '无法连接服务器');
    }
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
          <View style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlowLight}>
                <View style={styles.avatarLight}>
                  <Text style={styles.avatarTextLight}>周</Text>
                </View>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileNameLight}>极地用户</Text>
              <Text style={styles.profileMetaLight}>全铝极效冷链 · 环境健康运行中</Text>
            </View>
          </View>

          <View style={styles.impactGrid}>
            <BlurView intensity={80} tint="light" style={styles.impactCardGlass}>
              <Text style={styles.impactValueLight}>{activeItems.length}</Text>
              <Text style={styles.impactLabelLight}>当前库存</Text>
            </BlurView>
            <View style={styles.impactDividerLight} />
            <BlurView intensity={80} tint="light" style={styles.impactCardGlass}>
              <Text style={styles.impactValueLight}>{householdMembers.length}</Text>
              <Text style={styles.impactLabelLight}>家庭成员</Text>
            </BlurView>
            <View style={styles.impactDividerLight} />
            <BlurView intensity={80} tint="light" style={styles.impactCardGlass}>
              <Text style={styles.impactValueLight}>98%</Text>
              <Text style={styles.impactLabelLight}>保鲜率</Text>
            </BlurView>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitleLight}>家庭空间</Text>
            <BlurView intensity={80} tint="light" style={styles.settingsGroupGlass}>
              <View style={styles.menuRowGlass}>
                <View style={styles.menuLeft}>
                  <Ionicons name="home-outline" size={20} color="#3b82f6" />
                  <Text style={styles.menuLabelLight}>当前家庭</Text>
                </View>
                <Text style={styles.menuValueLight}>{currentHousehold?.name ?? '加载中...'}</Text>
              </View>
              <View style={[styles.menuRowGlass, { borderBottomWidth: 0 }]}>
                <View style={styles.menuLeft}>
                  <Ionicons name="key-outline" size={20} color="#f59e0b" />
                  <Text style={styles.menuLabelLight}>邀请码</Text>
                </View>
                <Text style={styles.menuValueSelectableLight}>{currentHousehold?.inviteCode ?? '暂无'}</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitleLight}>运行状态</Text>
            <BlurView intensity={80} tint="light" style={styles.settingsGroupGlass}>
              <View style={styles.menuRowGlass}>
                <View style={styles.menuLeft}>
                  <Ionicons name="hardware-chip-outline" size={20} color="#94a3b8" />
                  <Text style={styles.menuLabelLight}>底层版本</Text>
                </View>
                <Text style={styles.menuValueLight}>v0.2.0 Arctic</Text>
              </View>
              <Pressable onPress={() => void handleCheckUpdates()} style={[styles.menuRowGlass, { borderBottomWidth: 0 }]}>
                <View style={styles.menuLeft}>
                  <Ionicons name="cloud-download-outline" size={20} color="#3b82f6" />
                  <Text style={styles.menuLabelLight}>同步最新代码</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(30,41,59,0.3)" />
              </Pressable>
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitleLight}>管理中心</Text>
            <BlurView intensity={80} tint="light" style={styles.actionCardGlass}>
              <TextInput value={createName} onChangeText={setCreateName} placeholder="创建新空间 (如：合租公寓)" placeholderTextColor="rgba(30,41,59,0.4)" style={styles.inputLight} />
              <Pressable onPress={() => void handleCreateHousehold()} disabled={isMutating} style={[styles.primaryButtonLight, isMutating && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonTextLight}>快速同步空间</Text>
              </Pressable>
            </BlurView>
          </View>

          <Pressable
            onPress={() => {
              Alert.alert('退出登录', '确定要重启并退出身份验证吗？', [
                { text: '取消', style: 'cancel' },
                {
                  text: '确认退出',
                  style: 'destructive',
                  onPress: () => {
                    useAuthStore.getState().logout();
                    router.replace('/(auth)/login');
                  }
                },
              ]);
            }}
            style={styles.logoutButtonLight}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutTextLight}>安全退出极地空间</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 150 },
  mainContent: { paddingHorizontal: 20, marginTop: -30, gap: 20 },
  heroTransparent: { padding: 24, paddingTop: 40, paddingBottom: 40, gap: 32 },
  profileHeader: { alignItems: 'center', gap: 16 },
  avatarContainer: { justifyContent: 'center', alignItems: 'center' },
  avatarGlowLight: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(30,41,59,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(30,41,59,0.1)' },
  avatarLight: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  avatarTextLight: { fontSize: 32, fontWeight: '800', color: '#fff' },
  profileInfo: { alignItems: 'center', gap: 4 },
  profileNameLight: { fontSize: 26, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
  profileMetaLight: { fontSize: 13, color: 'rgba(30,41,59,0.5)', fontWeight: '600' },
  impactGrid: { flexDirection: 'row', marginTop: 32, alignItems: 'center' },
  impactCardGlass: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)' },
  impactValueLight: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  impactLabelLight: { fontSize: 10, color: 'rgba(30,41,59,0.4)', fontWeight: '700', textTransform: 'uppercase', marginTop: 2, letterSpacing: 1 },
  impactDividerLight: { width: 1, height: 20, backgroundColor: 'rgba(30,41,59,0.1)', marginHorizontal: 8 },
  section: { gap: 12 },
  sectionTitleLight: { fontSize: 13, color: 'rgba(30,41,59,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 12 },
  settingsGroupGlass: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)' },
  menuRowGlass: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(30,41,59,0.05)' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabelLight: { fontSize: 15, color: '#1e293b', fontWeight: '700' },
  menuValueLight: { fontSize: 14, color: 'rgba(30,41,59,0.5)', fontWeight: '600' },
  menuValueSelectableLight: { fontSize: 14, color: '#3b82f6', fontWeight: '800', letterSpacing: 1 },
  actionCardGlass: { borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)', gap: 16 },
  inputLight: { backgroundColor: 'rgba(30,41,59,0.05)', borderRadius: 18, padding: 16, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: 'rgba(30,41,59,0.1)' },
  primaryButtonLight: { backgroundColor: '#1e293b', borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  primaryButtonTextLight: { color: '#fff', fontWeight: '800', fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
  logoutButtonLight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, marginBottom: 40, paddingVertical: 20, borderRadius: 32, backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)' },
  logoutTextLight: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
});
