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

export interface FridgeItem {
  id: string;
  name: string;
  category: ItemCategory;
  status: ItemStatus;
  expireAt?: string;
  expiresOn?: string;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
