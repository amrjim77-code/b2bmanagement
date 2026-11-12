import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '৳ 0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `${isNegative ? '-' : ''}৳ ${formatted}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Light theme high-contrast status styles
export function getDeliveryBadgeClass(status: string): string {
  if (status === 'Delivered') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold';
  }
  return 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold';
}

export function getPaymentBadgeClass(status: string): string {
  switch (status) {
    case 'Settled':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
    case 'Partial':
      return 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold';
    case 'Unpaid':
    default:
      return 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold';
  }
}
