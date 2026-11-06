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
const sitemapUrl = (process.env.REACT_APP_SITEMAP_URL || '').trim() || sitemapFromApi();
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

// ads.txt -> Google line
const client = (process.env.REACT_APP_ADSENSE_CLIENT || '').trim();
const adsPath = path.join(buildDir, 'ads.txt');
if (/^ca-pub-\d{10,20}$/.test(client) && fs.existsSync(adsPath)) {
  const ads = fs.readFileSync(adsPath, 'utf8');
  const hasEntries = ads.split('\n').some(line => line.trim() && !line.trim().startsWith('#'));
  if (!hasEntries) {
    const publisher = client.replace(/^ca-/, '');
    fs.writeFileSync(adsPath, `${ads.trimEnd()}\ngoogle.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`);
    console.log(`[postbuild-seo] ads.txt -> google.com, ${publisher}, DIRECT, f08c47fec0942fa0`);
  }
} else {
  console.log('[postbuild-seo] ads.txt left as template (REACT_APP_ADSENSE_CLIENT not set).');
}
