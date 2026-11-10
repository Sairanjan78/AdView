import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LuSearch, LuSearchX, LuCircleAlert } from 'react-icons/lu';
import ArticleCard from '../../components/article/ArticleCard';
import SearchBar from '../../components/search/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
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
      <Seo title={query ? `"${query}" | Search` : 'Search'} description={`Search articles on ${brand.name}`} path="/search" noindex />

      <div className="container search-page">
        <header className="page-header">
          <p className="page-eyebrow"><LuSearch size={14} aria-hidden="true" /> Search</p>
          <h1 className="page-title">{query ? <>Results for “{query}”</> : 'Find a story'}</h1>
          <div className="search-page__bar">
            <SearchBar variant="page" placeholder="Search articles, writers, topics…" onSearch={handleSearch} />
          </div>
        </header>

        {query && !loading && results.length > 0 && (
          <p className="page-meta" aria-live="polite">
            <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''}
          </p>
        )}
        {query && loading && <p className="page-meta" aria-live="polite">Searching…</p>}

        {!query && (
          <EmptyState icon={LuSearch} title="What are you looking for?">
            Search across article titles, summaries, tags, categories and writer names.
          </EmptyState>
        )}

        {query && !loading && results.length === 0 && (
          error
            ? <EmptyState icon={LuCircleAlert} tone="error" title="Search isn’t available right now">{error.message}</EmptyState>
            : <EmptyState icon={LuSearchX} title="No matches">No articles match “{query}”. Try a different or broader keyword.</EmptyState>
        )}

        {results.length > 0 && (
          <div className="grid-3 stagger-children">
            {results.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchPage;
