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

export interface Household {
  id: string;
  name: string;
  inviteCode?: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: 'owner' | 'member';
  status: 'active' | 'left';
  nickname: string;
  joinedAt: string;
}

export interface FridgeItem {
  id: string;
  householdId?: string;
  name: string;
  category: ItemCategory;
  status: ItemStatus;
  storageSpace?: StorageSpace;
  expireAt?: string;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
