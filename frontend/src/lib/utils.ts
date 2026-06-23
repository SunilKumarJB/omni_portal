import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names, resolving Tailwind conflicts (last wins).
 * @param  {...any} inputs
 * @returns {string}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
