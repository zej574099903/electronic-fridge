import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/constants/colors';
import { formatStorageSpaceLabel } from '@/src/lib/expiry';
import {
  CreateFridgeItemInput,
  formatLastSyncedAt,
  filterInventoryItems,
  getInventorySummary,
  inventoryCategoryOptions,
  inventoryStorageSpaceOptions,
  inventorySortOptions,
  inventoryStatusOptions,
  inventoryStatusScopeOptions,
  sortInventoryItems,
  useInventoryStore,
} from '@/src/store/useInventoryStore';
import { ItemCategory, ItemStatus, StorageSpace } from '@/src/types/item';

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

const statusLabelMap: Record<ItemStatus, string> = {
  active: '库存中',
  eaten: '已吃掉',
  discarded: '已丢弃',
  expired: '已过期',
};

export default function InventoryTabScreen() {
  const params = useLocalSearchParams<{ itemId?: string }>();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const itemPositionsRef = useRef<Record<string, number>>({});
  const items = useInventoryStore((state) => state.items);
  const initialized = useInventoryStore((state) => state.initialized);
  const isLoading = useInventoryStore((state) => state.isLoading);
  const isMutating = useInventoryStore((state) => state.isMutating);
  const error = useInventoryStore((state) => state.error);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const searchQuery = useInventoryStore((state) => state.searchQuery);
  const selectedCategory = useInventoryStore((state) => state.selectedCategory);
  const selectedStorageSpace = useInventoryStore((state) => state.selectedStorageSpace);
  const statusScope = useInventoryStore((state) => state.statusScope);
  const selectedStatus = useInventoryStore((state) => state.selectedStatus);
  const sortBy = useInventoryStore((state) => state.sortBy);
  const addItem = useInventoryStore((state) => state.addItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const updateItemStatus = useInventoryStore((state) => state.updateItemStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const clearError = useInventoryStore((state) => state.clearError);
  const setSearchQuery = useInventoryStore((state) => state.setSearchQuery);
  const setSelectedCategory = useInventoryStore((state) => state.setSelectedCategory);
  const setSelectedStorageSpace = useInventoryStore((state) => state.setSelectedStorageSpace);
  const setStatusScope = useInventoryStore((state) => state.setStatusScope);
  const setSelectedStatus = useInventoryStore((state) => state.setSelectedStatus);
  const setSortBy = useInventoryStore((state) => state.setSortBy);
  const resetFilters = useInventoryStore((state) => state.resetFilters);
  const [draft, setDraft] = useState<CreateFridgeItemInput>({
    name: '',
    category: 'ingredient',
    storageSpace: 'chilled',
    expiresOn: '',
    quantity: undefined,
    quantityUnit: '',
    note: '',
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CreateFridgeItemInput>({
    name: '',
    category: 'ingredient',
    storageSpace: 'chilled',
    expiresOn: '',
    quantity: undefined,
    quantityUnit: '',
    note: '',
  });
  const [editError, setEditError] = useState('');
  const [editSuccessMessage, setEditSuccessMessage] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  const filteredItems = sortInventoryItems(
    filterInventoryItems(items, searchQuery, selectedCategory, selectedStorageSpace, statusScope, selectedStatus),
    sortBy
  );
  const summary = getInventorySummary(items);
  const syncText = formatLastSyncedAt(lastSyncedAt);
  const canSubmit = useMemo(() => {
    const hasName = draft.name.trim().length > 0;
    const quantityValid = draft.quantity === undefined || (Number.isFinite(draft.quantity) && draft.quantity > 0);

    return hasName && quantityValid;
  }, [draft.name, draft.quantity]);

  useEffect(() => {
    if (!initialized) {
      void fetchItems();
    }
  }, [fetchItems, initialized]);

  useEffect(() => {
    if (!params.itemId) {
      return;
    }

    const targetItem = items.find((item) => item.id === params.itemId);

    if (!targetItem) {
      return;
    }

    setSearchQuery(targetItem.name);
    setSelectedCategory('all');
    setSelectedStorageSpace('all');
    setStatusScope('all');
    setSelectedStatus('all');
    setHighlightedItemId(targetItem.id);
  }, [items, params.itemId, setSearchQuery, setSelectedCategory, setSelectedStatus, setSelectedStorageSpace, setStatusScope]);

  useEffect(() => {
    if (!highlightedItemId) {
      return;
    }

    const position = itemPositionsRef.current[highlightedItemId];

    if (position === undefined) {
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: Math.max(position - 140, 0),
      animated: true,
    });
  }, [filteredItems, highlightedItemId]);

  function handleStatusUpdate(id: string, name: string, status: ItemStatus) {
    const actionText = statusLabelMap[status];

    Alert.alert('更新库存状态', `确定将「${name}」标记为${actionText}吗？`, [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确认',
        onPress: async () => {
          clearError();

          try {
            await updateItemStatus(id, status);
            setEditSuccessMessage(`已更新状态：${actionText}`);
          } catch {
            Alert.alert('更新失败', '请稍后再试');
          }
        },
      },
    ]);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    clearError();

    try {
      await fetchItems();
    } finally {
      setIsRefreshing(false);
    }
  }

  function updateDraft<K extends keyof CreateFridgeItemInput>(key: K, value: CreateFridgeItemInput[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleQuickAdd() {
    if (!canSubmit) {
      if (draft.name.trim().length === 0) {
        setFormError('请先填写物品名称');
        return;
      }

      setFormError('数量必须是大于 0 的数字');
      return;
    }

    setFormError('');
    clearError();

    try {
      await addItem({
        ...draft,
        quantity: draft.quantity && draft.quantity > 0 ? draft.quantity : undefined,
      });
      setSuccessMessage(`已加入库存：${draft.name.trim()}`);
    } catch {
      setFormError('新增失败，请稍后再试');
      return;
    }

    setDraft({
      name: '',
      category: 'ingredient',
      storageSpace: 'chilled',
      expiresOn: '',
      quantity: undefined,
      quantityUnit: '',
      note: '',
    });
  }

  function startEditItem(item: (typeof items)[number]) {
    setEditingItemId(item.id);
    setEditError('');
    setEditSuccessMessage('');
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

  function cancelEditItem() {
    setEditingItemId(null);
    setEditError('');
    setEditSuccessMessage('');
  }

  function updateEditDraft<K extends keyof CreateFridgeItemInput>(key: K, value: CreateFridgeItemInput[K]) {
    setEditDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSaveEdit() {
    if (!editingItemId) {
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

    setEditError('');
    clearError();

    try {
      await updateItem(editingItemId, {
        name: editDraft.name,
        category: editDraft.category,
        storageSpace: editDraft.storageSpace,
        expiresOn: editDraft.expiresOn,
        quantity: editDraft.quantity && editDraft.quantity > 0 ? editDraft.quantity : undefined,
        quantityUnit: editDraft.quantityUnit,
        note: editDraft.note,
      });
      setEditSuccessMessage('库存已更新');
      setEditingItemId(null);
    } catch {
      setEditError('更新失败，请稍后再试');
    }
  }

  function handleDeleteItem(id: string, name: string) {
    Alert.alert('确认删除', `确定要删除「${name}」吗？`, [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          clearError();

          try {
            await removeItem(id);
          } catch {
            Alert.alert('删除失败', '请稍后再试');
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <Text style={styles.title}>库存</Text>
            <Pressable
              onPress={() => void handleRefresh()}
              disabled={isLoading || isRefreshing}
              style={[styles.refreshButton, (isLoading || isRefreshing) && styles.refreshButtonDisabled]}
            >
              <Text style={styles.refreshButtonText}>{isRefreshing ? '刷新中...' : '手动刷新'}</Text>
            </Pressable>
          </View>
          <Text style={styles.description}>查看冰箱里的食材、零食、剩菜和冷冻物，现在可以直接搜索和按分类筛选。</Text>
          <Text style={styles.syncText}>{syncText}</Text>
        </View>

        {error ? (
          <SectionCard>
            <Text style={styles.errorMessage}>{error}</Text>
            <Pressable onPress={() => void handleRefresh()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>重新加载</Text>
            </Pressable>
          </SectionCard>
        ) : null}

        {isLoading ? (
          <SectionCard>
            <Text style={styles.emptyTitle}>库存加载中...</Text>
            <Text style={styles.emptyDescription}>正在同步库存数据，请稍候。</Text>
          </SectionCard>
        ) : (
          <SectionCard>
            <Text style={styles.sectionTitle}>快速新增物品</Text>
            {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
            {formError ? <Text style={styles.errorMessage}>{formError}</Text> : null}
            <TextInput
              value={draft.name}
              onChangeText={(value) => {
                updateDraft('name', value);
                if (formError) {
                  setFormError('');
                }
                if (successMessage) {
                  setSuccessMessage('');
                }
              }}
              placeholder="例如：鸡蛋 / 草莓 / 剩米饭"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {quickAddCategoryOptions.map((option) => {
                const active = option.value === draft.category;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => updateDraft('category', option.value)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {quickAddStorageOptions.map((option) => {
                const active = option.value === draft.storageSpace;

                return (
                  <Pressable
                    key={`draft-space-${option.value}`}
                    onPress={() => updateDraft('storageSpace', option.value)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.inlineInputs}>
              <TextInput
                value={draft.expiresOn ?? ''}
                onChangeText={(value) => {
                  updateDraft('expiresOn', value);
                  if (successMessage) {
                    setSuccessMessage('');
                  }
                }}
                placeholder="到期日期，如 2026-04-09"
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, styles.flexInput]}
              />
              <TextInput
                value={draft.quantity ? String(draft.quantity) : ''}
                onChangeText={(value) => {
                  updateDraft('quantity', value ? Number(value) : undefined);
                  if (formError) {
                    setFormError('');
                  }
                  if (successMessage) {
                    setSuccessMessage('');
                  }
                }}
                placeholder="数量"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={[styles.searchInput, styles.smallInput]}
              />
            </View>
            <View style={styles.inlineInputs}>
              <TextInput
                value={draft.quantityUnit ?? ''}
                onChangeText={(value) => {
                  updateDraft('quantityUnit', value);
                  if (successMessage) {
                    setSuccessMessage('');
                  }
                }}
                placeholder="单位，如 个 / 盒 / 杯"
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, styles.smallInput]}
              />
              <TextInput
                value={draft.note ?? ''}
                onChangeText={(value) => {
                  updateDraft('note', value);
                  if (successMessage) {
                    setSuccessMessage('');
                  }
                }}
                placeholder="备注，如 冷藏上层"
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, styles.flexInput]}
              />
            </View>
            <Pressable
              onPress={handleQuickAdd}
              disabled={!canSubmit || isMutating}
              style={[styles.submitButton, (!canSubmit || isMutating) && styles.submitButtonDisabled]}
            >
              <Text style={styles.submitButtonText}>{isMutating ? '处理中...' : '加入库存'}</Text>
            </Pressable>
          </SectionCard>
        )}
        <SectionCard>
          <Text style={styles.sectionTitle}>搜索与筛选</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索食物名称或备注"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {inventoryStatusScopeOptions.map((option) => {
              const active = option.value === statusScope;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setStatusScope(option.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {inventoryCategoryOptions.map((option) => {
              const active = option.value === selectedCategory;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedCategory(option.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {inventoryStorageSpaceOptions.map((option) => {
              const active = option.value === selectedStorageSpace;

              return (
                <Pressable
                  key={`space-${option.value}`}
                  onPress={() => setSelectedStorageSpace(option.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {inventoryStatusOptions.map((option) => {
              const active = option.value === selectedStatus;

              return (
                <Pressable
                  key={`status-${option.value}`}
                  onPress={() => setSelectedStatus(option.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {inventorySortOptions.map((option) => {
              const active = option.value === sortBy;

              return (
                <Pressable
                  key={`sort-${option.value}`}
                  onPress={() => setSortBy(option.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={resetFilters} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>清空筛选</Text>
          </Pressable>
        </SectionCard>
        <SectionCard>
          <Text style={styles.sectionTitle}>当前库存</Text>
          {editSuccessMessage ? <Text style={styles.successMessage}>{editSuccessMessage}</Text> : null}
          <Text style={styles.resultCount}>共匹配 {filteredItems.length} 项</Text>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>没有匹配到库存</Text>
              <Text style={styles.emptyDescription}>试试修改关键词，或者切回“全部”分类看看。</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <View
                key={item.id}
                onLayout={(event) => {
                  itemPositionsRef.current[item.id] = event.nativeEvent.layout.y;
                }}
                style={[styles.itemCard, highlightedItemId === item.id && styles.highlightedItemCard]}
              >
                <View style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Pressable onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </Pressable>
                    <Text style={styles.itemMeta}>
                      {item.category} · {formatStorageSpaceLabel(item.storageSpace)} · {item.quantity ?? 0}
                      {item.quantityUnit ?? ''}
                    </Text>
                    <Text style={[styles.statusText, styles[`${item.status}Status`]]}>{statusLabelMap[item.status]}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.expireLabel}>{item.expireAt ?? '未设置'}</Text>
                    <Text style={styles.noteText}>{item.note ?? '暂无备注'}</Text>
                    <View style={styles.actionRow}>
                      <Pressable onPress={() => startEditItem(item)}>
                        <Text style={styles.editText}>编辑</Text>
                      </Pressable>
                      {item.status === 'active' ? (
                        <>
                          <Pressable onPress={() => handleStatusUpdate(item.id, item.name, 'eaten')}>
                            <Text style={styles.successActionText}>吃掉</Text>
                          </Pressable>
                          <Pressable onPress={() => handleStatusUpdate(item.id, item.name, 'discarded')}>
                            <Text style={styles.deleteText}>丢弃</Text>
                          </Pressable>
                          <Pressable onPress={() => handleStatusUpdate(item.id, item.name, 'expired')}>
                            <Text style={styles.warningActionText}>过期</Text>
                          </Pressable>
                        </>
                      ) : null}
                      <Pressable onPress={() => handleDeleteItem(item.id, item.name)}>
                        <Text style={styles.deleteText}>删除</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                {editingItemId === item.id ? (
                  <View style={styles.editPanel}>
                    <Text style={styles.sectionSubtitle}>编辑库存</Text>
                    {editError ? <Text style={styles.errorMessage}>{editError}</Text> : null}
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
                      style={styles.searchInput}
                    />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                      {quickAddCategoryOptions.map((option) => {
                        const active = option.value === editDraft.category;

                        return (
                          <Pressable
                            key={`edit-${option.value}`}
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
                            key={`edit-space-${option.value}`}
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
                        style={[styles.searchInput, styles.flexInput]}
                      />
                      <TextInput
                        value={editDraft.quantity ? String(editDraft.quantity) : ''}
                        onChangeText={(value) => updateEditDraft('quantity', value ? Number(value) : undefined)}
                        placeholder="数量"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                        style={[styles.searchInput, styles.smallInput]}
                      />
                    </View>
                    <View style={styles.inlineInputs}>
                      <TextInput
                        value={editDraft.quantityUnit ?? ''}
                        onChangeText={(value) => updateEditDraft('quantityUnit', value)}
                        placeholder="单位"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, styles.smallInput]}
                      />
                      <TextInput
                        value={editDraft.note ?? ''}
                        onChangeText={(value) => updateEditDraft('note', value)}
                        placeholder="备注"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, styles.flexInput]}
                      />
                    </View>
                    <View style={styles.editActions}>
                      <Pressable onPress={cancelEditItem} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>取消</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveEdit}
                        disabled={isMutating}
                        style={[styles.submitButton, styles.editSubmitButton, isMutating && styles.submitButtonDisabled]}
                      >
                        <Text style={styles.submitButtonText}>{isMutating ? '保存中...' : '保存修改'}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            ))
          )}
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
  hero: {
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  syncText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  successMessage: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 12,
    textAlign: 'center',
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
  searchInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  filterRow: {
    gap: 10,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '700',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  resultCount: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  itemCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 16,
  },
  highlightedItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderColor: colors.secondary,
    borderWidth: 1,
  },
  itemMain: {
    flex: 1,
    gap: 6,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeStatus: {
    color: colors.secondary,
  },
  eatenStatus: {
    color: colors.success,
  },
  discardedStatus: {
    color: colors.danger,
  },
  expiredStatus: {
    color: colors.warning,
  },
  expireLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  noteText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  successActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  warningActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  editPanel: {
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editSubmitButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
