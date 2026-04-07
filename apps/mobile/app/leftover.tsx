import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/constants/colors';
import { CreateFridgeItemInput, useInventoryStore } from '@/src/store/useInventoryStore';

export default function LeftoverEntryScreen() {
  const addItem = useInventoryStore((state) => state.addItem);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const [draft, setDraft] = useState<CreateFridgeItemInput>({
    name: '',
    category: 'leftover',
    storageSpace: 'chilled',
    expiresOn: '',
    quantity: undefined,
    quantityUnit: '',
    note: '',
  });
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => draft.name.trim().length > 0, [draft.name]);

  function updateDraft<K extends keyof CreateFridgeItemInput>(key: K, value: CreateFridgeItemInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    if (!canSubmit) {
      setError('请先填写剩菜名称');
      return;
    }

    setError('');
    try {
      await addItem({
        ...draft,
        category: 'leftover',
        expiresOn: draft.expiresOn || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      });
      router.replace('/(tabs)/inventory');
    } catch {
      setError('保存失败，请稍后再试');
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>返回</Text>
          </Pressable>
          <Text style={styles.title}>记录剩菜</Text>
          <Text style={styles.description}>默认按剩菜记录，并建议明天前优先处理。</Text>
        </View>

        <SectionCard>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TextInput
            value={draft.name}
            onChangeText={(value) => updateDraft('name', value)}
            placeholder="例如：昨晚排骨 / 剩米饭"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <View style={styles.quickRow}>
            <Pressable onPress={() => updateDraft('expiresOn', new Date(Date.now() + 86400000).toISOString().slice(0, 10))} style={styles.quickButton}>
              <Text style={styles.quickButtonText}>明天提醒我</Text>
            </Pressable>
            <Pressable onPress={() => updateDraft('expiresOn', new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10))} style={styles.quickButton}>
              <Text style={styles.quickButtonText}>后天提醒我</Text>
            </Pressable>
          </View>
          <TextInput
            value={draft.expiresOn ?? ''}
            onChangeText={(value) => updateDraft('expiresOn', value)}
            placeholder="到期日期，如 2026-04-09"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={draft.note ?? ''}
            onChangeText={(value) => updateDraft('note', value)}
            placeholder="备注，如 晚饭剩的"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <Pressable onPress={() => void handleSubmit()} disabled={!canSubmit || isMutating} style={[styles.submitButton, (!canSubmit || isMutating) && styles.submitButtonDisabled]}>
            <Text style={styles.submitButtonText}>{isMutating ? '保存中...' : '保存剩菜记录'}</Text>
          </Pressable>
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
  header: {
    gap: 8,
  },
  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
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
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
