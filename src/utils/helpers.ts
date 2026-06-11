import { Currency } from '../types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatCurrency(
  amount: number,
  currency?: Pick<Currency, 'symbol' | 'locale'>,
): string {
  const sym = currency?.symbol ?? '₹';
  const loc = currency?.locale ?? 'en-IN';
  try {
    return `${sym}${amount.toLocaleString(loc, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch {
    return `${sym}${amount.toFixed(2)}`;
  }
}

export function fileTotal(expenses: { amount: number }[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  const date = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${date}, ${time}`;
}

export function timeAgo(isoString: string): string {
  const days = Math.floor((Date.now() - new Date(isoString).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(isoString);
}
