import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import GoogleSignInButton, { isGoogleSignInEnabled } from './GoogleSignInButton';

test('renders nothing and loads no script when REACT_APP_GOOGLE_CLIENT_ID is not set', () => {
  delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const { container } = render(<GoogleSignInButton onCredential={() => {}} />);
  expect(isGoogleSignInEnabled()).toBe(false);
  expect(container).toBeEmptyDOMElement();
  expect(document.querySelector('script[src*="accounts.google.com"]')).toBeNull();
});
