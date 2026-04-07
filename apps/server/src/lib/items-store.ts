import { CreateItemInput, FridgeItem } from '@/src/types/item';

const initialItems: FridgeItem[] = [
  {
    id: '1',
    name: '蓝莓酸奶',
    category: 'dessert',
    status: 'active',
    expireAt: '今天',
    quantity: 2,
    quantityUnit: '杯',
    note: '冷藏上层',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '西兰花',
    category: 'ingredient',
    status: 'active',
    expireAt: '1 天后',
    quantity: 1,
    quantityUnit: '颗',
    note: '需要优先做掉',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

declare global {
  var __electronicFridgeItems__: FridgeItem[] | undefined;
}

function getItemsStore() {
  if (!globalThis.__electronicFridgeItems__) {
    globalThis.__electronicFridgeItems__ = [...initialItems];
  }

  return globalThis.__electronicFridgeItems__;
}

function setItemsStore(nextItems: FridgeItem[]) {
  globalThis.__electronicFridgeItems__ = nextItems;
}

export function listItems() {
  return getItemsStore();
}

export function createItem(input: CreateItemInput) {
  const now = new Date().toISOString();
  const item: FridgeItem = {
    id: `${Date.now()}`,
    name: input.name.trim(),
    category: input.category,
    status: 'active',
    expireAt: input.expireAt?.trim() || undefined,
    quantity: input.quantity,
    quantityUnit: input.quantityUnit?.trim() || undefined,
    note: input.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  setItemsStore([item, ...getItemsStore()]);
  return item;
}

export function deleteItem(id: string) {
  const currentItems = getItemsStore();
  const existed = currentItems.some((item) => item.id === id);
  setItemsStore(currentItems.filter((item) => item.id !== id));
  return existed;
}
