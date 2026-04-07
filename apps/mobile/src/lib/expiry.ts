import { FridgeItem } from '@/src/types/item';

export interface InventoryNotice {
  id: string;
  itemId: string;
  type: '临期提醒' | '过期提醒' | '剩菜提醒';
  title: string;
  time: string;
  tone: 'warning' | 'danger' | 'success';
}

export interface InventoryTask {
  id: string;
  itemId: string;
  title: string;
  description: string;
  tone: 'warning' | 'danger' | 'success';
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseExpiresOn(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfDay(date);
}

export function formatExpireLabel(expiresOn?: string, fallback?: string) {
  const date = parseExpiresOn(expiresOn);

  if (!date) {
    return fallback;
  }

  const today = startOfDay(new Date());
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (diffDays <= 0) {
    return '今天';
  }

  if (diffDays === 1) {
    return '明天';
  }

  return `${diffDays} 天后`;
}

export function getExpirePriority(item: FridgeItem) {
  const date = parseExpiresOn(item.expiresOn);

  if (!date) {
    return Number.MAX_SAFE_INTEGER;
  }

  const today = startOfDay(new Date());
  return Math.max(0, Math.round((date.getTime() - today.getTime()) / 86400000));
}

export function getDaysUntilExpiration(item: FridgeItem) {
  const date = parseExpiresOn(item.expiresOn);

  if (!date) {
    return null;
  }

  const today = startOfDay(new Date());
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export function isUrgentItem(item: FridgeItem) {
  const days = getDaysUntilExpiration(item);
  return days !== null && days === 0;
}

export function buildInventoryNotices(items: FridgeItem[]): InventoryNotice[] {
  return items
    .filter((item) => item.status === 'active')
    .flatMap((item) => {
      const notices: InventoryNotice[] = [];
      const daysUntilExpiration = getDaysUntilExpiration(item);
      const quantityText = item.quantity ? `，还剩 ${item.quantity}${item.quantityUnit ?? ''}` : '';

      if (daysUntilExpiration !== null && daysUntilExpiration < 0) {
        notices.push({
          id: `${item.id}-expired`,
          itemId: item.id,
          type: '过期提醒',
          title: `${item.name} 已过期，建议尽快处理${quantityText}`,
          time: '已过期',
          tone: 'danger',
        });
      } else if (daysUntilExpiration === 0) {
        notices.push({
          id: `${item.id}-today`,
          itemId: item.id,
          type: '临期提醒',
          title: `${item.name} 今天到期${quantityText}`,
          time: '今天',
          tone: 'danger',
        });
      } else if (daysUntilExpiration === 1) {
        notices.push({
          id: `${item.id}-tomorrow`,
          itemId: item.id,
          type: '临期提醒',
          title: `${item.name} 明天到期${quantityText}`,
          time: '明天',
          tone: 'warning',
        });
      }

      if (item.category === 'leftover') {
        notices.push({
          id: `${item.id}-leftover`,
          itemId: item.id,
          type: '剩菜提醒',
          title: `${item.name} 建议优先处理${quantityText}`,
          time: item.expireAt ?? '尽快',
          tone: 'success',
        });
      }

      return notices;
    })
    .sort((left, right) => {
      const toneRank = { danger: 0, warning: 1, success: 2 };
      return toneRank[left.tone] - toneRank[right.tone];
    });
}

export function buildInventoryTasks(items: FridgeItem[]): InventoryTask[] {
  return items
    .filter((item) => item.status === 'active')
    .flatMap((item) => {
      const tasks: InventoryTask[] = [];
      const daysUntilExpiration = getDaysUntilExpiration(item);
      const quantityText = item.quantity ? `还剩 ${item.quantity}${item.quantityUnit ?? ''}` : '建议尽快确认份量';

      if (item.category === 'leftover') {
        tasks.push({
          id: `${item.id}-leftover-task`,
          itemId: item.id,
          title: `今天优先处理${item.name}`,
          description: `${quantityText}，剩菜建议优先吃完或及时处理`,
          tone: 'warning',
        });
      }

      if (daysUntilExpiration !== null && daysUntilExpiration <= 0) {
        tasks.push({
          id: `${item.id}-today-task`,
          itemId: item.id,
          title: `${item.name} 今天到期`,
          description: `${quantityText}，适合优先安排今天处理`,
          tone: 'danger',
        });
      } else if (daysUntilExpiration === 1) {
        tasks.push({
          id: `${item.id}-tomorrow-task`,
          itemId: item.id,
          title: `${item.name} 适合今晚先做掉`,
          description: `${quantityText}，明天到期，建议提前安排`,
          tone: 'success',
        });
      }

      return tasks;
    })
    .sort((left, right) => {
      const toneRank = { danger: 0, warning: 1, success: 2 };
      return toneRank[left.tone] - toneRank[right.tone];
    })
    .slice(0, 3);
}
