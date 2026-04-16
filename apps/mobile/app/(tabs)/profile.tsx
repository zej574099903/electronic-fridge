import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Updates from 'expo-updates';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { colors, radii, shadows, spacing } from '@/src/constants/colors';
import { typography } from '@/src/constants/typography';
import { useAuthStore } from '@/src/store/useAuthStore';
import { formatLastSyncedAt, useInventoryStore } from '@/src/store/useInventoryStore';

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
    setFamilyMessage('');

    try {
      await createHousehold(createName.trim());
      setFamilyMessage(`已创建 ${createName.trim()}`);
      setCreateName('');
    } catch {
      setFamilyError('创建失败，请稍后再试');
    }
  }

  async function handleCheckUpdates() {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
      Alert.alert('Expo Go 提示', '当前运行在 Expo Go 中，重新扫码进入项目即可拿到最新代码。');
      return;
    }
    if (!Updates.isEnabled) {
      Alert.alert('提示', '当前环境不支持热更新。');
      return;
    }
    try {
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        Alert.alert('提示', '当前已经是最新版本。');
        return;
      }
      Alert.alert('发现更新', '检测到新的代码包，是否现在安装并重启？', [
        { text: '稍后', style: 'cancel' },
        {
          text: '立即安装',
          onPress: async () => {
            try {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            } catch {
              Alert.alert('安装失败', '暂时无法下载更新。');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('检查失败', '暂时无法连接更新服务。');
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
        <View style={styles.topGlow} />

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userLabel.slice(0, 1)}</Text>
          </View>
          <View style={styles.headerBody}>
            <Text style={styles.kicker}>我的</Text>
            <Text style={styles.title}>{userLabel}</Text>
            <Text style={styles.subtitle}>家庭、同步与运行信息</Text>
            <Text style={styles.syncText}>{syncText}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <ProfileMetric value={activeItems.length} label="库存" />
          <ProfileMetric value={householdMembers.length} label="成员" />
          <ProfileMetric value={currentHousehold?.inviteCode ?? '--'} label="邀请码" compact />
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionEyebrow}>家庭空间</Text>
            <Text style={styles.sectionTitle}>当前协作信息</Text>
          </View>
          <InfoRow icon="home-outline" label="当前家庭" value={currentHousehold?.name ?? '加载中...'} />
          <InfoRow icon="people-outline" label="成员人数" value={`${householdMembers.length} 人`} />
          <InfoRow icon="mail-open-outline" label="邀请码" value={currentHousehold?.inviteCode ?? '暂无'} noBorder />
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionEyebrow}>新建家庭</Text>
            <Text style={styles.sectionTitle}>建立新的共享空间</Text>
          </View>

          {familyMessage ? <FeedbackText tone="success" text={familyMessage} /> : null}
          {familyError ? <FeedbackText tone="error" text={familyError} /> : null}

          <TextInput
            value={createName}
            onChangeText={(value) => {
              setCreateName(value);
              setFamilyError('');
            }}
            placeholder="例如：合租厨房 / 父母家"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <Pressable onPress={() => void handleCreateHousehold()} disabled={isMutating} style={[styles.primaryButton, isMutating && styles.buttonDisabled]}>
            <Text style={styles.primaryButtonText}>{isMutating ? '创建中...' : '创建家庭空间'}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionEyebrow}>运行与同步</Text>
            <Text style={styles.sectionTitle}>当前环境</Text>
          </View>
          <Pressable onPress={() => void handleCheckUpdates()} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Ionicons name="cloud-download-outline" size={18} color={colors.primary} />
              <Text style={styles.actionText}>检查最新代码</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={[styles.actionRow, styles.actionRowStatic]}>
            <View style={styles.actionLeft}>
              <Ionicons name="hardware-chip-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.actionText}>当前版本</Text>
            </View>
            <Text style={styles.actionValue}>v0.2.0 Arctic</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert('退出登录', '确定要退出当前账号吗？', [
              { text: '取消', style: 'cancel' },
              {
                text: '退出',
                style: 'destructive',
                onPress: () => {
                  logout();
                  router.replace('/(auth)/login');
                },
              },
            ]);
          }}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>退出当前账号</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function ProfileMetric({ value, label, compact = false }: { value: string | number; label: string; compact?: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, compact && styles.metricValueCompact]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FeedbackText({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  return <Text style={[styles.feedbackText, tone === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>{text}</Text>;
}

function InfoRow({
  icon,
  label,
  value,
  noBorder = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.infoRow, noBorder && styles.infoRowNoBorder]}>
      <View style={styles.actionLeft}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
    top: -115,
    right: -78,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(111,214,255,0.11)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDeep,
    ...shadows.soft,
  },
  avatarText: {
    color: colors.textOnDark,
    fontSize: 28,
    fontFamily: typography.displayBold,
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
    color: colors.textPrimary,
    fontSize: 32,
    fontFamily: typography.displayHeavy,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.bodyMedium,
  },
  syncText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodySemibold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
    ...shadows.soft,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.displayBold,
  },
  metricValueCompact: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.bodyBold,
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
  sectionHeaderText: {
    gap: 4,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: typography.bodyBold,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: typography.displayBold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoRowNoBorder: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.bodyBold,
  },
  infoValue: {
    color: colors.textSecondary,
    fontSize: 14,
    maxWidth: 150,
    textAlign: 'right',
    fontFamily: typography.bodyMedium,
  },
  feedbackText: {
    fontSize: 13,
    fontFamily: typography.bodyBold,
  },
  feedbackSuccess: {
    color: colors.success,
  },
  feedbackError: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.bodyMedium,
  },
  primaryButton: {
    minHeight: 50,
    backgroundColor: colors.primaryDeep,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  primaryButtonText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  actionRowStatic: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.bodyBold,
  },
  actionValue: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.bodyMedium,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    borderRadius: radii.pill,
    backgroundColor: '#FFF4F2',
    borderWidth: 1,
    borderColor: '#F3D3CF',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: typography.bodyBold,
  },
});
