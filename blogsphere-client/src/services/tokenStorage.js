/**
 * Where the sign-in token lives.
 * "Remember me" ticked -> localStorage (survives closing the browser, 30-day token)
 * not ticked           -> sessionStorage (cleared when the browser/tab session ends, 1-day token)
 * Storage access is wrapped because some browsers block it (private mode, disabled cookies).
 */
export const TOKEN_KEY = 'token';

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch (err) {
    return fallback;
  }
};

export const getToken = () =>
  safe(() => window.localStorage.getItem(TOKEN_KEY)) ||
  safe(() => window.sessionStorage.getItem(TOKEN_KEY)) ||
  null;

export const clearToken = () => {
  safe(() => window.localStorage.removeItem(TOKEN_KEY));
  safe(() => window.sessionStorage.removeItem(TOKEN_KEY));
};

export const setToken = (token, remember = false) => {
  clearToken();
  if (!token) return;
  const store = remember ? window.localStorage : window.sessionStorage;
  safe(() => store.setItem(TOKEN_KEY, token));
};
