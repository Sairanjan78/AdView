import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Seo from './components/seo/Seo';
import AdSenseHead from './components/ads/AdSenseHead';
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
const WritePage           = lazy(() => import('./pages/writer/WritePage'));
const RegisterPage        = lazy(() => import('./pages/auth/RegisterPage'));
const LoginPage           = lazy(() => import('./pages/auth/LoginPage'));
const PrivacyPolicyPage   = lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const TermsPage           = lazy(() => import('./pages/legal/TermsPage'));
const CookiePolicyPage    = lazy(() => import('./pages/legal/CookiePolicyPage'));
const ContactPage         = lazy(() => import('./pages/legal/ContactPage'));
const AdvertisingDisclosurePage = lazy(() => import('./pages/legal/AdvertisingDisclosurePage'));
const MonetizationPolicyPage    = lazy(() => import('./pages/legal/MonetizationPolicyPage'));

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
    <Seo title="Page not found" noindex />
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
          <AdSenseHead />
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
                  <Route path="/write"               element={<WritePage />} />

                  {/* Policy & contact pages (required for Google AdSense review) */}
                  <Route path="/contact"             element={<ContactPage />} />
                  <Route path="/privacy-policy"      element={<PrivacyPolicyPage />} />
                  <Route path="/privacy"             element={<Navigate to="/privacy-policy" replace />} />
                  <Route path="/terms"               element={<TermsPage />} />
                  <Route path="/cookie-policy"       element={<CookiePolicyPage />} />
                  <Route path="/advertising-disclosure"     element={<AdvertisingDisclosurePage />} />
                  <Route path="/writer-monetization-policy" element={<MonetizationPolicyPage />} />

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
