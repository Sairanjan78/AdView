import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import brand from '../../config/brand';

const DEFAULT_IMAGE = '/logo512.png';

const absoluteUrl = (url) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${brand.url}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Title separator: a pipe (no dashes). The brand is appended only while the result stays under 60 chars,
// so long headlines are not cut off in search results.
const TITLE_SEP = ' | ';
const MAX_TITLE = 60;
const buildTitle = (title) => {
  if (!title) return brand.homeTitle || brand.name;
  const withBrand = `${title}${TITLE_SEP}${brand.name}`;
  return withBrand.length < MAX_TITLE ? withBrand : title;
};

const clip = (text = '', max = 160) => {
  const clean = String(text).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

/**
 * Per-page SEO tags: <title>, meta description, canonical link, Open Graph and Twitter cards,
 * optional robots noindex and JSON-LD structured data.
 *
 * @param {string}  title        page title (pass an article's `seoTitle || title`); the site name is
 *                               appended with " | " only when the result stays under 60 characters;
 *                               omit on the home page
 * @param {string}  description  meta description (clipped to 160 chars)
 * @param {string}  path         canonical path; defaults to the current path without query string
 * @param {string}  image        share image (absolute or site-relative)
 * @param {string}  type         og:type - 'website' | 'article' | 'profile'
 * @param {boolean} noindex      keep the page out of search results (auth, search, editor pages)
 * @param {object}  article      { publishedTime, modifiedTime, author, section, tags }
 * @param {object}  jsonLd       schema.org object rendered as application/ld+json
 */
const Seo = ({
  title,
  description = brand.description,
  path,
  image,
  type = 'website',
  noindex = false,
  article,
  jsonLd,
}) => {
  const location = useLocation();
  const fullTitle = buildTitle(title);
  const desc = clip(description);
  const canonical = `${brand.url}${path ?? location.pathname}`;
  const shareImage = absoluteUrl(image || DEFAULT_IMAGE);

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:site_name" content={brand.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={shareImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={shareImage} />

      {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
      {article?.author && <meta property="article:author" content={article.author} />}
      {article?.section && <meta property="article:section" content={article.section} />}
      {(article?.tags || []).map(tag => <meta key={tag} property="article:tag" content={tag} />)}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};

export { absoluteUrl, buildTitle };
export default Seo;
