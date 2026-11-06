import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark,
  FiTwitter, FiLinkedin, FiEye,
} from 'react-icons/fi';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import AdSlot from '../../components/ads/AdSlot';
import { AD_SLOTS, isAdsEnabled } from '../../config/ads';
import { articleApi } from '../../services/api';
import { normalizeArticle } from '../../utils/normalizeArticle';
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

const ArticleDetailPage = () => {
  const { slug } = useParams();
  const { data: article, loading, error } = useApi(
    () => articleApi.getArticleBySlug(slug).then(res => normalizeArticle(res?.data?.article)),
    [slug]
  );

  if (loading) {
    return (
      <div className="article-not-found container">
        <p>Loading…</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-not-found container">
        <h1>{error && error.status !== 404 ? 'Could not load this article' : 'Article not found'}</h1>
        {error && error.status !== 404 && <p>{error.message}</p>}
        <Link to="/">← Back home</Link>
      </div>
    );
  }

  const { title, excerpt, content, cover, category, author, publishedAt, readTime, likes, comments, views, tags } = article;

  // Use live content if available, otherwise editorial placeholder
  const articleBody = content 
    ? (content.includes('<') ? content : `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`)
    : `
    <p>${excerpt}</p>
    <p>This is a placeholder article body. The platform supports full rich-text articles, dynamic read counts, and responsive typography.</p>
    <h2>Why this matters</h2>
    <p>The blogging platform architecture is designed from the ground up to support writer productivity and reader engagement simultaneously.</p>
    <blockquote>Great writing deserves great presentation. BlogSphere is built to make both effortless.</blockquote>
  `;

  const [introHtml, restHtml] = splitAfterIntro(articleBody);

  return (
    <>
      <Seo
        title={title}
        description={excerpt}
        path={`/article/${article.slug}`}
        image={cover}
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
          '@type': 'BlogPosting',
          headline: title,
          description: excerpt,
          image: [cover],
          datePublished: new Date(publishedAt).toISOString(),
          dateModified: new Date(article.updatedAt || publishedAt).toISOString(),
          author: { '@type': 'Person', name: author.name, url: `${brand.url}/writer/${author.username}` },
          publisher: { '@type': 'Organization', name: brand.name, logo: { '@type': 'ImageObject', url: `${brand.url}/logo512.png` } },
          mainEntityOfPage: `${brand.url}/article/${article.slug}`,
          articleSection: category.name,
          keywords: tags.join(', '),
        }}
      />

      <div className="article-detail">
        {/* Hero cover */}
        <div className="article-detail__hero">
          <img src={cover} alt={title} className="article-detail__hero-img" />
          <div className="article-detail__hero-overlay" />
          <div className="article-detail__hero-content container">
            <Link to={`/categories/${category.slug}`} className="article-detail__category-badge" style={{ '--cat-color': category.color }}>
              {category.icon} {category.name}
            </Link>
            <h1 className="article-detail__title">{title}</h1>
            <p className="article-detail__excerpt">{excerpt}</p>
            {/* Meta */}
            <div className="article-detail__hero-meta">
              <Link to={`/writer/${author.username}`} className="article-detail__author-link">
                <Avatar src={author.avatar} name={author.name} size="md" verified={author.verified} ring />
                <div>
                  <div className="article-detail__author-name">{author.name}</div>
                  <div className="article-detail__author-date">
                    {format(new Date(publishedAt), 'MMMM d, yyyy')} · {readTime} min read
                  </div>
                </div>
              </Link>
              <div className="article-detail__hero-stats">
                <span><FiEye size={14}/> {(views/1000).toFixed(1)}k</span>
                <span><FiHeart size={14}/> {(likes/1000).toFixed(1)}k</span>
                <span><FiMessageCircle size={14}/> {comments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: content + sidebar */}
        <div className="container article-detail__layout">

          {/* Action sidebar */}
          <aside className="article-detail__sidebar" aria-label="Article actions">
            <div className="article-detail__actions">
              <button className="article-action-btn" aria-label="Like article">
                <FiHeart /> <span>{(likes/1000).toFixed(1)}k</span>
              </button>
              <button className="article-action-btn" aria-label="Comments">
                <FiMessageCircle /> <span>{comments}</span>
              </button>
              <button className="article-action-btn" aria-label="Bookmark">
                <FiBookmark />
              </button>
              <button className="article-action-btn" aria-label="Share">
                <FiShare2 />
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="article-detail__content" id="article-content">
            {isAdsEnabled() && AD_SLOTS.articleTop ? (
              <>
                <div
                  className="article-body"
                  dangerouslySetInnerHTML={{ __html: introHtml }}
                />
                <AdSlot key={`top-${article.slug}`} slot={AD_SLOTS.articleTop} />
                {restHtml && (
                  <div
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: restHtml }}
                  />
                )}
              </>
            ) : (
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: articleBody }}
              />
            )}

            {/* Tags */}
            <div className="article-detail__tags">
              {tags.map(tag => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="tag tag--muted">
                  #{tag}
                </Link>
              ))}
            </div>

            {/* End-of-article ad (renders nothing unless AdSense is configured) */}
            <AdSlot key={`end-${article.slug}`} slot={AD_SLOTS.articleEnd} />

            {/* Share bar */}
            <div className="article-detail__share">
              <span className="article-detail__share-label">Share this article</span>
              <div className="article-detail__share-btns">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="article-share-btn article-share-btn--twitter"
                  aria-label="Share on Twitter"
                >
                  <FiTwitter /> Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="article-share-btn article-share-btn--linkedin"
                  aria-label="Share on LinkedIn"
                >
                  <FiLinkedin /> LinkedIn
                </a>
              </div>
            </div>

            {/* Author bio card */}
            <div className="article-detail__author-card glass-card">
              <Avatar src={author.avatar} name={author.name} size="xl" verified={author.verified} ring />
              <div className="article-detail__author-card-body">
                <Link to={`/writer/${author.username}`} className="article-detail__author-card-name">
                  {author.name}
                </Link>
                <p className="article-detail__author-card-bio">{author.bio}</p>
                <div className="article-detail__author-card-stats">
                  <span>{(author.followers/1000).toFixed(1)}k followers</span>
                  <span>·</span>
                  <span>{author.articles} articles</span>
                </div>
                <Link to={`/writer/${author.username}`}>
                  <Button variant="outline" size="sm">View profile</Button>
                </Link>
              </div>
            </div>

            {/* Comments placeholder */}
            <div className="article-detail__comments-placeholder glass-card">
              <h3>Discussion & Reader Thoughts</h3>
              <p>Articles are open for all readers to view freely. Reader commenting and reactions will be available here.</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ArticleDetailPage;
