/**
 * Runs automatically after `npm run build` (npm "postbuild" hook).
 * - build/robots.txt: adds the "Sitemap:" line from REACT_APP_SITEMAP_URL, or from the origin of
 *   REACT_APP_API_URL (skipped for localhost).
 * - build/ads.txt: adds the Google line when REACT_APP_ADSENSE_CLIENT is set and ads.txt has no entries.
 * Reads the same .env files Create React App uses for production builds.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Minimal .env reader (KEY=value lines); real environment variables and earlier files win
const loadEnvFile = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  fs.readFileSync(full, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match || line.trim().startsWith('#')) return;
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  });
};
['.env.production.local', '.env.local', '.env.production', '.env'].forEach(loadEnvFile);

const buildDir = path.join(root, 'build');
if (!fs.existsSync(buildDir)) {
  console.log('[postbuild-seo] No build folder, skipping.');
  process.exit(0);
}

// robots.txt -> Sitemap line
const sitemapFromApi = () => {
  try {
    const api = new URL(process.env.REACT_APP_API_URL || '');
    if (['localhost', '127.0.0.1'].includes(api.hostname)) return '';
    return `${api.origin}/sitemap.xml`;
  } catch (e) {
    return '';
  }
};
// Prefer the site's own domain: /sitemap.xml is proxied to the API by public/_redirects.
// Netlify sets URL to the project's main address (the custom domain once it is added).
const sitemapFromSite = () => {
  const site = (process.env.REACT_APP_SITE_URL || process.env.URL || '').trim().replace(/\/+$/, '');
  return /^https:\/\//i.test(site) ? `${site}/sitemap.xml` : '';
};
const sitemapUrl = (process.env.REACT_APP_SITEMAP_URL || '').trim() || sitemapFromSite() || sitemapFromApi();
const robotsPath = path.join(buildDir, 'robots.txt');
if (sitemapUrl && fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8')
    .split('\n')
    .filter(line => !/^#?\s*Sitemap:/i.test(line))
    .join('\n')
    .trimEnd();
  fs.writeFileSync(robotsPath, `${robots}\nSitemap: ${sitemapUrl}\n`);
  console.log(`[postbuild-seo] robots.txt -> Sitemap: ${sitemapUrl}`);
} else {
  console.log('[postbuild-seo] robots.txt: no public sitemap URL configured (set REACT_APP_SITEMAP_URL).');
}

// AdSense account verification + ads.txt.
// No publisher ID is required until the site is added to AdSense. Once configured,
// add the verification meta tag to the actual static HTML so crawlers can see it
// before React or Helmet runs.
const client = (process.env.REACT_APP_ADSENSE_CLIENT || '').trim();
const publisherPattern = /^ca-pub-\\d{10,20}$/;
const htmlPath = path.join(buildDir, 'index.html');
if (client && !publisherPattern.test(client)) {
  throw new Error('[postbuild-seo] REACT_APP_ADSENSE_CLIENT must look like ca-pub- followed by 10–20 digits.');
}
if (client && fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const verificationTag = `<meta name="google-adsense-account" content="${client}">`;
  if (/<meta\\s+name=["']google-adsense-account["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\\s+name=["']google-adsense-account["'][^>]*>/i, verificationTag);
  } else if (/<\\/head>/i.test(html)) {
    html = html.replace(/<\\/head>/i, `  ${verificationTag}\\n</head>`);
  } else {
    throw new Error('[postbuild-seo] Could not find </head> in build/index.html.');
  }
  fs.writeFileSync(htmlPath, html);
  console.log('[postbuild-seo] Added AdSense account verification meta tag to build/index.html.');
} else {
  console.log('[postbuild-seo] AdSense verification skipped (REACT_APP_ADSENSE_CLIENT not set).');
}

// Add the Google seller record without deleting other authorized sellers.
const adsPath = path.join(buildDir, 'ads.txt');
if (client) {
  const publisher = client.replace(/^ca-/, '');
  const googleRecord = `google.com, ${publisher}, DIRECT, f08c47fec0942fa0`;
  const existing = fs.existsSync(adsPath) ? fs.readFileSync(adsPath, 'utf8') : '';
  const records = existing.split(/\\r?\\n/).map(line => line.trim());
  const hasGoogleRecord = records.some(line => line.toLowerCase() === googleRecord.toLowerCase());
  const conflictingGoogleRecord = records.some(line =>
    /^google\\.com\\s*,/i.test(line) && line.toLowerCase() !== googleRecord.toLowerCase()
  );
  if (conflictingGoogleRecord) {
    throw new Error('[postbuild-seo] ads.txt contains a different Google publisher record. Reconcile it manually before building.');
  }
  if (!hasGoogleRecord) {
    fs.writeFileSync(adsPath, `${existing.trimEnd()}\\n${googleRecord}\\n`);
  }
  const finalAds = fs.readFileSync(adsPath, 'utf8');
  if (!finalAds.split(/\\r?\\n/).some(line => line.trim() === googleRecord)) {
    throw new Error('[postbuild-seo] Failed to write the expected Google ads.txt record.');
  }
  console.log(`[postbuild-seo] Verified ads.txt record: ${googleRecord}`);
} else {
  console.log('[postbuild-seo] ads.txt remains a template until REACT_APP_ADSENSE_CLIENT is configured.');
}

// Static pages (About, Contact, policies) -> build/<route>.html with real text for crawlers
try {
  require('./prerender-static')();
} catch (e) {
  console.warn(`[postbuild-seo] Static prerender failed, pages will be served as the empty app shell: ${e.message}`);
}

// Published articles -> build/article/<slug>.html with the full text for crawlers.
// Best effort: an unreachable API only skips this step, it never fails the build.
(async () => {
  try {
    await require('./prerender-articles')();
  } catch (e) {
    console.warn(`[postbuild-seo] Article prerender skipped: ${e.message}`);
  }
})();
