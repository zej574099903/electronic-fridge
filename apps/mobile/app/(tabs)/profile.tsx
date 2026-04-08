import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/constants/colors';
import { profileMenus } from '@/src/mocks/dashboard';
import { useInventoryStore } from '@/src/store/useInventoryStore';

export default function ProfileTabScreen() {
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const currentHousehold = useInventoryStore((state) => state.currentHousehold);
  const householdMembers = useInventoryStore((state) => state.householdMembers);
  const items = useInventoryStore((state) => state.items);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const createHousehold = useInventoryStore((state) => state.createHousehold);
  const joinHousehold = useInventoryStore((state) => state.joinHousehold);
  const activeItems = items.filter((item) => item.status === 'active');
  const [createName, setCreateName] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [familyMessage, setFamilyMessage] = useState('');
  const [familyError, setFamilyError] = useState('');

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

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
      setJoinInviteCode('');
      setJoinNickname('');
    } catch {
      setFamilyError('创建家庭失败，请稍后再试');
    }
  }

  async function handleJoinHousehold() {
    if (joinInviteCode.trim().length === 0) {
      setFamilyError('请先填写邀请码');
      return;
    }

    setFamilyError('');

    try {
      await joinHousehold(joinInviteCode, joinNickname || undefined);
      setFamilyMessage(`已加入家庭：${joinInviteCode.trim().toUpperCase()}`);
      setJoinInviteCode('');
      setJoinNickname('');
    } catch {
      setFamilyError('加入家庭失败，请检查邀请码后重试');
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>周</Text>
          </View>
          <View style={styles.profileTextGroup}>
            <Text style={styles.title}>我的</Text>
            <Text style={styles.description}>电子冰箱 MVP 测试账号</Text>
            <Text style={styles.meta}>当前家庭：{currentHousehold?.name ?? '加载中...'}</Text>
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>家庭空间</Text>
          {familyMessage ? <Text style={styles.successText}>{familyMessage}</Text> : null}
          {familyError ? <Text style={styles.errorText}>{familyError}</Text> : null}
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>当前家庭</Text>
            <Text style={styles.menuMeta}>{currentHousehold?.name ?? '加载中...'}</Text>
          </View>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>家庭邀请码</Text>
            <Text style={styles.menuMeta}>{currentHousehold?.inviteCode ?? '暂无'}</Text>
          </View>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>家庭内库存</Text>
            <Text style={styles.menuMeta}>{activeItems.length} 项</Text>
          </View>
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>共享模式</Text>
            <Text style={styles.menuMeta}>默认家庭视角</Text>
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>家庭成员</Text>
          {householdMembers.length === 0 ? (
            <Text style={styles.meta}>当前还没有家庭成员信息。</Text>
          ) : (
            householdMembers.map((member) => (
              <View key={member.id} style={styles.menuRow}>
                <Text style={styles.menuText}>{member.nickname}</Text>
                <Text style={styles.menuMeta}>{member.role === 'owner' ? '创建者' : '成员'}</Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>创建家庭</Text>
          <TextInput
            value={createName}
            onChangeText={(value) => {
              setCreateName(value);
              if (familyError) {
                setFamilyError('');
              }
            }}
            placeholder="例如：爸妈家 / 合租厨房"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <Pressable
            onPress={() => void handleCreateHousehold()}
            disabled={isMutating}
            style={[styles.primaryButton, isMutating && styles.buttonDisabled]}
          >
            <Text style={styles.primaryButtonText}>{isMutating ? '处理中...' : '创建新家庭'}</Text>
          </Pressable>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>加入家庭</Text>
          <TextInput
            value={joinInviteCode}
            onChangeText={(value) => {
              setJoinInviteCode(value);
              if (familyError) {
                setFamilyError('');
              }
            }}
            placeholder="填写家庭邀请码"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            style={styles.input}
          />
          <TextInput
            value={joinNickname}
            onChangeText={(value) => setJoinNickname(value)}
            placeholder="加入后显示的昵称（可选）"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <Pressable
            onPress={() => void handleJoinHousehold()}
            disabled={isMutating}
            style={[styles.primaryButton, isMutating && styles.buttonDisabled]}
          >
            <Text style={styles.primaryButtonText}>{isMutating ? '处理中...' : '通过邀请码加入'}</Text>
          </Pressable>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>常用入口</Text>
          {profileMenus.map((menu) => (
            <View key={menu} style={styles.menuRow}>
              <Text style={styles.menuText}>{menu}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          ))}
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.surface,
  },
  profileTextGroup: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  successText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '700',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  menuMeta: {
    fontSize: 15,
    color: colors.secondary,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  arrow: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
