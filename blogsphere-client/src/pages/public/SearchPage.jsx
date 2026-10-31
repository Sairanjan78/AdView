import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiSearch } from 'react-icons/fi';
import ArticleCard from '../../components/article/ArticleCard';
import SearchBar from '../../components/search/SearchBar';
import brand from '../../config/brand';
import { LATEST_ARTICLES } from '../../data/mockData';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  // Sync query from URL on mount
  useEffect(() => { setQuery(searchParams.get('q') || ''); }, [searchParams]);

  const results = query.trim()
    ? LATEST_ARTICLES.filter(a => {
        const q = query.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some(t => t.toLowerCase().includes(q)) ||
          a.category.name.toLowerCase().includes(q) ||
          a.author.name.toLowerCase().includes(q)
        );
      })
    : [];

  const handleSearch = (q) => {
    setQuery(q);
    setSearchParams({ q });
  };

  return (
    <>
      <Helmet>
        <title>{query ? `"${query}" — Search` : 'Search'} — {brand.name}</title>
        <meta name="description" content={`Search articles on ${brand.name}`} />
      </Helmet>

      <div className="search-page">
        <div className="container">
          <div className="search-page__header">
            <FiSearch className="search-page__icon" size={32} />
            <h1 className="search-page__title">Search</h1>
          </div>

          <div className="search-page__bar">
            <SearchBar variant="page" placeholder="Search articles, writers, topics…" onSearch={handleSearch} />
          </div>

          {query && (
            <p className="search-page__meta">
              {results.length > 0
                ? <><strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "<em>{query}</em>"</>
                : <>No results for "<em>{query}</em>"</>
              }
            </p>
          )}

          {!query && (
            <div className="search-page__empty">
              <span>🔍</span>
              <p>Type something to search across all articles</p>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="search-page__empty">
              <span>😕</span>
              <p>No articles match your search. Try different keywords.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid-3 stagger-children">
              {results.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
