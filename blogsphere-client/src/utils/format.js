import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

/** 950 -> "950", 1234 -> "1.2k", 1500000 -> "1.5M" */
export function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  return String(v);
}

/** Recent dates read as "3 days ago", older ones as "Nov 6, 2026". */
export function formatPublished(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return Math.abs(differenceInDays(new Date(), d)) < 7
    ? formatDistanceToNow(d, { addSuffix: true })
    : format(d, 'MMM d, yyyy');
}

export function toIsoDate(date) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
