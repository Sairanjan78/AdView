import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  LuEye, LuClock, LuTwitter, LuLinkedin, LuLink, LuCheck, LuArrowLeft, LuFileQuestion, LuLoaderCircle,
} from 'react-icons/lu';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import CategoryIcon from '../../components/ui/CategoryIcon';
import CoverImage from '../../components/ui/CoverImage';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import AdSlot from '../../components/ads/AdSlot';
import { AD_SLOTS, isAdsEnabled } from '../../config/ads';
import { articleApi } from '../../services/api';
import { normalizeArticle } from '../../utils/normalizeArticle';
import { formatCount, toIsoDate } from '../../utils/format';
import useApi from '../../hooks/useApi';
import './ArticleDetailPage.css';

/**
 * Split article HTML after its first paragraph so an ad can sit after the intro.
 * Returns [html, ''] when there is no natural break.
 */
const splitAfterIntro = (html) => {
  const end = html.indexOf('</p>');
  if (end === -1) return [html, ''];
  const cut = end + 4;
  const rest = html.slice(cut);
  return rest.trim() ? [html.slice(0, cut), rest] : [html, ''];
};

/** Plain-text content (no tags) becomes paragraphs; HTML is used as-is. */
const toHtml = (content, excerpt) => {
  if (!content) return excerpt ? `<p>${excerpt}</p>` : '';
  if (content.includes('<')) return content;
  return `<p>${content.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
};

/**
 * Build FAQPage schema from an article's "FAQ" / "Frequently asked questions" section:
 * each <h3> after that <h2> is a question, the elements up to the next heading are its answer.
 * Helps Google and AI answer engines quote the article directly.
 */
const extractFaq = (html) => {
  if (typeof DOMParser === 'undefined' || !html) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const h2 = [...doc.querySelectorAll('h2')].find(h => /^(faqs?|frequently asked questions)\b/i.test(h.textContent.trim()));
  if (!h2) return null;
  const items = [];
  let q = null; let a = [];
  const flush = () => { if (q && a.join(' ').trim()) items.push({ q, a: a.join(' ').replace(/\s+/g, ' ').trim() }); };
  for (let el = h2.nextElementSibling; el && el.tagName !== 'H2'; el = el.nextElementSibling) {
    if (el.tagName === 'H3') { flush(); q = el.textContent.trim(); a = []; }
    else if (q) a.push(el.textContent);
  }
  flush();
  if (!items.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(({ q: name, a: text }) => ({
      '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text },
    })),
  };
};

/** Give every <h2> an id (for the table of contents) and return the headings found. */
const addHeadingIds = (html) => {
  const seen = {};
  const toc = [];
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
    if (!text) return m;
    const existing = attrs.match(/\sid="([^"]+)"/i);
    let id = existing ? existing[1] : text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
    if (!existing) { seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id = `${id}-${seen[id]}`; }
    toc.push({ id, text });
    return existing ? m : `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return [out, toc];
};

// Author profile links for schema.org sameAs: the writer's own social links, plus the founder's
// LinkedIn from the brand config when the founder has not added it to the profile yet.
const authorProfiles = (author) => {
  const links = Object.values(author.socialLinks || {}).filter(u => /^https?:\/\//i.test(u || ''));
  if (brand.founder && author.username === brand.founder.username) {
    brand.founder.sameAs.forEach(u => { if (!links.includes(u)) links.push(u); });
  }
  return links;
};

const ShareBar = ({ title }) => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : brand.url;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url); // clipboard blocked (e.g. insecure context)
    }
  };

  return (
    <div className="article-share">
      <span className="article-share__label">Share</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="article-share__btn" aria-label="Share on X (Twitter)"
      >
        <LuTwitter aria-hidden="true" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="article-share__btn" aria-label="Share on LinkedIn"
      >
        <LuLinkedin aria-hidden="true" />
      </a>
      <button type="button" className="article-share__btn" onClick={copyLink} aria-label={copied ? 'Link copied' : 'Copy link'}>
        {copied ? <LuCheck aria-hidden="true" /> : <LuLink aria-hidden="true" />}
      </button>
      <span className="sr-only" aria-live="polite">{copied ? 'Link copied to clipboard' : ''}</span>
    </div>
  );
};

const ArticleDetailPage = () => {
  const { slug } = useParams();
  const { data: article, loading, error } = useApi(
    () => articleApi.getArticleBySlug(slug).then(res => normalizeArticle(res?.data?.article)),
    [slug]
  );
  // Same-category articles: internal links that build topical clusters
  const { data: related } = useApi(
    article && article.category && article.category.slug
      ? () => articleApi.getArticles({ category: article.category.slug, limit: 6 })
          .then(res => (res?.data?.articles || []).filter(a => a.slug !== article.slug).slice(0, 4))
      : null,
    [article && article.slug]
  );

  if (loading) {
    return (
      <div className="page-loader" role="status">
        <LuLoaderCircle size={28} aria-hidden="true" />
        Loading article…
      </div>
    );
  }

  if (!article) {
    const failed = error && error.status !== 404;
    return (
      <div className="container">
        <Seo title={failed ? 'Could not load article' : 'Article not found'} noindex />
        <EmptyState
          icon={LuFileQuestion}
          tone={failed ? 'error' : 'default'}
          title={failed ? 'We couldn’t load this article' : 'Article not found'}
          action={<Button to="/" variant="outline" icon={<LuArrowLeft />}>Back home</Button>}
        >
          {failed ? error.message : 'It may have been moved, unpublished or never existed.'}
        </EmptyState>
      </div>
    );
  }

  const { title, excerpt, content, cover, category, author, publishedAt, readTime, views, tags } = article;
  const [articleBody, toc] = addHeadingIds(toHtml(content, excerpt));
  const [introHtml, restHtml] = splitAfterIntro(articleBody);
  const faqSchema = extractFaq(articleBody);
  const wordCount = String(content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const authorSameAs = authorProfiles(author);

  return (
    <>
      <Seo
        title={article.seoTitle || title}
        description={excerpt}
        path={`/article/${article.slug}`}
        image={cover || undefined}
        type="article"
        article={{
          publishedTime: new Date(publishedAt).toISOString(),
          modifiedTime: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
          author: author.name,
          section: category.name,
          tags,
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [{
          '@type': 'BlogPosting',
          headline: title,
          description: excerpt,
          image: cover ? [cover] : undefined,
          datePublished: new Date(publishedAt).toISOString(),
          dateModified: new Date(article.updatedAt || publishedAt).toISOString(),
          author: {
            '@type': 'Person',
            name: author.name,
            url: `${brand.url}/writer/${author.username}`,
            ...(authorSameAs.length ? { sameAs: authorSameAs } : {}),
          },
          publisher: { '@type': 'Organization', name: brand.name, url: `${brand.url}/`, logo: { '@type': 'ImageObject', url: `${brand.url}/logo512.png` } },
          mainEntityOfPage: `${brand.url}/article/${article.slug}`,
          isPartOf: { '@type': 'WebSite', name: brand.name, url: `${brand.url}/` },
          inLanguage: 'en-US',
          articleSection: category.name,
          wordCount,
          keywords: tags.join(', '),
          }, {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${brand.url}/` },
              { '@type': 'ListItem', position: 2, name: category.name, item: `${brand.url}/categories/${category.slug}` },
              { '@type': 'ListItem', position: 3, name: title, item: `${brand.url}/article/${article.slug}` },
            ],
          }, ...(faqSchema ? [faqSchema] : [])],
        }}
      />

      <article className="article-detail">
        <header className="article-detail__header container">
          <Link to={`/categories/${category.slug}`} className="kicker article-detail__kicker" style={{ '--cat-color': category.color }}>
            <CategoryIcon icon={category.icon} size={15} /> {category.name}
          </Link>
          <h1 className="article-detail__title">{title}</h1>
          {excerpt && <p className="article-detail__dek">{excerpt}</p>}

          <div className="article-detail__byline">
            <Link to={`/writer/${author.username}`} className="article-detail__author-link">
              <Avatar src={author.avatar} name={author.name} size="md" verified={author.verified} />
              <span>
                <span className="article-detail__author-name">{author.name}</span>
                <span className="article-detail__meta">
                  <time dateTime={toIsoDate(publishedAt)}>{format(new Date(publishedAt), 'MMMM d, yyyy')}</time>
                  {article.updatedAt && new Date(article.updatedAt) - new Date(publishedAt) > 86400000 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Updated <time dateTime={toIsoDate(article.updatedAt)}>{format(new Date(article.updatedAt), 'MMMM d, yyyy')}</time></span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span><LuClock size={13} aria-hidden="true" /> {readTime} min read</span>
                  {views > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span><LuEye size={13} aria-hidden="true" /> {formatCount(views)} views</span>
                    </>
                  )}
                </span>
              </span>
            </Link>
            <ShareBar title={title} />
          </div>
        </header>

        {cover && (
          <figure className="article-detail__cover container container--wide">
            <CoverImage src={cover} alt={title} />
          </figure>
        )}

        <div className="article-detail__content container" id="article-content">
          {toc.length >= 3 && (
            <nav className="article-toc" aria-label="In this article">
              <strong className="article-toc__title">In this article</strong>
              <ol>
                {toc.map(h => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}
              </ol>
            </nav>
          )}
          {isAdsEnabled() && AD_SLOTS.articleTop ? (
            <>
              <div className="article-body" dangerouslySetInnerHTML={{ __html: introHtml }} />
              <AdSlot key={`top-${article.slug}`} slot={AD_SLOTS.articleTop} />
              {restHtml && <div className="article-body" dangerouslySetInnerHTML={{ __html: restHtml }} />}
            </>
          ) : (
            <div className="article-body" dangerouslySetInnerHTML={{ __html: articleBody }} />
          )}

          {tags.length > 0 && (
            <ul className="article-detail__tags" aria-label="Tags">
              {tags.map(tag => (
                <li key={tag}>
                  <Link to={`/search?q=${encodeURIComponent(tag)}`} className="tag tag--muted">#{tag}</Link>
                </li>
              ))}
            </ul>
          )}

          {/* End-of-article ad (renders nothing unless AdSense is configured) */}
          <AdSlot key={`end-${article.slug}`} slot={AD_SLOTS.articleEnd} />

          <div className="article-detail__end-share">
            <span>Enjoyed this story? Pass it on.</span>
            <ShareBar title={title} />
          </div>

          <aside className="article-detail__author-card" aria-label="About the author">
            <Avatar src={author.avatar} name={author.name} size="xl" verified={author.verified} />
            <div className="article-detail__author-card-body">
              <span className="article-detail__author-card-label">Written by</span>
              <Link to={`/writer/${author.username}`} className="article-detail__author-card-name">{author.name}</Link>
              {author.bio && <p className="article-detail__author-card-bio">{author.bio}</p>}
              <Button to={`/writer/${author.username}`} variant="outline" size="sm">More from {author.name.split(' ')[0]}</Button>
            </div>
          </aside>

          {related && related.length > 0 && (
            <nav className="article-related" aria-label={`More in ${category.name}`}>
              <h2 className="article-related__title">More in {category.name}</h2>
              <ul>
                {related.map(a => (
                  <li key={a.slug}><Link to={`/article/${a.slug}`}>{a.title}</Link></li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </article>
    </>
  );
};

export default ArticleDetailPage;
