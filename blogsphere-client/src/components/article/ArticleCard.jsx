import React from 'react';
import { Link } from 'react-router-dom';
import { LuClock } from 'react-icons/lu';
import Avatar from '../ui/Avatar';
import CategoryIcon from '../ui/CategoryIcon';
import { formatPublished, toIsoDate } from '../../utils/format';
import CoverImage from '../ui/CoverImage';
import './ArticleCard.css';

/**
 * Standard article card — used in feeds and grids.
 * The whole card is clickable through the title link; category and author stay separate links.
 */
const ArticleCard = ({ article, className = '', headingLevel = 3 }) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const { slug, title, excerpt, cover, category, author, publishedAt, readTime } = article;

  return (
    <article className={`article-card animate-fadeInUp ${className}`.trim()}>
      <Link to={`/article/${slug}`} className="article-card__cover" tabIndex={-1} aria-hidden="true">
        <CoverImage src={cover} loading="lazy" />
      </Link>

      <div className="article-card__body">
        <Link to={`/categories/${category.slug}`} className="kicker article-card__kicker" style={{ '--cat-color': category.color }}>
          <CategoryIcon icon={category.icon} size={14} /> {category.name}
        </Link>

        <Heading className="article-card__title">
          <Link to={`/article/${slug}`} className="article-card__title-link">{title}</Link>
        </Heading>

        {excerpt && <p className="article-card__excerpt line-clamp-2">{excerpt}</p>}

        <div className="article-card__meta">
          <Link to={`/writer/${author.username}`} className="article-card__author">
            <Avatar src={author.avatar} name={author.name} size="xs" />
            <span className="article-card__author-name">{author.name}</span>
          </Link>
          <span className="article-card__dot" aria-hidden="true">·</span>
          <time dateTime={toIsoDate(publishedAt)}>{formatPublished(publishedAt)}</time>
          <span className="article-card__dot" aria-hidden="true">·</span>
          <span className="article-card__read-time"><LuClock size={12} aria-hidden="true" /> {readTime} min read</span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
