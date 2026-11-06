import React from 'react';
import { Link } from 'react-router-dom';
import { LuTrendingUp, LuEye, LuCircleAlert } from 'react-icons/lu';
import Avatar from '../../components/ui/Avatar';
import CategoryIcon from '../../components/ui/CategoryIcon';
import EmptyState from '../../components/ui/EmptyState';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { articleApi } from '../../services/api';
import { normalizeArticle } from '../../utils/normalizeArticle';
import { formatCount, formatPublished, toIsoDate } from '../../utils/format';
import useApi from '../../hooks/useApi';
import CoverImage from '../../components/ui/CoverImage';
import './TrendingPage.css';

const TrendingPage = () => {
  const { data, loading, error } = useApi(() =>
    articleApi.getTrending({ limit: 10 }).then(res => (res?.data?.articles || []).map(normalizeArticle))
  );
  const articles = data || [];

  return (
    <>
      <Seo title="Trending" description={`The most-read articles on ${brand.name} right now.`} />

      <div className="container trending-page">
        <header className="page-header">
          <p className="page-eyebrow"><LuTrendingUp size={14} aria-hidden="true" /> Trending</p>
          <h1 className="page-title">Most read</h1>
          <p className="page-lede">The stories readers are spending the most time with right now.</p>
        </header>

        <ol className="trending-page__list" aria-label="Trending articles">
          {articles.map((article, index) => (
            <li key={article.id} className="trending-page__item animate-fadeInUp" style={{ animationDelay: `${index * 0.05}s` }}>
              <span className="trending-page__rank" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className="trending-page__body">
                <Link to={`/categories/${article.category.slug}`} className="kicker" style={{ '--cat-color': article.category.color }}>
                  <CategoryIcon icon={article.category.icon} size={13} /> {article.category.name}
                </Link>
                <h2 className="trending-page__article-title">
                  <Link to={`/article/${article.slug}`}>{article.title}</Link>
                </h2>
                <p className="trending-page__excerpt line-clamp-2">{article.excerpt}</p>
                <div className="trending-page__meta">
                  <Link to={`/writer/${article.author.username}`} className="trending-page__author">
                    <Avatar src={article.author.avatar} name={article.author.name} size="xs" />
                    <span>{article.author.name}</span>
                  </Link>
                  <span aria-hidden="true">·</span>
                  <time dateTime={toIsoDate(article.publishedAt)}>{formatPublished(article.publishedAt)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{article.readTime} min read</span>
                  {article.views > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="trending-page__views"><LuEye size={13} aria-hidden="true" /> {formatCount(article.views)}</span>
                    </>
                  )}
                </div>
              </div>
              <Link to={`/article/${article.slug}`} className="trending-page__cover" tabIndex={-1} aria-hidden="true">
                <CoverImage src={article.cover} loading="lazy" />
              </Link>
            </li>
          ))}
        </ol>

        {!loading && articles.length === 0 && (
          error
            ? <EmptyState icon={LuCircleAlert} tone="error" title="We couldn’t load trending articles">{error.message}</EmptyState>
            : <EmptyState icon={LuTrendingUp} title="Nothing trending yet">Once articles start getting read, the most popular ones will show up here.</EmptyState>
        )}
      </div>
    </>
  );
};

export default TrendingPage;
