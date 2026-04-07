import { FridgeItem } from '@/src/types/item';

export const fridgeItems: FridgeItem[] = [
  {
    id: '1',
    name: '蓝莓酸奶',
    category: 'dessert',
    storageSpace: 'chilled',
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
    storageSpace: 'chilled',
    status: 'active',
    expireAt: '1 天后',
    quantity: 1,
    quantityUnit: '颗',
    note: '需要优先做掉',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    name: '昨晚剩米饭',
    category: 'leftover',
    storageSpace: 'chilled',
    status: 'active',
    expireAt: '今晚前',
    quantity: 1,
    quantityUnit: '盒',
    note: '建议做炒饭',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    name: '棒冰',
    category: 'snack',
    storageSpace: 'frozen',
    status: 'active',
    expireAt: '7 天后',
    quantity: 4,
    quantityUnit: '支',
    note: '冷冻区',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

export const todayTasks = [
  {
    id: 'task-1',
    title: '今天优先吃掉剩米饭',
    description: '剩菜剩饭建议 24 小时内处理',
    tone: 'warning',
  },
  {
    id: 'task-2',
    title: '蓝莓酸奶今天到期',
    description: '还剩 2 杯，适合当下午加餐',
    tone: 'danger',
  },
  {
    id: 'task-3',
    title: '西兰花适合今晚做掉',
    description: '可以搭配鸡蛋或牛肉快速出餐',
    tone: 'success',
  },
] as const;

export const notifications = [
  {
    id: 'notice-1',
    title: '蓝莓酸奶今天到期',
    time: '10:30',
    type: '临期提醒',
  },
  {
    id: 'notice-2',
    title: '昨晚剩米饭今晚前建议吃掉',
    time: '09:00',
    type: '剩菜提醒',
  },
  {
    id: 'notice-3',
    title: '西兰花 1 天后到期',
    time: '昨天',
    type: '库存提醒',
  },
] as const;

export const profileMenus = [
  '家庭成员管理',
  '提醒偏好设置',
  '存储区域管理',
  '意见反馈',
  '关于电子冰箱',
] as const;
