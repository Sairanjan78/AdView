import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiHeart, FiEye, FiMessageCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../../components/ui/Avatar';
import brand from '../../config/brand';
import { TRENDING_ARTICLES } from '../../data/mockData';
import './TrendingPage.css';

const TrendingPage = () => (
  <>
    <Helmet>
      <title>Trending — {brand.name}</title>
      <meta name="description" content={`The most-read articles on ${brand.name} right now.`} />
    </Helmet>

    <div className="trending-page">
      <div className="container">
        <div className="trending-page__header">
          <FiTrendingUp className="trending-page__icon" size={36} />
          <div>
            <h1 className="trending-page__title">Trending Now</h1>
            <p className="trending-page__sub">The most-read articles on the platform right now</p>
          </div>
        </div>

        <ol className="trending-page__list" aria-label="Trending articles">
          {TRENDING_ARTICLES.map((article, index) => (
            <li key={article.id} className="trending-page__item glass-card animate-fadeInUp" style={{ animationDelay: `${index * 0.07}s` }}>
              <span className="trending-page__rank gradient-text">{String(index + 1).padStart(2, '0')}</span>
              <div className="trending-page__cover-wrap">
                <Link to={`/article/${article.slug}`} tabIndex={-1}>
                  <img src={article.cover} alt={article.title} className="trending-page__cover" loading="lazy" />
                </Link>
              </div>
              <div className="trending-page__body">
                <Link to={`/categories/${article.category.slug}`} className="trending-page__cat" style={{ color: article.category.color }}>
                  {article.category.icon} {article.category.name}
                </Link>
                <Link to={`/article/${article.slug}`}>
                  <h2 className="trending-page__article-title">{article.title}</h2>
                </Link>
                <p className="trending-page__excerpt line-clamp-2">{article.excerpt}</p>
                <div className="trending-page__meta">
                  <Link to={`/writer/${article.author.username}`} className="trending-page__author">
                    <Avatar src={article.author.avatar} name={article.author.name} size="sm" verified={article.author.verified} />
                    <span>{article.author.name}</span>
                  </Link>
                  <span className="trending-page__divider" />
                  <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                  <span className="trending-page__divider" />
                  <span>{article.readTime} min read</span>
                </div>
              </div>
              <div className="trending-page__stats">
                <div className="trending-page__stat"><FiEye size={14}/> {(article.views/1000).toFixed(1)}k</div>
                <div className="trending-page__stat"><FiHeart size={14}/> {(article.likes/1000).toFixed(1)}k</div>
                <div className="trending-page__stat"><FiMessageCircle size={14}/> {article.comments}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </>
);

export default TrendingPage;
