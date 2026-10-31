import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiArrowRight, FiTrendingUp, FiClock, FiEdit3, FiStar, FiZap,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import FeaturedCard from '../../components/article/FeaturedCard';
import ArticleCard from '../../components/article/ArticleCard';
import SearchBar from '../../components/search/SearchBar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import {
  FEATURED_ARTICLES, LATEST_ARTICLES, TRENDING_ARTICLES, CATEGORIES, AUTHORS,
} from '../../data/mockData';
import './HomePage.css';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>{brand.name} — {brand.tagline}</title>
        <meta name="description" content={brand.description} />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero" aria-label="Hero">
        <div className="hero__bg-glow" aria-hidden="true" />
        <div className="hero__orb hero__orb--1" aria-hidden="true" />
        <div className="hero__orb hero__orb--2" aria-hidden="true" />

        <div className="container hero__inner">
          <div className="hero__copy animate-fadeInUp">
            <div className="hero__eyebrow">
              <FiZap size={13} />
              Global multi-niche publishing
            </div>
            <h1 className="hero__headline">
              Where great ideas{' '}
              <span className="gradient-text">find their world</span>
            </h1>
            <p className="hero__sub">
              Discover thought-provoking stories across technology, science, travel, culture and more.
              Write, publish, and reach readers everywhere.
            </p>

            <div className="hero__search">
              <SearchBar variant="hero" placeholder="Search articles, writers, topics…" />
            </div>

            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-number gradient-text">120K+</span>
                <span className="hero__stat-label">Readers</span>
              </div>
              <div className="hero__stat-divider" aria-hidden="true" />
              <div className="hero__stat">
                <span className="hero__stat-number gradient-text">8.4K+</span>
                <span className="hero__stat-label">Writers</span>
              </div>
              <div className="hero__stat-divider" aria-hidden="true" />
              <div className="hero__stat">
                <span className="hero__stat-number gradient-text">45K+</span>
                <span className="hero__stat-label">Articles</span>
              </div>
            </div>
          </div>

          {/* Featured article hero card */}
          <div className="hero__featured animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
            {FEATURED_ARTICLES[0] && (
              <FeaturedCard article={FEATURED_ARTICLES[0]} size="lg" />
            )}
          </div>
        </div>
      </section>

      {/* ── Category Pills ────────────────────────────────── */}
      <section className="section section--sm category-strip" aria-label="Browse categories">
        <div className="container">
          <div className="category-strip__scroll" role="list">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="category-pill"
                style={{ '--cat-color': cat.color }}
                role="listitem"
              >
                <span className="category-pill__icon">{cat.icon}</span>
                <span className="category-pill__name">{cat.name}</span>
                <span className="category-pill__count">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Articles ─────────────────────────────── */}
      <section className="section" aria-label="Featured articles">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <FiStar className="section-title-icon" />
              Featured
            </h2>
            <Link to="/explore" className="section-link">
              View all <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="featured-grid stagger-children">
            {FEATURED_ARTICLES.map((article, i) => (
              <FeaturedCard
                key={article.id}
                article={article}
                size={i === 0 ? 'lg' : 'sm'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending + Latest ─────────────────────────────── */}
      <section className="section trending-latest" aria-label="Trending and latest articles">
        <div className="container">
          <div className="trending-latest__grid">

            {/* Trending */}
            <div className="trending-latest__col">
              <div className="section-header">
                <h2 className="section-title">
                  <FiTrendingUp className="section-title-icon" style={{ color: 'var(--color-secondary)' }} />
                  Trending
                </h2>
                <Link to="/trending" className="section-link">All <FiArrowRight size={13} /></Link>
              </div>
              <ol className="trending-list stagger-children" aria-label="Trending articles">
                {TRENDING_ARTICLES.map((article, index) => (
                  <TrendingItem key={article.id} article={article} rank={index + 1} />
                ))}
              </ol>
            </div>

            {/* Latest */}
            <div className="trending-latest__col">
              <div className="section-header">
                <h2 className="section-title">
                  <FiClock className="section-title-icon" style={{ color: 'var(--color-accent)' }} />
                  Latest
                </h2>
                <Link to="/latest" className="section-link">All <FiArrowRight size={13} /></Link>
              </div>
              <div className="latest-list stagger-children">
                {LATEST_ARTICLES.slice(0, 4).map(article => (
                  <LatestItem key={article.id} article={article} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Article Grid ──────────────────────────────────── */}
      <section className="section" aria-label="Recent articles">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Discover More</h2>
            <Link to="/explore" className="section-link">Explore all <FiArrowRight size={14} /></Link>
          </div>
          <div className="grid-3 stagger-children">
            {LATEST_ARTICLES.slice(0, 6).map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Writers ───────────────────────────────────── */}
      <section className="section writer-spotlight" aria-label="Featured writers">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Top Writers</h2>
            <Link to="/explore" className="section-link">View all <FiArrowRight size={14} /></Link>
          </div>
          <div className="writers-grid stagger-children">
            {AUTHORS.map(author => (
              <WriterCard key={author.id} author={author} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Write CTA ─────────────────────────────────────── */}
      <section className="section write-cta" aria-label="Become a writer">
        <div className="container">
          <div className="write-cta__card">
            <div className="write-cta__glow" aria-hidden="true" />
            <div className="write-cta__content">
              <div className="write-cta__icon" aria-hidden="true">✦</div>
              <h2 className="write-cta__title">
                Share your story with the{' '}
                <span className="gradient-text">world</span>
              </h2>
              <p className="write-cta__sub">
                Join 8,000+ writers on {brand.name}. Publish your ideas, grow your audience,
                and earn from eligible advertising revenue under our transparent revenue-sharing programme.
              </p>
              <div className="write-cta__actions">
                <Link to="/register">
                  <Button variant="primary" size="lg" icon={<FiEdit3 />} iconRight={<FiArrowRight />}>
                    Start writing today
                  </Button>
                </Link>
                <Link to="/writer-monetization-policy">
                  <Button variant="ghost" size="lg">Learn about earnings</Button>
                </Link>
              </div>
              <p className="write-cta__disclaimer">
                Earnings are based on eligible advertising revenue and platform policy.
                No earnings are guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

/* ── Sub-components ─────────────────────────────────────── */

const TrendingItem = ({ article, rank }) => (
  <li className="trending-item animate-fadeInUp">
    <span className="trending-item__rank" aria-label={`Rank ${rank}`}>{String(rank).padStart(2, '0')}</span>
    <div className="trending-item__body">
      <Link to={`/categories/${article.category.slug}`} className="trending-item__cat" style={{ color: article.category.color }}>
        {article.category.icon} {article.category.name}
      </Link>
      <Link to={`/article/${article.slug}`}>
        <h3 className="trending-item__title line-clamp-2">{article.title}</h3>
      </Link>
      <div className="trending-item__meta">
        <Avatar src={article.author.avatar} name={article.author.name} size="xs" />
        <span>{article.author.name}</span>
        <span>·</span>
        <span>{article.readTime} min read</span>
      </div>
    </div>
    {article.cover && (
      <Link to={`/article/${article.slug}`} tabIndex={-1}>
        <img src={article.cover} alt="" className="trending-item__thumb" loading="lazy" />
      </Link>
    )}
  </li>
);

const LatestItem = ({ article }) => (
  <div className="latest-item animate-fadeInUp">
    {article.cover && (
      <Link to={`/article/${article.slug}`} tabIndex={-1}>
        <img src={article.cover} alt="" className="latest-item__thumb" loading="lazy" />
      </Link>
    )}
    <div className="latest-item__body">
      <Link to={`/categories/${article.category.slug}`} className="latest-item__cat" style={{ color: article.category.color }}>
        {article.category.icon} {article.category.name}
      </Link>
      <Link to={`/article/${article.slug}`}>
        <h3 className="latest-item__title line-clamp-2">{article.title}</h3>
      </Link>
      <span className="latest-item__time">
        <FiClock size={11} /> {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
      </span>
    </div>
  </div>
);

const WriterCard = ({ author }) => (
  <Link to={`/writer/${author.username}`} className="writer-card glass-card hover-lift animate-fadeInUp">
    <Avatar src={author.avatar} name={author.name} size="lg" verified={author.verified} ring />
    <div className="writer-card__info">
      <span className="writer-card__name">{author.name}</span>
      <span className="writer-card__bio line-clamp-2">{author.bio}</span>
    </div>
    <div className="writer-card__stats">
      <div className="writer-card__stat">
        <span className="writer-card__stat-val">{(author.followers / 1000).toFixed(1)}k</span>
        <span className="writer-card__stat-label">Followers</span>
      </div>
      <div className="writer-card__stat">
        <span className="writer-card__stat-val">{author.articles}</span>
        <span className="writer-card__stat-label">Articles</span>
      </div>
    </div>
  </Link>
);

export default HomePage;
