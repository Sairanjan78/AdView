import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiEye, FiClock, FiBookmark } from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import './ArticleCard.css';

/**
 * Standard article card — used in feeds, grids.
 */
const ArticleCard = ({ article, className = '' }) => {
  const {
    slug, title, excerpt, cover, category, author,
    publishedAt, readTime, likes, comments, views,
  } = article;

  const timeAgo = formatDistanceToNow(new Date(publishedAt), { addSuffix: true });

  return (
    <article className={`article-card glass-card hover-lift animate-fadeInUp ${className}`}>
      {/* Cover Image */}
      <Link to={`/article/${slug}`} className="article-card__cover-link" tabIndex={-1}>
        <div className="article-card__cover">
          <img src={cover} alt={title} loading="lazy" />
          <div className="article-card__cover-overlay" />
          <span className="article-card__category-badge" style={{ '--cat-color': category.color }}>
            {category.icon} {category.name}
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="article-card__body">
        {/* Author row */}
        <div className="article-card__author-row">
          <Link to={`/writer/${author.username}`} className="article-card__author-link">
            <Avatar src={author.avatar} name={author.name} size="sm" verified={author.verified} />
            <span className="article-card__author-name">{author.name}</span>
          </Link>
          <span className="article-card__time">
            <FiClock size={11} /> {timeAgo}
          </span>
        </div>

        {/* Title */}
        <Link to={`/article/${slug}`}>
          <h3 className="article-card__title line-clamp-2">{title}</h3>
        </Link>

        {/* Excerpt */}
        <p className="article-card__excerpt line-clamp-2">{excerpt}</p>

        {/* Footer */}
        <div className="article-card__footer">
          <div className="article-card__stats">
            <span className="article-card__stat"><FiEye size={12} /> {formatStat(views)}</span>
            <span className="article-card__stat"><FiHeart size={12} /> {formatStat(likes)}</span>
            <span className="article-card__stat"><FiMessageCircle size={12} /> {comments}</span>
          </div>
          <div className="article-card__actions">
            <span className="article-card__read-time">{readTime} min read</span>
            <button className="article-card__bookmark" aria-label="Bookmark article" title="Bookmark">
              <FiBookmark size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

function formatStat(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n;
}

export default ArticleCard;
