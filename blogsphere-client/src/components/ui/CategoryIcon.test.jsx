import React from 'react';
import { render } from '@testing-library/react';
import CategoryIcon, { getCategoryIcon, categoryIcons, FALLBACK_ICON } from './CategoryIcon';

test('maps icon keys to Lucide components', () => {
  expect(getCategoryIcon('cpu')).toBe(categoryIcons.cpu);
  expect(getCategoryIcon('flask-conical')).toBe(categoryIcons['flask-conical']);
});

test('maps legacy emoji and unknown values to a sensible icon', () => {
  expect(getCategoryIcon('💻')).toBe(categoryIcons.cpu);
  expect(getCategoryIcon('🦄')).toBe(FALLBACK_ICON);
  expect(getCategoryIcon(undefined)).toBe(FALLBACK_ICON);
});

test('renders an svg, never the raw emoji', () => {
  const { container } = render(<CategoryIcon icon="🍳" />);
  expect(container.querySelector('svg')).not.toBeNull();
  expect(container.textContent).toBe('');
});
