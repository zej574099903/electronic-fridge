import { useEffect } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/constants/colors';
import { buildInventoryNotices } from '@/src/lib/expiry';
import { useInventoryStore } from '@/src/store/useInventoryStore';

export default function NotificationsTabScreen() {
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isLoading = useInventoryStore((state) => state.isLoading);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const notices = buildInventoryNotices(items);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>提醒</Text>
          <Text style={styles.description}>这里集中处理临期提醒、剩菜提醒和每日库存关注项。</Text>
        </View>

        <SectionCard>
          <Text style={styles.sectionTitle}>今日提醒</Text>
          {isLoading && !initialized ? (
            <Text style={styles.emptyText}>正在生成提醒...</Text>
          ) : notices.length === 0 ? (
            <Text style={styles.emptyText}>当前没有新的临期或剩菜提醒。</Text>
          ) : (
            notices.map((notice) => (
              <Pressable
                key={notice.id}
                onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { itemId: notice.itemId } })}
                style={styles.noticeRow}
              >
                <View style={[styles.noticeBadge, styles[notice.tone]]} />
                <View style={styles.noticeContent}>
                  <Text style={[styles.noticeType, styles[`${notice.tone}Text`]]}>{notice.type}</Text>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                </View>
                <Text style={styles.noticeTime}>{notice.time}</Text>
              </Pressable>
            ))
          )}
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
  hero: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noticeBadge: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.warning,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  success: {
    backgroundColor: colors.success,
  },
  noticeContent: {
    flex: 1,
    gap: 4,
  },
  noticeType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  warningText: {
    color: colors.warning,
  },
  dangerText: {
    color: colors.danger,
  },
  successText: {
    color: colors.success,
  },
  noticeTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  noticeTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
