/**
 * Prerenders every published article to build/article/<slug>.html at build time, so crawlers that
 * don't run JavaScript see the title, description, canonical link, Open Graph tags and the full
 * article text instead of an empty <div id="root">. Cloudflare Pages (and Netlify) serve
 * build/article/<slug>.html at /article/<slug>, the same way build/about.html is served at /about.
 *
 * People get the normal React app: an inline script hides the static copy as soon as JavaScript runs
 * (so it never flashes or shifts the layout) and React renders the live article over it.
 *
 * Best effort only: if the API is asleep or unreachable the step is skipped and the build still passes.
 * Called from scripts/postbuild-seo.js. Can also be run on its own: node scripts/prerender-articles.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build');

const DEFAULT_API = 'https://blogsphere-api-odr7.onrender.com/api/v1';
const SITE_NAME = 'BlogSphere Mag';
const PAGE_LIMIT = 50; // the API caps limit at 50
const MAX_PAGES = 40;

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s = '', n = 160) => {
  const t = String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
// Same rule as the app and functions/_middleware.js: brand appended only while under 60 characters
const buildTitle = (title) => {
  const withBrand = `${title} | ${SITE_NAME}`;
  return withBrand.length < 60 ? withBrand : title;
};
// Strip scripts, styles and inline handlers from stored article HTML (the API also sanitizes on save)
const safeHtml = (html = '') => String(html)
  .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript:/gi, '')
  // Reserve a 16:9 box for any <img> lacking dimensions so the static copy
  // does not shift layout before the React app takes over.
  .replace(/<img\b([^>]*)>/gi, (full, attrs) =>
    (/\bwidth\s*=/.test(attrs) && /\bheight\s*=/.test(attrs)) ? full : `<img width="960" height="540"${attrs}>`);
const jsonLd = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const isoDate = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toISOString() : undefined;
};

const getJson = async (url, timeoutMs, attempts = 2) => {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json', 'x-prerender': '1' } });
      if (res.ok) return await res.json();
    } catch (e) { /* retry below */ }
    if (i < attempts) await new Promise(r => setTimeout(r, 3000));
  }
  return null;
};

const fetchPublished = async (api, log) => {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // The first call may wake a sleeping Render instance, so give it longer
    const data = await getJson(`${api}/articles?limit=${PAGE_LIMIT}&page=${page}`, page === 1 ? 60000 : 30000);
    if (!data || !data.data) {
      if (page === 1) return null;
      log(`[prerender-articles] Page ${page} failed, keeping the ${all.length} articles fetched so far.`);
      break;
    }
    const list = data.data.articles || [];
    all.push(...list);
    const pages = (data.data.pagination && data.data.pagination.pages) || 1;
    if (page >= pages || !list.length) break;
  }
  return all.filter(a => a && (!a.status || a.status === 'published') && /^[a-z0-9-]{1,200}$/.test(a.slug || ''));
};

// Serialize data safely inside a <script type="application/json"> tag. Escaping '<'
// prevents stored article HTML from closing the tag early (script-injection safety).
const jsonForScript = (obj) => JSON.stringify(obj)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const headTags = (a, site) => {
  const pageUrl = `${site}/article/${a.slug}`;
  const title = buildTitle(a.seoTitle || a.title);
  const description = clip(a.excerpt || a.content);
  const author = a.author || {};
  const published = isoDate(a.publishedAt || a.createdAt);
  const modified = isoDate(a.updatedAt) || published;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description,
    image: a.coverImage ? [a.coverImage] : undefined,
    datePublished: published,
    dateModified: modified,
    author: author.name ? {
      '@type': 'Person',
      name: author.name,
      url: author.username ? `${site}/writer/${author.username}` : undefined,
    } : undefined,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: `${site}/`, logo: { '@type': 'ImageObject', url: `${site}/logo512.png` } },
    mainEntityOfPage: pageUrl,
    inLanguage: 'en-US',
    keywords: (a.tags || []).length ? a.tags.join(', ') : undefined,
  };
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}"/>`,
    `<link rel="canonical" href="${esc(pageUrl)}"/>`,
    '<meta property="og:type" content="article"/>',
    `<meta property="og:site_name" content="${SITE_NAME}"/>`,
    `<meta property="og:title" content="${esc(a.seoTitle || a.title)}"/>`,
    `<meta property="og:description" content="${esc(description)}"/>`,
    `<meta property="og:url" content="${esc(pageUrl)}"/>`,
    a.coverImage ? `<meta property="og:image" content="${esc(a.coverImage)}"/>` : '',
    published ? `<meta property="article:published_time" content="${published}"/>` : '',
    modified ? `<meta property="article:modified_time" content="${modified}"/>` : '',
    `<meta name="twitter:card" content="${a.coverImage ? 'summary_large_image' : 'summary'}"/>`,
    `<meta name="twitter:title" content="${esc(a.seoTitle || a.title)}"/>`,
    `<meta name="twitter:description" content="${esc(description)}"/>`,
    a.coverImage ? `<meta name="twitter:image" content="${esc(a.coverImage)}"/>` : '',
    `<script type="application/ld+json">${jsonLd(ld)}</script>`,
    // Seed React with the article so it renders the full page on first paint
    // instead of showing a spinner then growing (a measured CLS and LCP cause).
    `<script id="__PRERENDERED_ARTICLE__" type="application/json">${jsonForScript(a)}</script>`,
    // Hide the static copy for people (JavaScript on); React renders the live article instead
    '<script>document.documentElement.classList.add("js")</script>',
    '<style>.js .prerendered{display:none}</style>',
  ].filter(Boolean);
};

const bodyHtml = (a, related = []) => {
  const author = a.author || {};
  const published = isoDate(a.publishedAt || a.createdAt);
  const modified = isoDate(a.updatedAt);
  // Match the React page: surface a recent date in the crawler-facing copy too.
  // Show "Updated" only when it is meaningfully later than publication, so the
  // static HTML does not advertise a fake freshness signal.
  const showUpdated = published && modified && new Date(modified) - new Date(published) > 86400000;
  const dates = [
    published ? `<time datetime="${published}">${new Date(published).toDateString()}</time>` : '',
    showUpdated ? `Updated <time datetime="${modified}">${new Date(modified).toDateString()}</time>` : '',
  ].filter(Boolean).join(' · ');
  const byline = author.name
    ? `By ${author.username ? `<a href="/writer/${esc(author.username)}" rel="author">${esc(author.name)}</a>` : esc(author.name)}`
    : '';
  return [
    '<div class="prerendered">',
    `<header><p><a href="/">${SITE_NAME}</a></p><nav><a href="/latest">Latest</a> · <a href="/categories">Categories</a> · <a href="/about">About</a></nav></header>`,
    '<main><article><header>',
    a.category ? `<p><a href="/categories/${esc(a.category)}">${esc(String(a.category).replace(/-/g, ' '))}</a></p>` : '',
    `<h1>${esc(a.title)}</h1>`,
    a.excerpt ? `<p>${esc(a.excerpt)}</p>` : '',
    `<p>${byline}${dates ? ` · ${dates}` : ''}</p>`,
    a.coverImage ? `<img src="${esc(a.coverImage)}" alt="${esc(a.title)}" width="1600" height="900">` : '',
    '</header>',
    safeHtml(a.content),
    '</article></main>',
    related.length ? `<nav class="prerendered-related" aria-label="More articles"><h2>More articles</h2><ul>${related.map(r => `<li><a href="/article/${esc(r.slug)}">${esc(r.title)}</a></li>`).join('')}</ul></nav>` : '',
    '<footer><nav><a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms</a> · <a href="/cookie-policy">Cookie Policy</a> · <a href="/advertising-disclosure">Advertising Disclosure</a> · <a href="/writer-monetization-policy">Writer Monetization Policy</a></nav></footer>',
    '</div>',
  ].join('');
};

const injectHead = (shell, tags) => shell
  .replace(/<title>[\s\S]*?<\/title>/i, '')
  .replace(/<meta[^>]+(name="description"|name="robots"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, '')
  .replace(/<link[^>]+rel="canonical"[^>]*>/gi, '')
  .replace('</head>', () => `${tags.join('')}</head>`);

async function prerenderArticles({ log = console.log } = {}) {
  const shellPath = path.join(buildDir, 'index.html');
  if (!fs.existsSync(shellPath)) {
    log('[prerender-articles] No build/index.html, skipping.');
    return [];
  }
  if (typeof fetch !== 'function' || typeof AbortSignal === 'undefined' || !AbortSignal.timeout) {
    log('[prerender-articles] This Node version has no fetch, skipping.');
    return [];
  }
  const api = (process.env.PRERENDER_API_URL || process.env.REACT_APP_API_URL || DEFAULT_API).replace(/\/+$/, '');
  if (/localhost|127\.0\.0\.1/.test(api)) {
    log(`[prerender-articles] API is local (${api}), skipping.`);
    return [];
  }
  const site = (process.env.REACT_APP_SITE_URL || 'https://blogspheremag.com').replace(/\/+$/, '');

  const articles = await fetchPublished(api, log);
  if (!articles) {
    log('[prerender-articles] API unreachable, skipping (articles stay client-rendered; the edge middleware still serves crawlers).');
    return [];
  }

  const shell = fs.readFileSync(shellPath, 'utf8');
  const outDir = path.join(buildDir, 'article');
  fs.mkdirSync(outDir, { recursive: true });
  const written = [];
  articles.forEach((a) => {
    try {
      const cat = (a.category && typeof a.category === 'object') ? a.category.slug : a.category;
      const related = articles.filter(r => r.slug !== a.slug &&
        ((r.category && typeof r.category === 'object') ? r.category.slug : r.category) === cat).slice(0, 4);
      const html = injectHead(shell, headTags(a, site))
        .replace(/<div id="root"><\/div>/, () => `<div id="root">${bodyHtml(a, related)}</div>`);
      const out = path.join(outDir, `${a.slug}.html`);
      fs.writeFileSync(out, html);
      written.push(out);
    } catch (e) {
      log(`[prerender-articles] Skipped ${a.slug}: ${e.message}`);
    }
  });
  log(`[prerender-articles] Wrote ${written.length} article page(s) to build/article/.`);
  return written;
}

module.exports = prerenderArticles;

if (require.main === module) {
  prerenderArticles().catch((e) => console.warn(`[prerender-articles] Skipped: ${e.message}`));
}
