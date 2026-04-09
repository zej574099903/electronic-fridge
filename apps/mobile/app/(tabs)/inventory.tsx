import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/src/constants/colors';
import { getExpirePriority } from '@/src/lib/expiry';
import {
  CreateFridgeItemInput,
  formatLastSyncedAt,
  filterInventoryItems,
  getInventorySummary,
  inventoryStorageSpaceOptions,
  sortInventoryItems,
  useInventoryStore,
} from '@/src/store/useInventoryStore';
import { ItemCategory, ItemStatus, StorageSpace } from '@/src/types/item';

const quickAddStorageOptions: Array<{ label: string; value: StorageSpace }> = [
  { label: '冷藏', value: 'chilled' },
  { label: '冷冻', value: 'frozen' },
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
  const isMutating = useInventoryStore((state) => state.isMutating);
  const lastSyncedAt = useInventoryStore((state) => state.lastSyncedAt);
  const searchQuery = useInventoryStore((state) => state.searchQuery);
  const selectedCategory = useInventoryStore((state) => state.selectedCategory);
  const selectedStorageSpace = useInventoryStore((state) => state.selectedStorageSpace);
  const statusScope = useInventoryStore((state) => state.statusScope);
  const selectedStatus = useInventoryStore((state) => state.selectedStatus);
  const sortBy = useInventoryStore((state) => state.sortBy);
  const addItem = useInventoryStore((state) => state.addItem);
  const updateItemStatus = useInventoryStore((state) => state.updateItemStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const clearError = useInventoryStore((state) => state.clearError);
  const setSearchQuery = useInventoryStore((state) => state.setSearchQuery);
  const setSelectedStorageSpace = useInventoryStore((state) => state.setSelectedStorageSpace);
  const setStatusScope = useInventoryStore((state) => state.setStatusScope);
  const setSelectedStatus = useInventoryStore((state) => state.setSelectedStatus);
  const setSelectedCategory = useInventoryStore((state) => state.setSelectedCategory);

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
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  const filteredItems = sortInventoryItems(
    filterInventoryItems(items, searchQuery, selectedCategory, selectedStorageSpace, statusScope, selectedStatus),
    sortBy
  );
  const activeItems = useMemo(() => items.filter(i => i.status === 'active'), [items]);
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

  async function handleStatusUpdate(id: string, name: string, status: ItemStatus) {
    const actionText = statusLabelMap[status];
    Alert.alert('更新库存状态', `确定将「${name}」标记为${actionText}吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认',
        onPress: async () => {
          clearError();
          try {
            await updateItemStatus(id, status);
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
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleQuickAdd() {
    if (!canSubmit) {
      setFormError(draft.name.trim().length === 0 ? '请先填写物品名称' : '数量必须是大于 0 的数字');
      return;
    }
    setFormError('');
    clearError();
    try {
      await addItem({ ...draft, quantity: draft.quantity && draft.quantity > 0 ? draft.quantity : undefined });
      setSuccessMessage(`已加入库存：${draft.name.trim()}`);
      setDraft({ name: '', category: 'ingredient', storageSpace: 'chilled', expiresOn: '', quantity: undefined, quantityUnit: '', note: '' });
    } catch {
      setFormError('新增失败，请稍后再试');
    }
  }

  function handleDeleteItem(id: string, name: string) {
    Alert.alert('确认删除', `确定要删除「${name}」吗？`, [
      { text: '取消', style: 'cancel' },
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
    <ScreenContainer edges={['left', 'right']} style={{ backgroundColor: 'transparent' }}>
      <StatusBar style="dark" translucent />
      <View style={StyleSheet.absoluteFill}>
        <Image source={require('../../assets/branding/arctic_bg_v3_light.png')} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={10} />
        <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)']} style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { backgroundColor: 'transparent' }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} tintColor="#1e293b" />}
      >
        <View style={styles.heroTransparent}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.titleLight}>库存管理</Text>
              <Text style={styles.syncTextLight}>已同步 {syncText}</Text>
            </View>
            <Pressable onPress={() => void handleRefresh()} style={styles.refreshIconLight}>
              <Ionicons name="refresh-outline" size={24} color="#1e293b" />
            </Pressable>
          </View>

          <View style={styles.zoneStats}>
            <View style={styles.zoneStatItem}>
              <Text style={styles.zoneStatValueLight}>{activeItems.filter(i => i.storageSpace === 'chilled').length}</Text>
              <Text style={styles.zoneStatLabelLight}>冷藏物品</Text>
            </View>
            <View style={styles.dividerLight} />
            <View style={styles.zoneStatItem}>
              <Text style={styles.zoneStatValueLight}>{activeItems.filter(i => i.storageSpace === 'frozen').length}</Text>
              <Text style={styles.zoneStatLabelLight}>冷冻物品</Text>
            </View>
          </View>
        </View>

        <View style={styles.scrollContent}>
          <BlurView intensity={80} tint="light" style={styles.quickAddTrayLight}>
            <Pressable onPress={() => setIsQuickAddExpanded(!isQuickAddExpanded)} style={styles.quickAddHeader}>
              <View style={styles.quickAddHeaderTitle}>
                <Ionicons name="add-circle" size={20} color="#1e293b" />
                <Text style={styles.quickAddLabelLight}>快速新增库存</Text>
              </View>
              <Ionicons name={isQuickAddExpanded ? "chevron-up" : "chevron-down"} size={20} color="rgba(30,41,59,0.3)" />
            </Pressable>

            {isQuickAddExpanded && (
              <View style={styles.quickAddForm}>
                {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
                {formError ? <Text style={styles.errorMessage}>{formError}</Text> : null}
                <TextInput
                  value={draft.name}
                  onChangeText={(v) => { updateDraft('name', v); if (formError) setFormError(''); }}
                  placeholder="物品名称"
                  placeholderTextColor="rgba(30,41,59,0.4)"
                  style={styles.inputLight}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {quickAddStorageOptions.map((opt) => (
                    <Pressable key={opt.value} onPress={() => updateDraft('storageSpace', opt.value)} style={[styles.chipLight, draft.storageSpace === opt.value && styles.chipActiveLight]}>
                      <Text style={[styles.chipTextLight, draft.storageSpace === opt.value && styles.chipTextActiveLight]}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.inputRow}>
                  <TextInput value={draft.expiresOn} onChangeText={(v) => updateDraft('expiresOn', v)} placeholder="到期日 (YYYY-MM-DD)" placeholderTextColor="rgba(30,41,59,0.4)" style={[styles.inputLight, { flex: 1 }]} />
                  <TextInput value={draft.quantity ? String(draft.quantity) : ''} onChangeText={(v) => updateDraft('quantity', v ? Number(v) : undefined)} placeholder="数量" placeholderTextColor="rgba(30,41,59,0.4)" keyboardType="number-pad" style={[styles.inputLight, { width: 80 }]} />
                </View>
                <Pressable onPress={handleQuickAdd} disabled={!canSubmit || isMutating} style={[styles.primaryButtonLight, (!canSubmit || isMutating) && styles.buttonDisabled]}>
                  <Text style={styles.primaryButtonText}>入库</Text>
                </Pressable>
              </View>
            )}
          </BlurView>

          <View style={styles.searchSection}>
            <BlurView intensity={80} tint="light" style={styles.searchBarLight}>
              <Ionicons name="search" size={18} color="rgba(30,41,59,0.4)" />
              <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="搜索库存项目..." placeholderTextColor="rgba(30,41,59,0.4)" style={styles.searchFieldLight} />
            </BlurView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneFilterRow}>
              {['all', 'chilled', 'frozen'].map((z) => (
                <Pressable key={z} onPress={() => setSelectedStorageSpace(z as any)} style={[styles.zoneChipLight, selectedStorageSpace === z && styles.zoneChipActiveLight]}>
                  <Text style={[styles.zoneChipTextLight, selectedStorageSpace === z && styles.zoneChipTextActiveLight]}>{z === 'all' ? '全部' : z === 'chilled' ? '冷藏' : '冷冻'}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.itemList}>
            <Text style={styles.listSubtitleLight}>全部库存 ({filteredItems.length})</Text>
            {filteredItems.map((item) => {
              const priority = getExpirePriority(item);
              return (
                <BlurView key={item.id} intensity={80} tint="light" style={styles.itemCardLight}>
                  <Pressable onLongPress={() => setEditingItemId(editingItemId === item.id ? null : item.id)} style={styles.itemCardHeaderLight}>
                    <View style={[styles.itemIconCircleLight, { backgroundColor: priority < 2 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }]}>
                      <Ionicons name={item.storageSpace === 'frozen' ? "snow" : "leaf"} size={24} color={priority < 2 ? '#ef4444' : '#22c55e'} />
                    </View>
                    <View style={styles.itemTitleGroup}>
                      <Text style={styles.itemCardNameLight}>{item.name}</Text>
                      <Text style={styles.itemCardMetaLight}>{item.quantity ?? '-'}{item.quantityUnit} · {item.storageSpace === 'frozen' ? '冷冻' : '冷藏'}</Text>
                    </View>
                    <View style={styles.itemDateGroup}>
                      <Text style={[styles.itemDateValueLight, priority < 2 && { color: '#ef4444' }]}>{item.expireAt ?? '永久'}</Text>
                      <Text style={styles.itemDateLabelLight}>过期时间</Text>
                    </View>
                  </Pressable>
                  <View style={styles.lifeBarBgLight}><View style={[styles.lifeBarFill, { width: `${priority >= 3 ? 100 : priority === 2 ? 60 : 20}%`, backgroundColor: priority >= 3 ? '#22c55e' : priority === 2 ? '#3b82f6' : '#ef4444' }]} /></View>
                  {editingItemId === item.id && (
                    <View style={styles.actionGridLight}>
                      <Pressable onPress={() => handleStatusUpdate(item.id, item.name, 'eaten')} style={styles.actionBtnLight}><Ionicons name="checkmark-done" size={20} color="#22c55e" /><Text style={styles.actionBtnTextLight}>已吃完</Text></Pressable>
                      <Pressable onPress={() => handleStatusUpdate(item.id, item.name, 'discarded')} style={styles.actionBtnLight}><Ionicons name="trash-outline" size={20} color="#ef4444" /><Text style={styles.actionBtnTextLight}>已丢弃</Text></Pressable>
                      <Pressable onPress={() => handleDeleteItem(item.id, item.name)} style={styles.actionBtnLight}><Ionicons name="close-circle-outline" size={20} color="#94a3b8" /><Text style={styles.actionBtnTextLight}>彻底删除</Text></Pressable>
                    </View>
                  )}
                </BlurView>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  scrollContent: { flex: 1, paddingHorizontal: 20, marginTop: -30 },
  heroTransparent: { padding: 24, paddingTop: 40, paddingBottom: 24, gap: 20 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleLight: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -1, textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  syncTextLight: { fontSize: 13, color: 'rgba(30,41,59,0.5)', fontWeight: '600', marginTop: 4 },
  refreshIconLight: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(30,41,59,0.05)' },
  zoneStats: { flexDirection: 'row', marginTop: 24, alignItems: 'center', gap: 20 },
  zoneStatItem: { flex: 1, alignItems: 'center' },
  zoneStatValueLight: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  zoneStatLabelLight: { fontSize: 12, color: 'rgba(30,41,59,0.4)', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  dividerLight: { width: 1, height: 30, backgroundColor: 'rgba(30,41,59,0.1)' },
  quickAddTrayLight: { padding: 20, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)' },
  quickAddHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickAddHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickAddLabelLight: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  quickAddForm: { marginTop: 16, gap: 12 },
  inputLight: { backgroundColor: 'rgba(30,41,59,0.05)', borderRadius: 14, padding: 12, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: 'rgba(30,41,59,0.1)' },
  inputRow: { flexDirection: 'row', gap: 12 },
  chipRow: { gap: 8 },
  chipLight: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(30,41,59,0.03)', borderWidth: 1, borderColor: 'rgba(30,41,59,0.1)' },
  chipActiveLight: { backgroundColor: 'rgba(30,41,59,0.1)', borderColor: 'rgba(30,41,59,0.2)' },
  chipTextLight: { fontSize: 13, color: 'rgba(30,41,59,0.5)', fontWeight: '600' },
  chipTextActiveLight: { color: '#1e293b' },
  primaryButtonLight: { backgroundColor: 'rgba(30,41,59,0.9)', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  buttonDisabled: { opacity: 0.5 },
  searchSection: { marginTop: 24, gap: 16 },
  searchBarLight: { flexDirection: 'row', alignItems: 'center', borderRadius: 32, paddingHorizontal: 20, height: 56, borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)', gap: 12, overflow: 'hidden' },
  searchFieldLight: { flex: 1, fontSize: 15, color: '#1e293b' },
  zoneFilterRow: { gap: 12 },
  zoneChipLight: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(30,41,59,0.03)', borderWidth: 1, borderColor: 'rgba(30,41,59,0.1)' },
  zoneChipActiveLight: { backgroundColor: 'rgba(30,41,59,0.1)', borderColor: 'rgba(30,41,59,0.2)' },
  zoneChipTextLight: { fontSize: 14, color: 'rgba(30,41,59,0.5)', fontWeight: '700' },
  zoneChipTextActiveLight: { color: '#1e293b' },
  itemList: { marginTop: 32, gap: 16, paddingBottom: 150 },
  listSubtitleLight: { fontSize: 13, color: 'rgba(30,41,59,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  itemCardLight: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.2)', borderRightColor: 'rgba(0,0,0,0.1)', borderBottomColor: 'rgba(0,0,0,0.2)', marginBottom: 8 },
  itemCardHeaderLight: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemIconCircleLight: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  itemTitleGroup: { flex: 1, gap: 4 },
  itemCardNameLight: { fontSize: 17, fontWeight: '800', color: '#1e293b', textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  itemCardMetaLight: { fontSize: 13, color: 'rgba(30,41,59,0.4)', fontWeight: '500' },
  itemDateGroup: { alignItems: 'flex-end', gap: 2 },
  itemDateValueLight: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  itemDateLabelLight: { fontSize: 10, color: 'rgba(30,41,59,0.5)', fontWeight: '700', textTransform: 'uppercase' },
  lifeBarBgLight: { height: 6, backgroundColor: 'rgba(30,41,59,0.05)', borderRadius: 3, marginHorizontal: 20, marginBottom: 20, overflow: 'hidden' },
  lifeBarFill: { height: '100%', borderRadius: 3 },
  actionGridLight: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(30,41,59,0.05)', backgroundColor: 'rgba(30,41,59,0.02)' },
  actionBtnLight: { alignItems: 'center', gap: 4 },
  actionBtnTextLight: { fontSize: 11, fontWeight: '700', color: 'rgba(30,41,59,0.5)' },
  successMessage: { color: '#22c55e', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  errorMessage: { color: '#ef4444', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
});
