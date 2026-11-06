import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import ArticleCard from '../../components/article/ArticleCard';
import SearchBar from '../../components/search/SearchBar';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { articleApi } from '../../services/api';
import { normalizeArticle } from '../../utils/normalizeArticle';
import useApi from '../../hooks/useApi';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  // Sync query from URL on mount
  useEffect(() => { setQuery(searchParams.get('q') || ''); }, [searchParams]);

  // Server-side search across titles, excerpts, tags, categories and writer names
  const trimmed = query.trim();
  const { data, loading, error } = useApi(
    trimmed
      ? () => articleApi.getArticles({ search: trimmed, limit: 50 })
          .then(res => (res?.data?.articles || []).map(normalizeArticle))
      : null,
    [trimmed]
  );
  const results = trimmed ? (data || []) : [];

  const handleSearch = (q) => {
    setQuery(q);
    setSearchParams({ q });
  };

  return (
    <>
      <Seo title={query ? `"${query}" — Search` : 'Search'} description={`Search articles on ${brand.name}`} path="/search" noindex />

      <div className="search-page">
        <div className="container">
          <div className="search-page__header">
            <FiSearch className="search-page__icon" size={32} />
            <h1 className="search-page__title">Search</h1>
          </div>

          <div className="search-page__bar">
            <SearchBar variant="page" placeholder="Search articles, writers, topics…" onSearch={handleSearch} />
          </div>

          {query && !loading && (
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

          {query && !loading && results.length === 0 && (
            <div className="search-page__empty">
              <span>{error ? '⚠️' : '😕'}</span>
              <p>{error ? error.message : 'No articles match your search. Try different keywords.'}</p>
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
