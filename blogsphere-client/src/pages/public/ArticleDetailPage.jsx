import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import {
  FiHeart, FiMessageCircle, FiShare2, FiBookmark,
  FiTwitter, FiLinkedin, FiEye,
} from 'react-icons/fi';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import { LATEST_ARTICLES } from '../../data/mockData';
import './ArticleDetailPage.css';

const ArticleDetailPage = () => {
  const { slug } = useParams();
  const article = LATEST_ARTICLES.find(a => a.slug === slug) || LATEST_ARTICLES[0];

  if (!article) {
    return (
      <div className="article-not-found container">
        <h1>Article not found</h1>
        <Link to="/">← Back home</Link>
      </div>
    );
  }

  const { title, excerpt, cover, category, author, publishedAt, readTime, likes, comments, views, tags } = article;

  // Dummy article body — replaced by real rich text in Phase 3
  const articleBody = `
    <p>${excerpt}</p>
    <p>This is a placeholder article body. In Phase 3 of BlogSphere development, the full rich-text content will be rendered here using TipTap — a powerful, extensible editor that produces clean HTML output sanitised before display.</p>
    <h2>Why this matters</h2>
    <p>The blogging platform architecture is designed from the ground up to support writer productivity and reader engagement simultaneously. Every design decision — from the article detail layout to the engagement metrics — reflects real publishing platform best practices.</p>
    <h2>What comes next</h2>
    <p>After Phase 1 (frontend foundation) and Phase 2 (authentication), Phase 3 will implement the full article creation and editing experience, complete with image uploads via Cloudinary, tag management, and draft saving.</p>
    <blockquote>Great writing deserves great presentation. BlogSphere is built to make both effortless.</blockquote>
    <p>The approval workflow in Phase 4 ensures only quality content reaches readers, while Phase 5 adds the social layer: comments, likes, bookmarks, and follows that keep readers engaged.</p>
  `;

  return (
    <>
      <Helmet>
        <title>{title} — {brand.name}</title>
        <meta name="description" content={excerpt} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:image" content={cover} />
        <meta property="og:type" content="article" />
      </Helmet>

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
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: articleBody }}
            />

            {/* Tags */}
            <div className="article-detail__tags">
              {tags.map(tag => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="tag tag--muted">
                  #{tag}
                </Link>
              ))}
            </div>

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
