import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化货币
export function formatCurrency(amount: number, currency: string = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// 格式化百分比
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// 格式化日期
export function formatDate(date: Date | string, format: string = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'short') {
    return d.toLocaleDateString('zh-CN');
  }
  if (format === 'long') {
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('zh-CN');
}

// PAYMENT_STATUS_CONFIG - 回款状态配置
export const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: '待回款',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  partial: {
    label: '部分回款',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  completed: {
    label: '已回款',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  overdue: {
    label: '逾期',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    bgColor: 'bg-red-50',
  },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS_CONFIG;
