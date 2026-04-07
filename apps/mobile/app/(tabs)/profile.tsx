import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/constants/colors';
import { profileMenus } from '@/src/mocks/dashboard';

export default function ProfileTabScreen() {
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
            <Text style={styles.meta}>默认家庭：我的小厨房</Text>
          </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
});
