import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

const SCRIPT = 'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';

import AdSlot from './AdSlot';

const loadAdSlot = (env) => {
  Object.assign(process.env, env);
  return AdSlot;
};

afterEach(() => {
  delete process.env.REACT_APP_ADSENSE_CLIENT;
  document.head.querySelectorAll(SCRIPT).forEach(s => s.remove());
  delete window.adsbygoogle;
});

test('renders nothing and loads no script when REACT_APP_ADSENSE_CLIENT is not set', () => {
  const Ad = loadAdSlot({ REACT_APP_ADSENSE_CLIENT: '' });
  const { container } = render(<Ad slot="1234567890" />);
  expect(container).toBeEmptyDOMElement();
  expect(document.head.querySelector(SCRIPT)).toBeNull();
});

test('renders nothing for an invalid publisher id', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const Ad = loadAdSlot({ REACT_APP_ADSENSE_CLIENT: 'pub-123' });
  const { container } = render(<Ad slot="1234567890" />);
  expect(container).toBeEmptyDOMElement();
  warn.mockRestore();
});

test('renders an AdSense unit and loads adsbygoogle.js once when configured', () => {
  const Ad = loadAdSlot({ REACT_APP_ADSENSE_CLIENT: 'ca-pub-1234567890123456' });
  const { container } = render(
    <>
      <Ad slot="1111111111" />
      <Ad slot="2222222222" />
    </>
  );
  const units = container.querySelectorAll('ins.adsbygoogle');
  expect(units).toHaveLength(2);
  expect(units[0]).toHaveAttribute('data-ad-client', 'ca-pub-1234567890123456');
  expect(units[0]).toHaveAttribute('data-ad-slot', '1111111111');
  const scripts = document.head.querySelectorAll(SCRIPT);
  expect(scripts).toHaveLength(1);
  expect(scripts[0].src).toContain('client=ca-pub-1234567890123456');
  expect(window.adsbygoogle).toHaveLength(2); // one push per unit
});

test('renders nothing without a slot id even when the client is set', () => {
  const Ad = loadAdSlot({ REACT_APP_ADSENSE_CLIENT: 'ca-pub-1234567890123456' });
  const { container } = render(<Ad slot="" />);
  expect(container).toBeEmptyDOMElement();
});
