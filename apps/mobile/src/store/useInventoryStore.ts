import { create } from 'zustand';
import { householdApi, inventoryApi, noticeReadApi, setCurrentHouseholdScope, UpdateInventoryItemPayload } from '@/src/lib/api';
import { getExpirePriority, isUrgentItem } from '@/src/lib/expiry';
import { FridgeItem, Household, HouseholdMember, ItemCategory, ItemStatus, StorageSpace } from '@/src/types/item';

export type InventoryStatusScope = 'active_only' | 'processed_only' | 'all';
export type InventorySortOption = 'expire_at' | 'created_at' | 'updated_at';

export interface NoticeReadState {
  [noticeId: string]: boolean;
}

export interface CreateFridgeItemInput {
  name: string;
  photoUri?: string;
  category: ItemCategory;
  storageSpace?: StorageSpace;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
}

export const inventoryCategoryOptions: Array<{ label: string; value: ItemCategory | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '食材', value: 'ingredient' },
  { label: '水果', value: 'fruit' },
  { label: '甜品', value: 'dessert' },
  { label: '零食', value: 'snack' },
  { label: '剩菜', value: 'leftover' },
];

export const inventoryStatusScopeOptions: Array<{ label: string; value: InventoryStatusScope }> = [
  { label: '全部', value: 'all' },
  { label: '只看库存中', value: 'active_only' },
  { label: '只看已处理', value: 'processed_only' },
];

export const inventoryStatusOptions: Array<{ label: string; value: ItemStatus | 'all' }> = [
  { label: '全部状态', value: 'all' },
  { label: '库存中', value: 'active' },
  { label: '已吃掉', value: 'eaten' },
  { label: '已丢弃', value: 'discarded' },
  { label: '已过期', value: 'expired' },
];

export const inventoryStorageSpaceOptions: Array<{ label: string; value: StorageSpace | 'all' }> = [
  { label: '全部位置', value: 'all' },
  { label: '冷藏', value: 'chilled' },
  { label: '冷冻', value: 'frozen' },
  { label: '常温', value: 'room_temp' },
  { label: '其他', value: 'other' },
];

export const inventorySortOptions: Array<{ label: string; value: InventorySortOption }> = [
  { label: '按到期时间', value: 'expire_at' },
  { label: '按创建时间', value: 'created_at' },
  { label: '按更新时间', value: 'updated_at' },
];

interface InventoryState {
  items: FridgeItem[];
  initialized: boolean;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  currentHousehold: Household | null;
  householdMembers: HouseholdMember[];
  searchQuery: string;
  selectedCategory: ItemCategory | 'all';
  selectedStorageSpace: StorageSpace | 'all';
  statusScope: InventoryStatusScope;
  selectedStatus: ItemStatus | 'all';
  sortBy: InventorySortOption;
  noticeReadState: NoticeReadState;
  fetchItems: () => Promise<void>;
  fetchNoticeReadState: () => Promise<void>;
  fetchHouseholdMembers: () => Promise<void>;
  addItem: (item: CreateFridgeItemInput) => Promise<void>;
  updateItem: (id: string, item: UpdateInventoryItemPayload) => Promise<void>;
  updateItemStatus: (id: string, status: ItemStatus) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearError: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ItemCategory | 'all') => void;
  setSelectedStorageSpace: (storageSpace: StorageSpace | 'all') => void;
  setStatusScope: (scope: InventoryStatusScope) => void;
  setSelectedStatus: (status: ItemStatus | 'all') => void;
  setSortBy: (sortBy: InventorySortOption) => void;
  markNoticeAsRead: (noticeId: string) => void;
  markAllNoticesAsRead: (noticeIds: string[]) => void;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string, nickname?: string) => Promise<void>;
  resetFilters: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  initialized: false,
  isLoading: false,
  isMutating: false,
  error: null,
  lastSyncedAt: null,
  currentHousehold: null,
  householdMembers: [],
  searchQuery: '',
  selectedCategory: 'all',
  selectedStorageSpace: 'all',
  statusScope: 'all',
  selectedStatus: 'all',
  sortBy: 'expire_at',
  noticeReadState: {},
  fetchItems: async () => {
    set({ isLoading: true, error: null });

    try {
      const items = await inventoryApi.list();
      const noticeReadState = await noticeReadApi.list();
      const currentHousehold = await householdApi.getCurrent();
      setCurrentHouseholdScope(currentHousehold.id);
      const householdMembers = await householdApi.listMembers();
      set({
        items,
        initialized: true,
        isLoading: false,
        noticeReadState,
        currentHousehold,
        householdMembers,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载库存失败',
        initialized: true,
        isLoading: false,
      });
    }
  },
  fetchHouseholdMembers: async () => {
    try {
      const householdMembers = await householdApi.listMembers();
      set({ householdMembers });
    } catch {
      return;
    }
  },
  fetchNoticeReadState: async () => {
    try {
      const noticeReadState = await noticeReadApi.list();
      set({ noticeReadState });
    } catch {
      return;
    }
  },
  addItem: async (item) => {
    set({ isMutating: true, error: null });

    try {
      const createdItem = await inventoryApi.create(item);
      set((state) => ({
        items: [createdItem, ...state.items],
        isMutating: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '新增库存失败',
        isMutating: false,
      });
      throw error;
    }
  },
  updateItem: async (id, item) => {
    set({ isMutating: true, error: null });

    try {
      const updatedItem = await inventoryApi.update(id, item);
      set((state) => ({
        items: state.items.map((currentItem) => (currentItem.id === id ? updatedItem : currentItem)),
        isMutating: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新库存失败',
        isMutating: false,
      });
      throw error;
    }
  },
  updateItemStatus: async (id, status) => {
    set({ isMutating: true, error: null });

    try {
      const updatedItem = await inventoryApi.update(id, { status });
      set((state) => ({
        items: state.items.map((currentItem) => (currentItem.id === id ? updatedItem : currentItem)),
        isMutating: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新库存状态失败',
        isMutating: false,
      });
      throw error;
    }
  },
  removeItem: async (id) => {
    set({ isMutating: true, error: null });

    try {
      await inventoryApi.remove(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        isMutating: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除库存失败',
        isMutating: false,
      });
      throw error;
    }
  },
  clearError: () => set({ error: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedStorageSpace: (storageSpace) => set({ selectedStorageSpace: storageSpace }),
  setStatusScope: (scope) => set({ statusScope: scope }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSortBy: (sortBy) => set({ sortBy }),
  markNoticeAsRead: (noticeId) => {
    set((state) => ({
      noticeReadState: {
        ...state.noticeReadState,
        [noticeId]: true,
      },
    }));

    void noticeReadApi.markAsRead([noticeId]).then((noticeReadState) => {
      set((state) => ({
        noticeReadState: {
          ...state.noticeReadState,
          ...noticeReadState,
        },
      }));
    });
  },
  markAllNoticesAsRead: (noticeIds) => {
    set((state) => ({
      noticeReadState: noticeIds.reduce<NoticeReadState>(
        (result, noticeId) => ({
          ...result,
          [noticeId]: true,
        }),
        { ...state.noticeReadState }
      ),
    }));

    void noticeReadApi.markAsRead(noticeIds).then((noticeReadState) => {
      set((state) => ({
        noticeReadState: {
          ...state.noticeReadState,
          ...noticeReadState,
        },
      }));
    });
  },
  createHousehold: async (name) => {
    set({ isMutating: true, error: null });

    try {
      const currentHousehold = await householdApi.create(name);
      setCurrentHouseholdScope(currentHousehold.id);
      const [items, noticeReadState, householdMembers] = await Promise.all([
        inventoryApi.list(),
        noticeReadApi.list(),
        householdApi.listMembers(),
      ]);
      set({
        currentHousehold,
        items,
        noticeReadState,
        householdMembers,
        isMutating: false,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建家庭失败',
        isMutating: false,
      });
      throw error;
    }
  },
  joinHousehold: async (inviteCode, nickname) => {
    set({ isMutating: true, error: null });

    try {
      const currentHousehold = await householdApi.join(inviteCode, nickname);
      setCurrentHouseholdScope(currentHousehold.id);
      const [items, noticeReadState, householdMembers] = await Promise.all([
        inventoryApi.list(),
        noticeReadApi.list(),
        householdApi.listMembers(),
      ]);
      set({
        currentHousehold,
        items,
        noticeReadState,
        householdMembers,
        isMutating: false,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加入家庭失败',
        isMutating: false,
      });
      throw error;
    }
  },
  resetFilters: () =>
    set({
      searchQuery: '',
      selectedCategory: 'all',
      selectedStorageSpace: 'all',
      statusScope: 'all',
      selectedStatus: 'all',
      sortBy: 'expire_at',
    }),
}));

export function filterInventoryItems(
  items: FridgeItem[],
  searchQuery: string,
  selectedCategory: ItemCategory | 'all',
  selectedStorageSpace: StorageSpace | 'all',
  statusScope: InventoryStatusScope,
  selectedStatus: ItemStatus | 'all'
) {
  return items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStorageSpace = selectedStorageSpace === 'all' || item.storageSpace === selectedStorageSpace;
    const matchesScope =
      statusScope === 'all' ||
      (statusScope === 'active_only' && item.status === 'active') ||
      (statusScope === 'processed_only' && item.status !== 'active');
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const keyword = searchQuery.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      item.name.toLowerCase().includes(keyword) ||
      item.note?.toLowerCase().includes(keyword);

    return matchesCategory && matchesStorageSpace && matchesScope && matchesStatus && matchesSearch;
  });
}

function parseDateTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function sortInventoryItems(items: FridgeItem[], sortBy: InventorySortOption) {
  return [...items].sort((left, right) => {
    if (sortBy === 'expire_at') {
      return getExpirePriority(left) - getExpirePriority(right);
    }

    if (sortBy === 'created_at') {
      return parseDateTimestamp(right.createdAt) - parseDateTimestamp(left.createdAt);
    }

    return parseDateTimestamp(right.updatedAt) - parseDateTimestamp(left.updatedAt);
  });
}

export function getInventorySummary(items: FridgeItem[]) {
  const activeItems = items.filter((item) => item.status === 'active');
  const urgentCount = activeItems.filter((item) => isUrgentItem(item)).length;
  const leftoverCount = activeItems.filter((item) => item.category === 'leftover').length;

  return {
    totalCount: activeItems.length,
    urgentCount,
    leftoverCount,
  };
}

export function formatLastSyncedAt(lastSyncedAt: string | null) {
  if (!lastSyncedAt) {
    return '尚未同步';
  }

  const date = new Date(lastSyncedAt);

  if (Number.isNaN(date.getTime())) {
    return '尚未同步';
  }

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) {
    return '刚刚更新';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前更新`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} 小时前更新`;
  }

  return `最后更新 ${date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
