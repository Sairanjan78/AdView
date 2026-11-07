const Article = require('../models/Article');
const User = require('../models/User');
const { ARTICLE_STATUS, CATEGORIES_LIST } = require('../constants/articles');
const { ROLES } = require('../constants/roles');
const env = require('../config/env');

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/explore', changefreq: 'daily', priority: '0.8' },
  { path: '/latest', changefreq: 'daily', priority: '0.8' },
  { path: '/trending', changefreq: 'daily', priority: '0.7' },
  { path: '/categories', changefreq: 'weekly', priority: '0.6' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' }
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>'
  ].filter(Boolean).join('\n');

/**
 * @desc    XML sitemap of the public site, generated from published articles
 * @route   GET /sitemap.xml  (also /api/v1/sitemap.xml)
 * @access  Public
 */
exports.getSitemap = async (req, res, next) => {
  try {
    const site = env.siteUrl;

    const articles = await Article.find({ status: ARTICLE_STATUS.PUBLISHED })
      .select('slug category author updatedAt publishedAt')
      .sort({ publishedAt: -1 })
      .limit(45000) // sitemap protocol limit is 50,000 URLs
      .lean();

    // Latest update per category and per author
    const categoryLastmod = {};
    const authorLastmod = {};
    articles.forEach((a) => {
      const updated = a.updatedAt || a.publishedAt;
      if (!categoryLastmod[a.category] || updated > categoryLastmod[a.category]) categoryLastmod[a.category] = updated;
      const key = a.author.toString();
      if (!authorLastmod[key] || updated > authorLastmod[key]) authorLastmod[key] = updated;
    });

    const authors = await User.find({
      _id: { $in: Object.keys(authorLastmod) },
      role: { $in: [ROLES.WRITER, ROLES.ADMIN] }
    })
      .select('username')
      .lean();

    const entries = [
      ...STATIC_PAGES.map(p => urlEntry({ loc: `${site}${p.path}`, changefreq: p.changefreq, priority: p.priority })),
      ...CATEGORIES_LIST.filter(slug => categoryLastmod[slug]).map(slug =>
        urlEntry({ loc: `${site}/categories/${slug}`, lastmod: categoryLastmod[slug], changefreq: 'daily', priority: '0.6' })
      ),
      ...articles.map(a =>
        urlEntry({ loc: `${site}/article/${a.slug}`, lastmod: a.updatedAt || a.publishedAt, changefreq: 'weekly', priority: '0.9' })
      ),
      ...authors.map(u =>
        urlEntry({ loc: `${site}/writer/${u.username}`, lastmod: authorLastmod[u._id.toString()], changefreq: 'weekly', priority: '0.5' })
      )
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      '</urlset>',
      ''
    ].join('\n');

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    robots.txt for the API host (points crawlers at the sitemap, keeps the JSON API out of search)
 * @route   GET /robots.txt
 * @access  Public
 */
exports.getRobots = (req, res) => {
  const sitemapUrl = `${req.protocol}://${req.get('host')}/sitemap.xml`;
  res.set('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send([
    'User-agent: *',
    'Allow: /sitemap.xml',
    // Google renders the React pages and must be able to fetch the public read endpoints,
    // otherwise article pages render the error state (with noindex) and never get indexed.
    'Allow: /api/v1/articles',
    'Allow: /api/v1/categories',
    'Allow: /api/v1/writers',
    'Disallow: /api/v1/articles/me/',
    'Disallow: /api/',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n'));
};

/**
 * @desc    llms.txt: a plain-text map of the site for AI crawlers and answer engines (llmstxt.org)
 * @route   GET /llms.txt  (served on the site's domain through the client's _redirects)
 * @access  Public
 */
exports.getLlmsTxt = async (req, res, next) => {
  try {
    const site = env.siteUrl;
    const articles = await Article.find({ status: ARTICLE_STATUS.PUBLISHED })
      .select('title slug excerpt category publishedAt')
      .sort({ publishedAt: -1 })
      .limit(200)
      .lean();
    const oneLine = (t = '') => String(t).replace(/\s+/g, ' ').trim();
    const lines = [
      '# BlogSphere Mag',
      '',
      '> BlogSphere Mag is an independent online magazine founded in 2026 by Sairanjan Biswal, a software engineer from Odisha, India. It publishes practical, sourced guides on technology, careers and jobs, education, innovation, travel and world affairs.',
      '',
      'Articles are written or edited by named authors, cite their sources, and are updated when facts change. Quote freely with a link to the article.',
      '',
      '## Articles',
      ...articles.map(a => `- [${oneLine(a.title)}](${site}/article/${a.slug})${a.excerpt ? `: ${oneLine(a.excerpt)}` : ''}`),
      '',
      '## About',
      `- [About BlogSphere Mag and its founder](${site}/about)`,
      `- [Contact](${site}/contact)`,
      `- [Privacy Policy](${site}/privacy-policy)`,
      `- [Terms](${site}/terms)`,
      '',
      '## Optional',
      `- [All categories](${site}/categories)`,
      `- [Latest articles](${site}/latest)`,
      `- [Sitemap](${site}/sitemap.xml)`,
      '',
    ];
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
};
