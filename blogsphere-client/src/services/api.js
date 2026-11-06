import { getToken } from './tokenStorage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

/**
 * Universal API fetch client
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends cookies
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Request failed');
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    // Network or server offline error
    const netErr = new Error(
      'Unable to connect to the server. Please ensure the backend is running.'
    );
    netErr.isNetworkError = true;
    throw netErr;
  }
}

// Authentication API methods
export const authApi = {
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // credentials: { email, password, remember }
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // credential: the Google ID token from Google Identity Services
  googleSignIn: (credential, remember) =>
    apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, remember }),
    }),

  getMe: () =>
    apiRequest('/auth/me', {
      method: 'GET',
    }),

  verifyEmail: (token) =>
    apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Is this reset link still valid? (rejects with a message when it is used or expired)
  checkResetToken: (token) =>
    apiRequest(`/auth/reset-password/${encodeURIComponent(token)}`, { method: 'GET' }),

  resetPassword: (token, password) =>
    apiRequest(`/auth/reset-password/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  updateProfile: (profileData) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),
};

// Builds "?a=1&b=2" from an object, skipping empty values
const toQuery = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const query = new URLSearchParams(clean).toString();
  return query ? `?${query}` : '';
};

// Article API methods
export const articleApi = {
  // params: { category, tag, search, author, featured, sort: latest|trending|oldest, page, limit }
  getArticles: (params = {}) =>
    apiRequest(`/articles${toQuery(params)}`, { method: 'GET' }),

  getTrending: (params = {}) =>
    apiRequest(`/articles/trending${toQuery(params)}`, { method: 'GET' }),

  getFeatured: (params = {}) =>
    apiRequest(`/articles/featured${toQuery(params)}`, { method: 'GET' }),

  getArticleBySlug: (slug) =>
    apiRequest(`/articles/${encodeURIComponent(slug)}`, { method: 'GET' }),

  createArticle: (articleData) =>
    apiRequest('/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    }),

  updateArticle: (id, articleData) =>
    apiRequest(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    }),

  deleteArticle: (id) =>
    apiRequest(`/articles/${id}`, {
      method: 'DELETE',
    }),

  getMyArticles: () =>
    apiRequest('/articles/me/mine', { method: 'GET' }),
};

// Category API methods
export const categoryApi = {
  getCategories: () => apiRequest('/categories', { method: 'GET' }),

  getCategory: (slug) =>
    apiRequest(`/categories/${encodeURIComponent(slug)}`, { method: 'GET' }),
};

// Writer API methods
export const writerApi = {
  getWriters: (params = {}) =>
    apiRequest(`/writers${toQuery(params)}`, { method: 'GET' }),

  // Returns { writer, articles }
  getWriter: (username) =>
    apiRequest(`/writers/${encodeURIComponent(username)}`, { method: 'GET' }),
};

// Contact form
export const contactApi = {
  // payload: { name, email, subject, message }
  send: (payload) =>
    apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
