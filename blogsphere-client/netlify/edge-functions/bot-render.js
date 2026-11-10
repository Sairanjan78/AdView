/**
 * Lightweight prerendering for crawlers that don't run JavaScript (AI search bots, link previews,
 * Bing, etc.). Humans get the normal React app untouched.
 * For bots, the same index.html is returned with the real title, description, canonical and Open
 * Graph tags, plus the page's text inside #root (React replaces it if JavaScript runs).
 *   /article/:slug  -> the full article
 *   /               -> links to the latest articles, so bots can discover them
 */
const API = (Netlify.env.get('PRERENDER_API_URL') || 'https://blogsphere-api-odr7.onrender.com/api/v1').replace(/\/+$/, '');
const SITE_NAME = 'BlogSphere Mag';
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|facebot|embedly|quora link preview|outbrain|pinterest|vkshare|whatsapp|telegram|discord|slack|linkedin|skype|nuzzel|redditbot|applebot|yandex|baiduspider|duckduck|bingpreview|semrush|ahrefs|chatgpt|gptbot|oai-searchbot|perplexity|claude|anthropic|cohere|google-extended|googleother|bytespider|meta-externalagent|amazonbot|ccbot|petalbot|mojeek|mediapartners|inspectiontool|storebot|google-safety/i;

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s = '', n = 160) => {
  const t = String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
// Strip scripts, styles and inline handlers from stored article HTML before echoing it
const safeHtml = (html = '') => String(html)
  .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript:/gi, '');

const getJson = async (path) => {
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(9000), headers: { 'x-prerender': '1' } });
  if (!res.ok) return null;
  return res.json();
};

const setHead = (html, { title, description, url, image, type = 'website', jsonLd }) => {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ].join('');
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+(name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, '')
    .replace(/<link[^>]+rel="canonical"[^>]*>/gi, '')
    .replace('</head>', `${tags}</head>`);
};
const setBody = (html, inner) => html.replace(/<div id="root"><\/div>/, `<div id="root">${inner}</div>`);

export default async (request, context) => {
  const ua = request.headers.get('user-agent') || '';
  const accept = request.headers.get('accept') || '';
  if (!BOTS.test(ua) || (accept && !/text\/html|\*\/\*/.test(accept))) return context.next();

  const response = await context.next();
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  let html = await response.text();
  const plain = () => {
    const h = new Headers(response.headers);
    h.delete('content-length');
    return new Response(html, { status: response.status, headers: h });
  };
  try {
    const url = new URL(request.url);
    const origin = url.origin;
    const match = url.pathname.match(/^\/article\/([^/]+)\/?$/);

    if (match) {
      const data = await getJson(`/articles/${encodeURIComponent(match[1])}`);
      const a = data && data.data && data.data.article;
      if (!a) return plain();
      const pageUrl = `${origin}/article/${a.slug}`;
      const author = (a.author && a.author.name) || '';
      const published = a.publishedAt || a.createdAt;
      html = setHead(html, {
        title: `${a.title} — ${SITE_NAME}`,
        description: clip(a.excerpt || a.content),
        url: pageUrl,
        image: a.coverImage,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: a.title,
          description: clip(a.excerpt || a.content),
          image: a.coverImage ? [a.coverImage] : undefined,
          datePublished: published,
          dateModified: a.updatedAt || published,
          author: author ? { '@type': 'Person', name: author } : undefined,
          publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${origin}/logo512.png` } },
          mainEntityOfPage: pageUrl,
        },
      });
      html = setBody(html, [
        `<article><header><p><a href="/">${SITE_NAME}</a></p><h1>${esc(a.title)}</h1>`,
        a.excerpt ? `<p>${esc(a.excerpt)}</p>` : '',
        `<p>${author ? `By ${esc(author)}` : ''}${published ? ` · <time datetime="${esc(published)}">${esc(new Date(published).toDateString())}</time>` : ''}</p></header>`,
        safeHtml(a.content),
        '</article>',
      ].join(''));
    } else if (url.pathname === '/') {
      const data = await getJson('/articles?limit=30');
      const list = (data && data.data && data.data.articles) || [];
      const links = list.map(a => `<li><a href="/article/${esc(a.slug)}">${esc(a.title)}</a>${a.excerpt ? ` — ${esc(clip(a.excerpt, 140))}` : ''}</li>`).join('');
      html = setBody(html, `<main><h1>${SITE_NAME}</h1><h2>Latest articles</h2><ul>${links}</ul></main>`);
    }

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'public, max-age=0, must-revalidate');
    headers.set('x-bot-render', '1');
    return new Response(html, { status: response.status, headers });
  } catch (e) {
    return plain(); // never break the page for a crawler
  }
};

export const config = {
  path: ['/', '/article/*'],
  excludedPath: ['/static/*', '/*.js', '/*.css', '/*.png', '/*.svg', '/*.ico', '/*.json', '/*.txt', '/*.xml'],
};
