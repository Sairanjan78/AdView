import React from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuClock } from 'react-icons/lu';
import Avatar from '../ui/Avatar';
import CategoryIcon from '../ui/CategoryIcon';
import { formatPublished, toIsoDate } from '../../utils/format';
import CoverImage from '../ui/CoverImage';
import './FeaturedCard.css';

/**
 * Large featured story: cover image with the headline set over a dark scrim.
 * size 'lg' for the lead story, 'sm' for secondary picks.
 */
const FeaturedCard = ({ article, size = 'md', headingLevel = 'h2' }) => {
  const { slug, title, excerpt, cover, category, author, publishedAt, readTime } = article;
  const Heading = headingLevel;

  return (
    <article className={`featured-card featured-card--${size}`}>
      <div className="featured-card__bg" aria-hidden="true">
        {/* The lead card is the homepage LCP element: load it first */}
        <CoverImage
          src={cover}
          width={1600}
          height={900}
          decoding="async"
          {...(size === 'lg'
            ? { loading: 'eager', fetchPriority: 'high' }
            : { loading: 'lazy' })}
        />
        <div className="featured-card__overlay" />
      </div>

      <div className="featured-card__content">
        <Link to={`/categories/${category.slug}`} className="featured-card__category">
          <CategoryIcon icon={category.icon} size={14} /> {category.name}
        </Link>

        <Heading className="featured-card__title">
          <Link to={`/article/${slug}`} className="featured-card__link">{title}</Link>
        </Heading>

        {size !== 'sm' && excerpt && <p className="featured-card__excerpt line-clamp-2">{excerpt}</p>}

        <div className="featured-card__footer">
          <Link to={`/writer/${author.username}`} className="featured-card__author">
            <Avatar src={author.avatar} name={author.name} size="sm" />
            <span className="featured-card__author-info">
              <span className="featured-card__author-name">{author.name}</span>
              <span className="featured-card__author-time">
                <time dateTime={toIsoDate(publishedAt)}>{formatPublished(publishedAt)}</time>
                {' · '}
                <LuClock size={11} aria-hidden="true" /> {readTime} min read
              </span>
            </span>
          </Link>
          {size === 'lg' && (
            <span className="featured-card__cta" aria-hidden="true">
              Read story <LuArrowRight size={15} />
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default FeaturedCard;
