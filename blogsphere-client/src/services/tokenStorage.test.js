import { getToken, setToken, clearToken, TOKEN_KEY } from './tokenStorage';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test('remember me keeps the token in localStorage', () => {
  setToken('long-lived', true);
  expect(window.localStorage.getItem(TOKEN_KEY)).toBe('long-lived');
  expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  expect(getToken()).toBe('long-lived');
});

test('without remember me the token goes to sessionStorage', () => {
  setToken('short-lived', false);
  expect(window.sessionStorage.getItem(TOKEN_KEY)).toBe('short-lived');
  expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  expect(getToken()).toBe('short-lived');
});

test('signing in again replaces the token held in the other storage', () => {
  setToken('first', true);
  setToken('second', false);
  expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  expect(getToken()).toBe('second');
});

test('clearToken removes the token from both storages', () => {
  window.localStorage.setItem(TOKEN_KEY, 'a');
  window.sessionStorage.setItem(TOKEN_KEY, 'b');
  clearToken();
  expect(getToken()).toBeNull();
});
