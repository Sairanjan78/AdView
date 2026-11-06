import { formatCount, formatPublished } from './format';

test('formatCount abbreviates large numbers', () => {
  expect(formatCount(0)).toBe('0');
  expect(formatCount(950)).toBe('950');
  expect(formatCount(1000)).toBe('1k');
  expect(formatCount(87400)).toBe('87.4k');
  expect(formatCount(1500000)).toBe('1.5M');
});

test('formatPublished uses a calendar date for older posts', () => {
  expect(formatPublished('2025-11-15T09:00:00Z')).toBe('Nov 15, 2025');
  expect(formatPublished('not a date')).toBe('');
});
