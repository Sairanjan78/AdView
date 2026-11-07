/**
 * Brand Configuration
 * Change these values to rebrand the platform without touching components.
 */
const brand = {
  name: 'BlogSphere Mag',
  tagline: 'Where Ideas Find Their World',
  description:
    'A global multi-niche publishing platform connecting writers and readers across every topic under the sun.',
  // Public address of the site on your own domain (set REACT_APP_SITE_URL before building).
  // Used for canonical links and Open Graph URLs; falls back to the current origin.
  url: (process.env.REACT_APP_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')).replace(/\/+$/, ''),
  // Public contact address shown on Contact / Privacy / Terms pages
  email: process.env.REACT_APP_CONTACT_EMAIL || 'sairanjanbiswal123@gmail.com',
  // Date the legal pages (Privacy, Terms, Cookies) were last reviewed - update when you edit them
  legalLastUpdated: 'November 6, 2026',
  // Your own social profiles. Icons only appear in the footer for the ones you set.
  social: {
    twitter: process.env.REACT_APP_SOCIAL_TWITTER || '',
    instagram: process.env.REACT_APP_SOCIAL_INSTAGRAM || '',
    linkedin: process.env.REACT_APP_SOCIAL_LINKEDIN || 'https://www.linkedin.com/in/sairanjan-biswal/',
  },
  // Revenue sharing — configurable by admin in Phase 7
  revenueShare: {
    writerPool: 70,   // % of eligible ad revenue distributed to writers
    platformShare: 30, // % retained by platform
  },
};

export default brand;
