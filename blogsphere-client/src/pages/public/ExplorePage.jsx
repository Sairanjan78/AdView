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
import CategoryIcon from '../../components/ui/CategoryIcon';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { LuCompass, LuSearchX, LuCircleAlert, LuPenLine } from 'react-icons/lu';

const ExplorePage = () => {
  // Also mounted at /categories/:slug - preselect that category
  const { slug } = useParams();
  const [activeCategory, setActiveCategory] = useState(slug || 'all');
  const { categories: CATEGORIES } = useCategories();
  const { isWriter } = useAuth();

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
          <header className="page-header">
            <p className="page-eyebrow"><LuCompass size={14} aria-hidden="true" /> Explore</p>
            <h1 className="page-title">{activeCategoryMeta ? activeCategoryMeta.name : 'Every story, every topic'}</h1>
            <p className="page-lede">
              {activeCategoryMeta?.description || (activeCategoryMeta
                ? `The latest ${activeCategoryMeta.name.toLowerCase()} articles on ${brand.name}.`
                : 'Browse everything we have published, or narrow it down by category.')}
            </p>
          </header>

          {/* Category filter */}
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
                <CategoryIcon icon={cat.icon} size={15} /> {cat.name}
              </button>
            ))}
          </div>

          <p className="page-meta" aria-live="polite">
            {loading ? 'Loading articles…' : `${total} article${total !== 1 ? 's' : ''}`}
          </p>

          {filtered.length > 0 ? (
            <div className="grid-3 stagger-children">
              {filtered.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : !loading && (
            error ? (
              <EmptyState icon={LuCircleAlert} tone="error" title="We couldn’t load the articles">{error.message}</EmptyState>
            ) : (
              <EmptyState
                icon={LuSearchX}
                title={activeCategory === 'all' ? 'No articles yet' : 'Nothing here yet'}
                action={isWriter
                  ? <Button to="/write" variant="primary" icon={<LuPenLine />}>Write {activeCategory === 'all' ? 'your first post' : 'one now'}</Button>
                  : activeCategory !== 'all' && <Button variant="outline" onClick={() => setActiveCategory('all')}>Show all articles</Button>}
              >
                {activeCategory === 'all'
                  ? 'Published articles will show up here.'
                  : 'No articles have been published in this category yet.'}
              </EmptyState>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default ExplorePage;
