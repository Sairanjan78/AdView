/**
 * Cloudflare Pages middleware (port of netlify/edge-functions/bot-render.js).
 * - www.blogspheremag.com/* gets a 301 to the apex domain (backup for a Cloudflare Redirect Rule).
 * - /sitemap.xml and /llms.txt are proxied from the API so they live on the site's own domain.
 * - Unknown routes (and, for crawlers, unknown articles, writers and categories) return HTTP 404
 *   with noindex instead of a 200 "soft 404". Humans still see the React 404 page.
 * - Crawlers that don't run JavaScript get prerendered HTML for /, /article/:slug,
 *   /categories/:slug and /writer/:username. About, Contact and the policy pages are prerendered
 *   at build time (scripts/prerender-static.js) and served as static files.
 * - API responses are cached at the edge (Cache API): a fresh copy is used for an hour, after that
 *   the last good copy is served at once while a new one is fetched in the background, so a
 *   sleeping API never leaves crawlers with an empty page or a 503 sitemap.
 * Humans get the normal React app untouched.
 */
const DEFAULT_API = 'https://blogsphere-api-odr7.onrender.com/api/v1';
const DEFAULT_SITE = 'https://blogspheremag.com';
let API = DEFAULT_API;
let SITE = DEFAULT_SITE;
const STATIC = /^\/static\/|\.(js|css|png|svg|ico|json|txt|xml|jpg|jpeg|gif|webp|avif|map|woff2?)$/i;
const PROXIED = { '/sitemap.xml': 'application/xml; charset=utf-8', '/llms.txt': 'text/plain; charset=utf-8' };

const SITE_NAME = 'BlogSphere Mag';
// Keep in sync with src/config/brand.js (homeTitle, homeDescription, founder)
const HOME_TITLE = 'BlogSphere Mag: Practical Guides on Tech, Careers and Travel';
const HOME_DESCRIPTION = 'Practical, sourced guides on technology, careers and jobs, education, travel and world affairs, written by named authors and updated when facts change.';
const FOUNDER = { username: 'sairanjan', sameAs: ['https://www.linkedin.com/in/sairanjan-biswal/'] };
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|facebot|embedly|quora link preview|outbrain|pinterest|vkshare|whatsapp|telegram|discord|slack|linkedin|skype|nuzzel|redditbot|applebot|yandex|baiduspider|duckduck|bingpreview|semrush|ahrefs|chatgpt|gptbot|oai-searchbot|perplexity|claude|anthropic|cohere|google-extended|googleother|bytespider|meta-externalagent|amazonbot|ccbot|petalbot|mojeek|mediapartners|inspectiontool|storebot|google-safety/i;

// Routes the React app knows (keep in sync with src/App.jsx). Anything else is a 404.
const KNOWN_ROUTES = new Set([
  '/', '/explore', '/trending', '/latest', '/categories', '/search', '/about', '/write', '/settings/profile',
  '/contact', '/privacy-policy', '/terms', '/cookie-policy', '/advertising-disclosure', '/writer-monetization-policy',
  '/register', '/login', '/forgot-password', '/reset-password',
]);
const KNOWN_PATTERNS = [/^\/article\/[^/]+$/, /^\/categories\/[^/]+$/, /^\/writer\/[^/]+$/, /^\/reset-password\/[^/]+$/];
const isKnownRoute = path => KNOWN_ROUTES.has(path) || KNOWN_PATTERNS.some(re => re.test(path));

const FRESH_SECONDS = 3600;            // use a cached API response without asking the API again
const KEEP_SECONDS = 7 * 24 * 3600;    // keep the last good copy this long for when the API is asleep

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s = '', n = 160) => {
  const t = String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
// Title for search results: the brand is appended with " | " only while it stays under 60 characters
const buildTitle = (title) => {
  const withBrand = `${title} | ${SITE_NAME}`;
  return withBrand.length < 60 ? withBrand : title;
};
// Strip scripts, styles and inline handlers from stored article HTML before echoing it
// (the API also sanitizes on save; this is a second line of defence for older articles)
const safeHtml = (html = '') => String(html)
  .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript:/gi, '');
const wordCount = (html = '') => String(html).replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
const profileLinks = (author = {}) => {
  const links = Object.values(author.socialLinks || {}).filter(u => /^https?:\/\//i.test(u || ''));
  if (author.username === FOUNDER.username) FOUNDER.sameAs.forEach(u => { if (!links.includes(u)) links.push(u); });
  return links;
};

/**
 * Fetch from the API through the edge cache.
 * Returns { status: 200, text } | { status: 404 } | null (API unreachable and nothing cached).
 */
const cachedFetch = async (target, { timeout = 9000, ctx } = {}) => {
  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const key = new Request(target, { method: 'GET' });
  const later = p => { if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else p.catch(() => {}); };

  const refresh = async (ms) => {
    const res = await fetch(target, { signal: AbortSignal.timeout(ms), headers: { 'x-prerender': '1' } });
    if (res.status === 404) {
      if (cache) later(cache.delete(key));
      return { status: 404 };
    }
    if (!res.ok) return null;
    const text = await res.text();
    if (cache) {
      later(cache.put(key, new Response(text, {
        headers: {
          'content-type': res.headers.get('content-type') || 'application/octet-stream',
          'cache-control': `public, max-age=${KEEP_SECONDS}`,
          'x-fetched-at': String(Date.now()),
        },
      })));
    }
    return { status: 200, text };
  };

  let cached = null;
  try { cached = cache ? await cache.match(key) : null; } catch (e) { cached = null; }
  if (cached) {
    const age = (Date.now() - Number(cached.headers.get('x-fetched-at') || 0)) / 1000;
    // Stale: answer now with the last good copy, refresh in the background (stale-while-revalidate)
    if (age >= FRESH_SECONDS) later(refresh(30000));
    return { status: 200, text: await cached.text() };
  }
  try {
    return await refresh(timeout);
  } catch (e) {
    return null;
  }
};

const getJson = async (path, ctx) => {
  const res = await cachedFetch(`${API}${path}`, { ctx });
  if (!res) return null;
  if (res.status === 404) return { notFound: true };
  try {
    const body = JSON.parse(res.text);
    return { data: body && body.data };
  } catch (e) {
    return null;
  }
};

const setHead = (html, { title, description, url, image, type = 'website', jsonLd, robots }) => {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    robots ? `<meta name="robots" content="${esc(robots)}">` : '',
    url ? `<link rel="canonical" href="${esc(url)}">` : '',
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    url ? `<meta property="og:url" content="${esc(url)}">` : '',
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ].join('');
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+(name="description"|name="robots"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, '')
    .replace(/<link[^>]+rel="canonical"[^>]*>/gi, '')
    .replace('</head>', () => `${tags}</head>`);
};
const setBody = (html, inner) => html.replace(/<div id="root"><\/div>/, () => `<div id="root">${inner}</div>`);

// Shared header and footer so every prerendered page links to the main sections
const chrome = inner => [
  `<header><p><a href="/">${SITE_NAME}</a></p><nav><a href="/latest">Latest</a> · <a href="/categories">Categories</a> · <a href="/about">About</a></nav></header>`,
  inner,
  '<footer><nav><a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms</a> · <a href="/cookie-policy">Cookie Policy</a> · <a href="/advertising-disclosure">Advertising Disclosure</a></nav></footer>',
].join('');
const articleList = (list = []) => `<ul>${list.map(a =>
  `<li><a href="/article/${esc(a.slug)}">${esc(a.title)}</a>${a.excerpt ? `: ${esc(clip(a.excerpt, 140))}` : ''}</li>`).join('')}</ul>`;
const breadcrumbLd = items => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});
const breadcrumbNav = items => `<nav aria-label="Breadcrumb"><ol>${items.map((it, i) =>
  `<li>${i < items.length - 1 ? `<a href="${esc(it.path)}">${esc(it.name)}</a>` : esc(it.name)}</li>`).join('')}</ol></nav>`;
const categoryName = (cat, slug) => (cat && cat.name) || String(slug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const toResponse = (html, base, { status = 200, extra = {} } = {}) => {
  const headers = new Headers(base.headers);
  headers.delete('content-length');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=0, must-revalidate');
  Object.entries(extra).forEach(([k, v]) => headers.set(k, v));
  return new Response(html, { status, headers });
};

// 404 with noindex; the React app still boots for people and shows its own 404 page
const notFound = (html, base, isBot) => {
  let out = setHead(html, {
    title: `Page not found | ${SITE_NAME}`,
    description: 'This page does not exist or has been moved.',
    robots: 'noindex',
  });
  if (isBot) {
    out = setBody(out, chrome('<main><h1>Page not found</h1><p>This page does not exist or has been moved. <a href="/">Go to the home page</a>.</p></main>'));
  }
  return toResponse(out, base, { status: 404, extra: { 'x-robots-tag': 'noindex' } });
};

const renderHome = async (html, ctx) => {
  const res = await getJson('/articles?limit=30', ctx);
  const list = (res && res.data && res.data.articles) || [];
  html = setHead(html, {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE}/`,
    image: `${SITE}/logo512.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': `${SITE}/#website`, name: SITE_NAME, url: `${SITE}/`, inLanguage: 'en-US', publisher: { '@id': `${SITE}/#organization` } },
        {
          '@type': 'Organization',
          '@id': `${SITE}/#organization`,
          name: SITE_NAME,
          url: `${SITE}/`,
          logo: `${SITE}/logo512.png`,
          founder: { '@type': 'Person', name: 'Sairanjan Biswal', url: `${SITE}/writer/${FOUNDER.username}`, sameAs: FOUNDER.sameAs },
          sameAs: FOUNDER.sameAs,
        },
      ],
    },
  });
  return setBody(html, chrome(`<main><h1>${HOME_TITLE}</h1><p>${esc(HOME_DESCRIPTION)}</p><h2>Latest articles</h2>${articleList(list)}</main>`));
};

const renderArticle = async (html, slug, ctx) => {
  const res = await getJson(`/articles/${encodeURIComponent(slug)}`, ctx);
  if (res && res.notFound) return { notFound: true };
  const a = res && res.data && res.data.article;
  if (!a) return null;

  const [catRes, relRes] = await Promise.all([
    a.category ? getJson(`/categories/${encodeURIComponent(a.category)}`, ctx) : null,
    a.category ? getJson(`/articles?category=${encodeURIComponent(a.category)}&limit=6`, ctx) : null,
  ]);
  const catName = categoryName(catRes && catRes.data && catRes.data.category, a.category || 'articles');
  const related = ((relRes && relRes.data && relRes.data.articles) || []).filter(r => r.slug !== a.slug).slice(0, 5);

  const pageUrl = `${SITE}/article/${a.slug}`;
  const author = a.author || {};
  const authorUrl = author.username ? `${SITE}/writer/${author.username}` : '';
  const sameAs = profileLinks(author);
  const published = a.publishedAt || a.createdAt;
  const description = clip(a.excerpt || a.content);
  const crumbs = [
    { name: 'Home', path: '/', url: `${SITE}/` },
    ...(a.category ? [{ name: catName, path: `/categories/${a.category}`, url: `${SITE}/categories/${a.category}` }] : []),
  ];

  html = setHead(html, {
    title: buildTitle(a.seoTitle || a.title),
    description,
    url: pageUrl,
    image: a.coverImage,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: a.title,
          description,
          image: a.coverImage ? [a.coverImage] : undefined,
          datePublished: published,
          dateModified: a.updatedAt || published,
          author: author.name ? {
            '@type': 'Person',
            name: author.name,
            url: authorUrl || undefined,
            sameAs: sameAs.length ? sameAs : undefined,
          } : undefined,
          publisher: { '@type': 'Organization', name: SITE_NAME, url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/logo512.png` } },
          mainEntityOfPage: pageUrl,
          isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE}/` },
          inLanguage: 'en-US',
          articleSection: a.category ? catName : undefined,
          keywords: (a.tags || []).length ? a.tags.join(', ') : undefined,
          wordCount: wordCount(a.content),
        },
        breadcrumbLd([...crumbs, { name: a.title, url: pageUrl }]),
      ],
    },
  });

  const byline = author.name
    ? `By ${authorUrl ? `<a href="/writer/${esc(author.username)}" rel="author">${esc(author.name)}</a>` : esc(author.name)}`
    : '';
  return {
    html: setBody(html, chrome([
      '<main><article><header>',
      breadcrumbNav([...crumbs, { name: a.title }]),
      `<h1>${esc(a.title)}</h1>`,
      a.excerpt ? `<p>${esc(a.excerpt)}</p>` : '',
      `<p>${byline}${published ? ` · <time datetime="${esc(published)}">${esc(new Date(published).toDateString())}</time>` : ''}</p>`,
      a.coverImage ? `<img src="${esc(a.coverImage)}" alt="${esc(a.title)}">` : '',
      '</header>',
      safeHtml(a.content),
      '</article>',
      related.length ? `<aside><h2>Related articles</h2>${articleList(related)}</aside>` : '',
      '</main>',
    ].join(''))),
  };
};

const renderCategory = async (html, slug, ctx) => {
  const [catRes, listRes] = await Promise.all([
    getJson(`/categories/${encodeURIComponent(slug)}`, ctx),
    getJson(`/articles?category=${encodeURIComponent(slug)}&limit=30`, ctx),
  ]);
  if (catRes && catRes.notFound) return { notFound: true };
  const cat = catRes && catRes.data && catRes.data.category;
  if (!cat) return null;
  const list = (listRes && listRes.data && listRes.data.articles) || [];
  const name = categoryName(cat, slug);
  const pageUrl = `${SITE}/categories/${cat.slug || slug}`;
  const intro = cat.description || `Practical, sourced ${name.toLowerCase()} articles on ${SITE_NAME}.`;
  const crumbs = [{ name: 'Home', path: '/', url: `${SITE}/` }, { name: 'Categories', path: '/categories', url: `${SITE}/categories` }];

  html = setHead(html, {
    title: buildTitle(`${name} Articles`),
    description: clip(intro),
    url: pageUrl,
    image: `${SITE}/logo512.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'CollectionPage', name: `${name} Articles`, description: clip(intro), url: pageUrl, inLanguage: 'en-US', isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE}/` } },
        breadcrumbLd([...crumbs, { name, url: pageUrl }]),
      ],
    },
  });
  return {
    html: setBody(html, chrome([
      '<main>',
      breadcrumbNav([...crumbs, { name }]),
      `<h1>${esc(name)}</h1><p>${esc(intro)}</p>`,
      list.length ? articleList(list) : '<p>No articles in this category yet.</p>',
      '</main>',
    ].join(''))),
  };
};

const renderWriter = async (html, username, ctx) => {
  const res = await getJson(`/writers/${encodeURIComponent(username)}`, ctx);
  if (res && res.notFound) return { notFound: true };
  const writer = res && res.data && res.data.writer;
  if (!writer) return null;
  const list = (res.data.articles || []);
  const pageUrl = `${SITE}/writer/${writer.username}`;
  const sameAs = profileLinks(writer);
  const intro = writer.bio || `Articles by ${writer.name} on ${SITE_NAME}.`;

  html = setHead(html, {
    title: buildTitle(`${writer.name}, Writer`),
    description: clip(intro),
    url: pageUrl,
    image: writer.avatar || `${SITE}/logo512.png`,
    type: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: pageUrl,
      mainEntity: {
        '@type': 'Person',
        name: writer.name,
        url: pageUrl,
        description: writer.bio || undefined,
        image: writer.avatar || undefined,
        sameAs: sameAs.length ? sameAs : undefined,
        worksFor: { '@type': 'Organization', name: SITE_NAME, url: `${SITE}/` },
      },
    },
  });
  return {
    html: setBody(html, chrome([
      '<main>',
      `<h1>${esc(writer.name)}</h1><p>${esc(intro)}</p>`,
      sameAs.length ? `<p>${sameAs.map(u => `<a href="${esc(u)}" rel="me noopener">${esc(new URL(u).hostname.replace(/^www\./, ''))}</a>`).join(' · ')}</p>` : '',
      `<h2>Articles by ${esc(writer.name)}</h2>`,
      list.length ? articleList(list) : '<p>No published articles yet.</p>',
      '</main>',
    ].join(''))),
  };
};

export async function onRequest(context) {
  const { request, next, env } = context;
  API = ((env && env.PRERENDER_API_URL) || DEFAULT_API).replace(/\/+$/, '');
  SITE = ((env && env.SITE_URL) || DEFAULT_SITE).replace(/\/+$/, '');
  const url = new URL(request.url);

  // www -> apex (301). A Cloudflare Redirect Rule does the same before the request gets here.
  if (url.hostname.startsWith('www.')) {
    return Response.redirect(`https://${url.hostname.slice(4)}${url.pathname}${url.search}`, 301);
  }

  if (PROXIED[url.pathname]) {
    const res = await cachedFetch(`${new URL(API).origin}${url.pathname}`, { timeout: 20000, ctx: context });
    if (res && res.status === 200) {
      return new Response(res.text, {
        headers: { 'content-type': PROXIED[url.pathname], 'cache-control': 'public, max-age=3600' },
      });
    }
    return new Response('Temporarily unavailable', { status: 503, headers: { 'retry-after': '120' } });
  }

  if (STATIC.test(url.pathname) || !['GET', 'HEAD'].includes(request.method)) return next();

  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';
  if (path === '/privacy') return Response.redirect(`${url.origin}/privacy-policy`, 301);

  const ua = request.headers.get('user-agent') || '';
  const accept = request.headers.get('accept') || '';
  const isBot = BOTS.test(ua);
  const wantsHtml = !accept || /text\/html|\*\/\*/.test(accept);

  // Unknown routes: 404 + noindex for everyone (files with an extension, e.g. a
  // google-site-verification .html file, are left to the static server)
  if (!isKnownRoute(path) && !/\.[a-z0-9]+$/i.test(path)) {
    const response = await next();
    if (!(response.headers.get('content-type') || '').includes('text/html') || response.status >= 400) return response;
    return notFound(await response.text(), response, isBot);
  }

  const dynamic = path === '/' || /^\/(article|categories|writer)\/[^/]+$/.test(path);
  if (!dynamic || !isBot || !wantsHtml) return next();

  const response = await next();
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  const shell = await response.text();
  const plain = () => {
    const h = new Headers(response.headers);
    h.delete('content-length');
    return new Response(shell, { status: response.status, headers: h });
  };
  try {
    let result = null;
    const [, kind, slug] = path.match(/^\/(article|categories|writer)\/([^/]+)$/) || [];
    if (path === '/') result = { html: await renderHome(shell, context) };
    else if (kind === 'article') result = await renderArticle(shell, decodeURIComponent(slug), context);
    else if (kind === 'categories') result = await renderCategory(shell, decodeURIComponent(slug), context);
    else if (kind === 'writer') result = await renderWriter(shell, decodeURIComponent(slug), context);

    if (result && result.notFound) return notFound(shell, response, true);
    if (!result || !result.html) return plain(); // API unreachable and nothing cached
    return toResponse(result.html, response, { extra: { 'x-bot-render': '1' } });
  } catch (e) {
    return plain(); // never break the page for a crawler
  }
};
