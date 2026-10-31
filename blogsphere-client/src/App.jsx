import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import './styles/index.css';

// Lazy-load pages for code splitting
const HomePage            = lazy(() => import('./pages/public/HomePage'));
const ExplorePage         = lazy(() => import('./pages/public/ExplorePage'));
const TrendingPage        = lazy(() => import('./pages/public/TrendingPage'));
const LatestPage          = lazy(() => import('./pages/public/LatestPage'));
const CategoriesPage      = lazy(() => import('./pages/public/CategoriesPage'));
const SearchPage          = lazy(() => import('./pages/public/SearchPage'));
const ArticleDetailPage   = lazy(() => import('./pages/public/ArticleDetailPage'));
const WriterProfilePage   = lazy(() => import('./pages/public/WriterProfilePage'));
const AboutPage           = lazy(() => import('./pages/public/AboutPage'));
const RegisterPage        = lazy(() => import('./pages/auth/RegisterPage'));
const LoginPage           = lazy(() => import('./pages/auth/LoginPage'));

/**
 * PageLoader — shown while lazy chunks are loading.
 * Replace with a proper skeleton in a future phase.
 */
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', color: 'var(--text-muted)', fontSize: '14px',
    flexDirection: 'column', gap: '16px',
  }}>
    <span style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>✦</span>
    Loading…
  </div>
);

/**
 * NotFoundPage — catch-all 404.
 */
const NotFoundPage = () => (
  <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
    <div style={{ fontSize: '5rem', marginBottom: '24px' }}>404</div>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
      Page not found
    </h1>
    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <a href="/" style={{ color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>
      ← Back to home
    </a>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="page-wrapper">
            <Navbar />
            <main className="page-content" id="main-content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/"                    element={<HomePage />} />
                  <Route path="/explore"             element={<ExplorePage />} />
                  <Route path="/trending"            element={<TrendingPage />} />
                  <Route path="/latest"              element={<LatestPage />} />
                  <Route path="/categories"          element={<CategoriesPage />} />
                  <Route path="/categories/:slug"    element={<ExplorePage />} />
                  <Route path="/search"              element={<SearchPage />} />
                  <Route path="/article/:slug"       element={<ArticleDetailPage />} />
                  <Route path="/writer/:username"    element={<WriterProfilePage />} />
                  <Route path="/about"               element={<AboutPage />} />

                  {/* Auth routes */}
                  <Route path="/register"            element={<RegisterPage />} />
                  <Route path="/login"               element={<LoginPage />} />

                  {/* 404 */}
                  <Route path="*"                    element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
