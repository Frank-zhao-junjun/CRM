/**
 * Safe date formatting utilities that handle invalid dates gracefully.
 * Prevents RangeError: Invalid time value when date-fns format() receives bad input.
 */

import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * Safely format a date value. Returns fallback string if date is invalid.
 * @param dateValue - Date string, Date object, or null/undefined
 * @param fmt - date-fns format string
 * @param fallback - string to return when date is invalid (default: '-')
 */
export function safeFormat(
  dateValue: string | Date | null | undefined,
  fmt: string,
  fallback: string = '-'
): string {
  if (!dateValue) return fallback;
  const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
  if (!isValid(date)) return fallback;
  try {
    return format(date, fmt, { locale: zhCN });
  } catch {
    return fallback;
  }
}

/**
 * Safely format a date with relative time (e.g., "3天前").
 */
export function safeFormatDistance(
  dateValue: string | Date | null | undefined,
  fallback: string = '-'
): string {
  if (!dateValue) return fallback;
  const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
  if (!isValid(date)) return fallback;
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  } catch {
    return fallback;
  }
}
