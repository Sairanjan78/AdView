import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiClock, FiArrowRight } from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import './FeaturedCard.css';

/**
 * Large featured/hero article card — used in the hero section and featured carousel.
 */
const FeaturedCard = ({ article, size = 'md' }) => {
  const { slug, title, excerpt, cover, category, author, publishedAt, readTime, likes, comments } = article;
  const timeAgo = formatDistanceToNow(new Date(publishedAt), { addSuffix: true });

  return (
    <article className={`featured-card featured-card--${size} hover-lift`}>
      {/* Background image */}
      <div className="featured-card__bg">
        <img src={cover} alt={title} loading="lazy" />
        <div className="featured-card__overlay" />
      </div>

      {/* Content */}
      <div className="featured-card__content">
        {/* Category badge */}
        <div className="featured-card__top">
          <Link to={`/categories/${category.slug}`} className="featured-card__category" style={{ '--cat-color': category.color }}>
            {category.icon} {category.name}
          </Link>
          <span className="featured-card__read-time">
            <FiClock size={12} /> {readTime} min
          </span>
        </div>

        {/* Title */}
        <Link to={`/article/${slug}`}>
          <h2 className="featured-card__title line-clamp-2">{title}</h2>
        </Link>

        <p className="featured-card__excerpt line-clamp-2">{excerpt}</p>

        {/* Author + stats */}
        <div className="featured-card__footer">
          <Link to={`/writer/${author.username}`} className="featured-card__author">
            <Avatar src={author.avatar} name={author.name} size="sm" verified={author.verified} ring />
            <div className="featured-card__author-info">
              <span className="featured-card__author-name">{author.name}</span>
              <span className="featured-card__author-time">{timeAgo}</span>
            </div>
          </Link>
          <div className="featured-card__stats">
            <span><FiHeart size={13} /> {(likes / 1000).toFixed(1)}k</span>
            <span><FiMessageCircle size={13} /> {comments}</span>
          </div>
        </div>

        <Link to={`/article/${slug}`} className="featured-card__cta">
          Read article <FiArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
};

export default FeaturedCard;
