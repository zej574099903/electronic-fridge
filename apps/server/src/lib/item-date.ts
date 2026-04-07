function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseExpiresOnInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfDay(date);
}

export function formatExpireLabel(expiresOn?: Date | string | null) {
  if (!expiresOn) {
    return undefined;
  }

  const date = typeof expiresOn === 'string' ? new Date(expiresOn) : expiresOn;

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays <= 0) {
    return '今天';
  }

  if (diffDays === 1) {
    return '明天';
  }

  return `${diffDays} 天后`;
}
