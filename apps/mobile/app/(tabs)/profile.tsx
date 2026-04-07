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
    padding: 24,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.surface,
  },
  profileTextGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  successText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  menuText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuMeta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
});
