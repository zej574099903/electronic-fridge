import { fridgeItems } from '@/src/mocks/dashboard';
import { formatExpireLabel } from '@/src/lib/expiry';
import { FridgeItem, Household, HouseholdMember } from '@/src/types/item';

export const API_BASE_URL = 'http://10.30.56.27:3000';
export const USE_INVENTORY_MOCK = false;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
}

let currentHouseholdScopeId: string | null = null;

export function setCurrentHouseholdScope(householdId: string | null) {
  currentHouseholdScopeId = householdId;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(currentHouseholdScopeId ? { 'x-household-id': currentHouseholdScopeId } : null),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'DELETE',
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body,
  });
}

export interface CreateInventoryItemPayload {
  name: string;
  category: FridgeItem['category'];
  storageSpace?: FridgeItem['storageSpace'];
  expireAt?: string;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
}

export interface UpdateInventoryItemPayload {
  name?: string;
  category?: FridgeItem['category'];
  status?: FridgeItem['status'];
  storageSpace?: FridgeItem['storageSpace'];
  expireAt?: string;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
}

export interface NoticeReadStateResponse {
  noticeReadState: Record<string, boolean>;
}

const defaultMockHousehold: Household = {
  id: 'default-household',
  name: '我的小厨房',
  inviteCode: 'DEFAULT',
};

let inventoryMockDb: FridgeItem[] = [...fridgeItems];
let noticeReadStateMockDb: Record<string, boolean> = {};
let householdMembersMockDb: HouseholdMember[] = [
  {
    id: 'member-1',
    householdId: defaultMockHousehold.id,
    userId: 'default-user',
    role: 'owner',
    status: 'active',
    nickname: '我',
    joinedAt: new Date().toISOString(),
  },
];

function createMockInventoryItem(payload: CreateInventoryItemPayload): FridgeItem {
  return {
    id: `${Date.now()}`,
    householdId: defaultMockHousehold.id,
    name: payload.name.trim(),
    category: payload.category,
    storageSpace: payload.storageSpace,
    status: 'active',
    expireAt: formatExpireLabel(payload.expiresOn, payload.expireAt?.trim() || undefined),
    expiresOn: payload.expiresOn,
    quantity: payload.quantity,
    quantityUnit: payload.quantityUnit?.trim() || undefined,
    note: payload.note?.trim() || undefined,
  };
}

export const inventoryApi = {
  async list(): Promise<FridgeItem[]> {
    if (USE_INVENTORY_MOCK) {
      return Promise.resolve([...inventoryMockDb]);
    }

    return apiGet<FridgeItem[]>('/api/items');
  },

  async create(payload: CreateInventoryItemPayload): Promise<FridgeItem> {
    if (USE_INVENTORY_MOCK) {
      const createdItem = createMockInventoryItem(payload);
      inventoryMockDb = [createdItem, ...inventoryMockDb];
      return Promise.resolve(createdItem);
    }

    return apiPost<FridgeItem>('/api/items', payload);
  },

  async remove(id: string): Promise<void> {
    if (USE_INVENTORY_MOCK) {
      inventoryMockDb = inventoryMockDb.filter((item) => item.id !== id);
      return Promise.resolve();
    }

    return apiDelete<void>(`/api/items/${id}`);
  },

  async update(id: string, payload: UpdateInventoryItemPayload): Promise<FridgeItem> {
    if (USE_INVENTORY_MOCK) {
      const currentItem = inventoryMockDb.find((item) => item.id === id);

      if (!currentItem) {
        throw new Error('Request failed: 404');
      }

      const updatedItem: FridgeItem = {
        ...currentItem,
        name: payload.name?.trim() ?? currentItem.name,
        category: payload.category ?? currentItem.category,
        storageSpace: payload.storageSpace !== undefined ? payload.storageSpace : currentItem.storageSpace,
        status: payload.status ?? currentItem.status,
        expiresOn: payload.expiresOn !== undefined ? payload.expiresOn || undefined : currentItem.expiresOn,
        expireAt:
          payload.expiresOn !== undefined || payload.expireAt !== undefined
            ? formatExpireLabel(
                payload.expiresOn !== undefined ? payload.expiresOn || undefined : currentItem.expiresOn,
                payload.expireAt !== undefined ? payload.expireAt.trim() || undefined : currentItem.expireAt
              )
            : currentItem.expireAt,
        quantity: payload.quantity !== undefined ? payload.quantity : currentItem.quantity,
        quantityUnit:
          payload.quantityUnit !== undefined ? payload.quantityUnit.trim() || undefined : currentItem.quantityUnit,
        note: payload.note !== undefined ? payload.note.trim() || undefined : currentItem.note,
      };

      inventoryMockDb = inventoryMockDb.map((item) => (item.id === id ? updatedItem : item));
      return Promise.resolve(updatedItem);
    }

    return apiPatch<FridgeItem>(`/api/items/${id}`, payload);
  },
};

export const householdApi = {
  async getCurrent(): Promise<Household> {
    if (USE_INVENTORY_MOCK) {
      return Promise.resolve(defaultMockHousehold);
    }

    return apiGet<Household>('/api/households/current');
  },

  async listMembers(): Promise<HouseholdMember[]> {
    if (USE_INVENTORY_MOCK) {
      return Promise.resolve([...householdMembersMockDb]);
    }

    return apiGet<HouseholdMember[]>('/api/households/members');
  },

  async create(name: string): Promise<Household> {
    if (USE_INVENTORY_MOCK) {
      const createdHousehold: Household = {
        id: `${Date.now()}`,
        name: name.trim(),
        inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      };
      setCurrentHouseholdScope(createdHousehold.id);
      householdMembersMockDb = [
        {
          id: `member-${Date.now()}`,
          householdId: createdHousehold.id,
          userId: 'default-user',
          role: 'owner',
          status: 'active',
          nickname: '我',
          joinedAt: new Date().toISOString(),
        },
      ];
      return Promise.resolve(createdHousehold);
    }

    return apiPost<Household>('/api/households', { name });
  },

  async join(inviteCode: string, nickname?: string): Promise<Household> {
    if (USE_INVENTORY_MOCK) {
      householdMembersMockDb = [
        ...householdMembersMockDb,
        {
          id: `member-${Date.now()}`,
          householdId: defaultMockHousehold.id,
          userId: `guest-${Date.now()}`,
          role: 'member',
          status: 'active',
          nickname: nickname?.trim() || '我',
          joinedAt: new Date().toISOString(),
        },
      ];
      return Promise.resolve(defaultMockHousehold);
    }

    return apiPost<Household>('/api/households/join', { inviteCode, nickname });
  },
};

export const noticeReadApi = {
  async list(): Promise<Record<string, boolean>> {
    if (USE_INVENTORY_MOCK) {
      return Promise.resolve({ ...noticeReadStateMockDb });
    }

    const response = await apiGet<NoticeReadStateResponse>('/api/notices/read-state');
    return response.noticeReadState;
  },

  async markAsRead(noticeIds: string[]): Promise<Record<string, boolean>> {
    if (USE_INVENTORY_MOCK) {
      noticeReadStateMockDb = noticeIds.reduce<Record<string, boolean>>(
        (result, noticeId) => ({
          ...result,
          [noticeId]: true,
        }),
        { ...noticeReadStateMockDb }
      );

      return Promise.resolve({ ...noticeReadStateMockDb });
    }

    const response = await apiPost<NoticeReadStateResponse>('/api/notices/read-state', { noticeIds });
    return response.noticeReadState;
  },
};
