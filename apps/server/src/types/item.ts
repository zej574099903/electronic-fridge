export type ItemCategory =
  | 'ingredient'
  | 'fruit'
  | 'drink'
  | 'dessert'
  | 'snack'
  | 'leftover'
  | 'prepared'
  | 'other';

export type ItemStatus = 'active' | 'expired' | 'eaten' | 'discarded';

export type StorageSpace = 'chilled' | 'frozen' | 'room_temp' | 'other';

export interface FridgeItem {
  id: string;
  householdId: string;
  name: string;
  photoUri?: string;
  category: ItemCategory;
  status: ItemStatus;
  storageSpace?: StorageSpace;
  expireAt?: string;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemInput {
  name: string;
  photoUri?: string;
  category: ItemCategory;
  storageSpace?: StorageSpace;
  expireAt?: string;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
}

export interface UpdateItemInput {
  name?: string;
  photoUri?: string;
  category?: ItemCategory;
  status?: ItemStatus;
  storageSpace?: StorageSpace;
  expireAt?: string;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
}
