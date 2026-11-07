import React from 'react';
import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import Seo from './Seo';

let mockPathname = '/';
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
}));

const renderAt = (ui, path = '/article/hello-world') => {
  mockPathname = path;
  return render(<HelmetProvider>{ui}</HelmetProvider>);
};

const meta = (selector) => document.head.querySelector(selector)?.getAttribute('content');

test('sets title, description, canonical and Open Graph tags', async () => {
  renderAt(<Seo title="Hello World" description="A <b>short</b> description" image="/cover.jpg" type="article" />);
  await waitFor(() => expect(document.title).toBe('Hello World — BlogSphere Mag'));
  expect(meta('meta[name="description"]')).toBe('A short description');
  const canonical = document.head.querySelector('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe(`${window.location.origin}/article/hello-world`);
  expect(meta('meta[property="og:type"]')).toBe('article');
  expect(meta('meta[property="og:url"]')).toBe(canonical);
  expect(meta('meta[property="og:image"]')).toBe(`${window.location.origin}/cover.jpg`);
  expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
});

test('noindex pages get a robots meta tag', async () => {
  renderAt(<Seo title="Search" noindex />, '/search');
  await waitFor(() => expect(meta('meta[name="robots"]')).toBe('noindex, follow'));
});
