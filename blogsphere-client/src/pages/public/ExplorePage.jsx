import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ArticleCard from '../../components/article/ArticleCard';
import brand from '../../config/brand';
import { LATEST_ARTICLES, CATEGORIES } from '../../data/mockData';
import './ExplorePage.css';

const ExplorePage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? LATEST_ARTICLES
    : LATEST_ARTICLES.filter(a => a.category.slug === activeCategory);

  return (
    <>
      <Helmet>
        <title>Explore — {brand.name}</title>
        <meta name="description" content={`Explore all articles across every niche on ${brand.name}.`} />
      </Helmet>

      <div className="explore-page">
        <div className="container">
          {/* Page header */}
          <div className="explore-header">
            <div>
              <h1 className="explore-title gradient-text">Explore</h1>
              <p className="explore-sub">Discover articles across every topic imaginable</p>
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="explore-filters" role="tablist" aria-label="Filter by category">
            <button
              role="tab"
              aria-selected={activeCategory === 'all'}
              className={`explore-filter-tab ${activeCategory === 'all' ? 'explore-filter-tab--active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategory === cat.slug}
                className={`explore-filter-tab ${activeCategory === cat.slug ? 'explore-filter-tab--active' : ''}`}
                onClick={() => setActiveCategory(cat.slug)}
                style={{ '--cat-color': cat.color }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="explore-count">
            {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid-3 stagger-children">
              {filtered.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="explore-empty">
              <span>🔍</span>
              <p>No articles in this category yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExplorePage;
