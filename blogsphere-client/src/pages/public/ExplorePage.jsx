import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ArticleCard from '../../components/article/ArticleCard';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { articleApi } from '../../services/api';
import { normalizeArticle } from '../../utils/normalizeArticle';
import useApi from '../../hooks/useApi';
import useCategories from '../../hooks/useCategories';
import './ExplorePage.css';

const ExplorePage = () => {
  // Also mounted at /categories/:slug - preselect that category
  const { slug } = useParams();
  const [activeCategory, setActiveCategory] = useState(slug || 'all');
  const { categories: CATEGORIES } = useCategories();

  useEffect(() => { setActiveCategory(slug || 'all'); }, [slug]);

  const { data, loading, error } = useApi(
    () => articleApi.getArticles({
      category: activeCategory === 'all' ? undefined : activeCategory,
      limit: 50,
    }),
    [activeCategory]
  );

  const filtered = (data?.data?.articles || []).map(normalizeArticle);
  const total = data?.data?.pagination?.total ?? filtered.length;
  const activeCategoryMeta = slug ? CATEGORIES.find(c => c.slug === slug) : null;

  return (
    <>
      <Seo
        title={activeCategoryMeta ? `${activeCategoryMeta.name} Articles` : 'Explore'}
        description={activeCategoryMeta
          ? `Read the latest ${activeCategoryMeta.name.toLowerCase()} articles on ${brand.name}.`
          : `Explore all articles across every niche on ${brand.name}.`}
        path={slug ? `/categories/${slug}` : '/explore'}
      />

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
            {loading ? 'Loading articles…' : `${total} article${total !== 1 ? 's' : ''} found`}
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid-3 stagger-children">
              {filtered.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : !loading && (
            <div className="explore-empty">
              <span>{error ? '⚠️' : '🔍'}</span>
              <p>{error ? error.message : 'No articles in this category yet.'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExplorePage;
