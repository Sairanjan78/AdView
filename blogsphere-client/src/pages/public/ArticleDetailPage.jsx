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
  const articleBody = toHtml(content, excerpt);
  const [introHtml, restHtml] = splitAfterIntro(articleBody);

  return (
    <>
      <Seo
        title={title}
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
          author: { '@type': 'Person', name: author.name, url: `${brand.url}/writer/${author.username}` },
          publisher: { '@type': 'Organization', name: brand.name, logo: { '@type': 'ImageObject', url: `${brand.url}/logo512.png` } },
          mainEntityOfPage: `${brand.url}/article/${article.slug}`,
          articleSection: category.name,
          keywords: tags.join(', '),
          }, {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${brand.url}/` },
              { '@type': 'ListItem', position: 2, name: category.name, item: `${brand.url}/categories/${category.slug}` },
              { '@type': 'ListItem', position: 3, name: title, item: `${brand.url}/article/${article.slug}` },
            ],
          }],
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
        </div>
      </article>
    </>
  );
};

export default ArticleDetailPage;
