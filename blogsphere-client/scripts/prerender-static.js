/**
 * Prerenders the static pages (About, Contact, policies) to plain HTML at build time, so crawlers
 * that don't run JavaScript (AdSense review, Bing, AI search bots) see the real text, title,
 * description and canonical link instead of an empty <div id="root">.
 *
 * Each page's React component is rendered with react-dom/server straight from src/, so the
 * prerendered text always matches the live page. Output: build/<route>.html (Cloudflare Pages and
 * Netlify serve build/about.html at /about without a trailing-slash redirect). The React app still
 * boots on top for people and replaces the static markup.
 *
 * Called from scripts/postbuild-seo.js. Can also be run on its own: node scripts/prerender-static.js
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const buildDir = path.join(root, 'build');

const PAGES = [
  { route: '/about', file: 'pages/public/AboutPage.jsx' },
  { route: '/contact', file: 'pages/legal/ContactPage.jsx' },
  { route: '/privacy-policy', file: 'pages/legal/PrivacyPolicyPage.jsx' },
  { route: '/terms', file: 'pages/legal/TermsPage.jsx' },
  { route: '/cookie-policy', file: 'pages/legal/CookiePolicyPage.jsx' },
  { route: '/advertising-disclosure', file: 'pages/legal/AdvertisingDisclosurePage.jsx' },
  { route: '/writer-monetization-policy', file: 'pages/legal/MonetizationPolicyPage.jsx' },
];

const SITE_NAME = 'BlogSphere Mag';

// Compile src/ files (JSX, ES modules) on the fly. Node runs modern JS natively, so only JSX and
// import/export need transforming (both packages ship with react-scripts).
const installRequireHook = () => {
  const babel = require('@babel/core');
  const compile = (module, filename) => {
    const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename,
      babelrc: false,
      configFile: false,
      presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic', development: false }]],
      plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
    });
    module._compile(code, filename);
  };
  const origJs = Module._extensions['.js'];
  Module._extensions['.jsx'] = compile;
  Module._extensions['.js'] = (module, filename) =>
    (filename.startsWith(srcDir) ? compile(module, filename) : origJs(module, filename));
  Module._extensions['.css'] = () => {};
};

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Pull <title>, <meta>, <link rel=canonical> and JSON-LD out of the rendered markup (React 19 and
// react-helmet-async v3 render them inline; in the browser React hoists them into <head>)
const HEAD_TAG = /<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel="canonical"[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/gi;
const splitHead = (markup) => {
  const head = markup.match(HEAD_TAG) || [];
  return { head, body: markup.replace(HEAD_TAG, '') };
};

const helmetHead = (ctx) => {
  const h = ctx && ctx.helmet;
  if (!h) return [];
  return [h.title, h.meta, h.link, h.script].map(part => (part ? part.toString() : '')).filter(Boolean);
};

const chrome = inner => [
  `<header><p><a href="/">${SITE_NAME}</a></p><nav><a href="/latest">Latest</a> · <a href="/categories">Categories</a> · <a href="/about">About</a></nav></header>`,
  `<main>${inner}</main>`,
  '<footer><nav><a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms</a> · <a href="/cookie-policy">Cookie Policy</a> · <a href="/advertising-disclosure">Advertising Disclosure</a> · <a href="/writer-monetization-policy">Writer Monetization Policy</a></nav></footer>',
].join('');

const injectHead = (shell, headTags) => shell
  .replace(/<title>[\s\S]*?<\/title>/i, '')
  .replace(/<meta[^>]+(name="description"|name="robots"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, '')
  .replace(/<link[^>]+rel="canonical"[^>]*>/gi, '')
  .replace('</head>', () => `${headTags.join('')}</head>`);

function prerenderStatic({ log = console.log } = {}) {
  const shellPath = path.join(buildDir, 'index.html');
  if (!fs.existsSync(shellPath)) {
    log('[prerender-static] No build/index.html, skipping.');
    return [];
  }
  // Canonical and Open Graph URLs use the public domain (brand.js reads REACT_APP_SITE_URL)
  if (!process.env.REACT_APP_SITE_URL) process.env.REACT_APP_SITE_URL = 'https://blogspheremag.com';
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

  installRequireHook();
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { StaticRouter } = require('react-router-dom');
  const { HelmetProvider } = require('react-helmet-async');

  const shell = fs.readFileSync(shellPath, 'utf8');
  const written = [];
  PAGES.forEach(({ route, file }) => {
    const full = path.join(srcDir, file);
    if (!fs.existsSync(full)) {
      log(`[prerender-static] ${file} not found, skipping ${route}.`);
      return;
    }
    const mod = require(full);
    const Page = mod.default || mod;
    const helmetContext = {};
    const markup = renderToStaticMarkup(
      React.createElement(HelmetProvider, { context: helmetContext },
        React.createElement(StaticRouter, { location: route }, React.createElement(Page)))
    );
    const { head: inlineHead, body } = splitHead(markup);
    const head = helmetHead(helmetContext);
    const headTags = head.length ? head : inlineHead;
    if (!headTags.some(t => /<title>/i.test(t))) {
      headTags.unshift(`<title>${esc(`${route.slice(1)} | ${SITE_NAME}`)}</title>`);
    }
    const html = injectHead(shell, headTags)
      .replace(/<div id="root"><\/div>/, () => `<div id="root">${chrome(body)}</div>`);
    const out = path.join(buildDir, `${route.slice(1)}.html`);
    fs.writeFileSync(out, html);
    written.push(out);
    log(`[prerender-static] ${route} -> build/${route.slice(1)}.html (${Math.round(html.length / 1024)} KB)`);
  });
  return written;
}

module.exports = prerenderStatic;

if (require.main === module) prerenderStatic();
