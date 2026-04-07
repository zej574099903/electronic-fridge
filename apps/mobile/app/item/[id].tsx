import { useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/constants/colors';
import { formatStorageSpaceLabel } from '@/src/lib/expiry';
import { CreateFridgeItemInput, useInventoryStore } from '@/src/store/useInventoryStore';
import { ItemCategory, ItemStatus, StorageSpace } from '@/src/types/item';

const statusLabelMap = {
  active: '库存中',
  eaten: '已吃掉',
  discarded: '已丢弃',
  expired: '已过期',
} as const;

const quickAddCategoryOptions: Array<{ label: string; value: ItemCategory }> = [
  { label: '食材', value: 'ingredient' },
  { label: '水果', value: 'fruit' },
  { label: '甜品', value: 'dessert' },
  { label: '零食', value: 'snack' },
  { label: '剩菜', value: 'leftover' },
  { label: '其他', value: 'other' },
];

const quickAddStorageOptions: Array<{ label: string; value: StorageSpace }> = [
  { label: '冷藏', value: 'chilled' },
  { label: '冷冻', value: 'frozen' },
  { label: '常温', value: 'room_temp' },
  { label: '其他', value: 'other' },
];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const updateItemStatus = useInventoryStore((state) => state.updateItemStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const clearError = useInventoryStore((state) => state.clearError);
  const item = useMemo(() => items.find((currentItem) => currentItem.id === id), [id, items]);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<CreateFridgeItemInput>({
    name: '',
    category: 'ingredient',
    storageSpace: 'chilled',
    expiresOn: '',
    quantity: undefined,
    quantityUnit: '',
    note: '',
  });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (!item) {
      return;
    }

    setEditDraft({
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace ?? 'chilled',
      expiresOn: item.expiresOn ? item.expiresOn.slice(0, 10) : '',
      quantity: item.quantity,
      quantityUnit: item.quantityUnit ?? '',
      note: item.note ?? '',
    });
  }, [item]);

  function updateEditDraft<K extends keyof CreateFridgeItemInput>(key: K, value: CreateFridgeItemInput[K]) {
    setEditDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetEditDraft() {
    if (!item) {
      return;
    }

    setEditDraft({
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace ?? 'chilled',
      expiresOn: item.expiresOn ? item.expiresOn.slice(0, 10) : '',
      quantity: item.quantity,
      quantityUnit: item.quantityUnit ?? '',
      note: item.note ?? '',
    });
  }

  function handleStatusUpdate(status: ItemStatus) {
    if (!item) {
      return;
    }

    const actionText = statusLabelMap[status];

    Alert.alert('更新库存状态', `确定将「${item.name}」标记为${actionText}吗？`, [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确认',
        onPress: async () => {
          clearError();
          setEditError('');

          try {
            await updateItemStatus(item.id, status);
            setFeedbackMessage(`已更新状态：${actionText}`);
          } catch {
            setEditError('更新状态失败，请稍后再试');
          }
        },
      },
    ]);
  }

  async function handleSaveEdit() {
    if (!item) {
      return;
    }

    if (editDraft.name.trim().length === 0) {
      setEditError('请先填写物品名称');
      return;
    }

    if (editDraft.quantity !== undefined && (!Number.isFinite(editDraft.quantity) || editDraft.quantity <= 0)) {
      setEditError('数量必须是大于 0 的数字');
      return;
    }

    clearError();
    setEditError('');

    try {
      await updateItem(item.id, {
        name: editDraft.name,
        category: editDraft.category,
        storageSpace: editDraft.storageSpace,
        expiresOn: editDraft.expiresOn,
        quantity: editDraft.quantity && editDraft.quantity > 0 ? editDraft.quantity : undefined,
        quantityUnit: editDraft.quantityUnit,
        note: editDraft.note,
      });
      setFeedbackMessage('详情已更新');
      setIsEditing(false);
    } catch {
      setEditError('保存失败，请稍后再试');
    }
  }

  function handleDeleteItem() {
    if (!item) {
      return;
    }

    Alert.alert('确认删除', `确定要删除「${item.name}」吗？`, [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          clearError();
          setEditError('');

          try {
            await removeItem(item.id);
            router.replace('/(tabs)/inventory');
          } catch {
            setEditError('删除失败，请稍后再试');
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>返回</Text>
          </Pressable>
          <Text style={styles.title}>物品详情</Text>
        </View>

        {!item ? (
          <SectionCard>
            <Text style={styles.emptyTitle}>未找到该物品</Text>
            <Text style={styles.emptyDescription}>可能已经被删除，或者库存数据尚未同步。</Text>
          </SectionCard>
        ) : (
          <>
            <SectionCard>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>{statusLabelMap[item.status]}</Text>
              {feedbackMessage ? <Text style={styles.successMessage}>{feedbackMessage}</Text> : null}
              {editError ? <Text style={styles.errorMessage}>{editError}</Text> : null}
            </SectionCard>

            <SectionCard>
              <Text style={styles.sectionTitle}>快捷处理</Text>
              <View style={styles.actionRowWrap}>
                {item.status === 'active' ? (
                  <>
                    <Pressable onPress={() => handleStatusUpdate('eaten')} style={styles.statusButton}>
                      <Text style={styles.statusButtonText}>标记吃掉</Text>
                    </Pressable>
                    <Pressable onPress={() => handleStatusUpdate('discarded')} style={styles.statusButton}>
                      <Text style={styles.statusButtonText}>标记丢弃</Text>
                    </Pressable>
                    <Pressable onPress={() => handleStatusUpdate('expired')} style={styles.statusButton}>
                      <Text style={styles.statusButtonText}>标记过期</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={() => handleStatusUpdate('active')} style={styles.statusButton}>
                    <Text style={styles.statusButtonText}>恢复到库存中</Text>
                  </Pressable>
                )}
                <Pressable onPress={handleDeleteItem} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>删除物品</Text>
                </Pressable>
              </View>
            </SectionCard>

            <SectionCard>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>基础信息</Text>
                <Pressable
                  onPress={() => {
                    if (isEditing) {
                      resetEditDraft();
                    }
                    setIsEditing((current) => !current);
                    setEditError('');
                    setFeedbackMessage('');
                  }}
                >
                  <Text style={styles.editLinkText}>{isEditing ? '收起编辑' : '编辑'}</Text>
                </Pressable>
              </View>
              {isEditing ? (
                <View style={styles.editPanel}>
                  <TextInput
                    value={editDraft.name}
                    onChangeText={(value) => {
                      updateEditDraft('name', value);
                      if (editError) {
                        setEditError('');
                      }
                    }}
                    placeholder="物品名称"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {quickAddCategoryOptions.map((option) => {
                      const active = option.value === editDraft.category;

                      return (
                        <Pressable
                          key={`detail-category-${option.value}`}
                          onPress={() => updateEditDraft('category', option.value)}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {quickAddStorageOptions.map((option) => {
                      const active = option.value === editDraft.storageSpace;

                      return (
                        <Pressable
                          key={`detail-storage-${option.value}`}
                          onPress={() => updateEditDraft('storageSpace', option.value)}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.inlineInputs}>
                    <TextInput
                      value={editDraft.expiresOn ?? ''}
                      onChangeText={(value) => updateEditDraft('expiresOn', value)}
                      placeholder="到期日期，如 2026-04-09"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, styles.flexInput]}
                    />
                    <TextInput
                      value={editDraft.quantity ? String(editDraft.quantity) : ''}
                      onChangeText={(value) => updateEditDraft('quantity', value ? Number(value) : undefined)}
                      placeholder="数量"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      style={[styles.input, styles.smallInput]}
                    />
                  </View>
                  <View style={styles.inlineInputs}>
                    <TextInput
                      value={editDraft.quantityUnit ?? ''}
                      onChangeText={(value) => updateEditDraft('quantityUnit', value)}
                      placeholder="单位"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, styles.smallInput]}
                    />
                    <TextInput
                      value={editDraft.note ?? ''}
                      onChangeText={(value) => updateEditDraft('note', value)}
                      placeholder="备注"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, styles.flexInput]}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <Pressable
                      onPress={() => {
                        resetEditDraft();
                        setIsEditing(false);
                        setEditError('');
                      }}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>取消</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleSaveEdit()}
                      disabled={isMutating}
                      style={[styles.primaryButton, isMutating && styles.buttonDisabled]}
                    >
                      <Text style={styles.primaryButtonText}>{isMutating ? '保存中...' : '保存修改'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>分类</Text>
                    <Text style={styles.detailValue}>{item.category}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>位置</Text>
                    <Text style={styles.detailValue}>{formatStorageSpaceLabel(item.storageSpace)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>数量</Text>
                    <Text style={styles.detailValue}>{item.quantity ?? 0}{item.quantityUnit ?? ''}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>到期</Text>
                    <Text style={styles.detailValue}>{item.expireAt ?? '未设置'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>备注</Text>
                    <Text style={styles.detailValue}>{item.note ?? '暂无备注'}</Text>
                  </View>
                </>
              )}
            </SectionCard>

            <SectionCard>
              <Text style={styles.sectionTitle}>时间信息</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>创建时间</Text>
                <Text style={styles.detailValue}>{item.createdAt ?? '未知'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>更新时间</Text>
                <Text style={styles.detailValue}>{item.updatedAt ?? '未知'}</Text>
              </View>
            </SectionCard>

            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { itemId: item.id } })}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>回到库存页处理</Text>
            </Pressable>
          </>
        )}
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
  itemName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  successMessage: {
    marginTop: 8,
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  editLinkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  actionRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  editPanel: {
    gap: 12,
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
  filterRow: {
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  smallInput: {
    width: 110,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
