import React from 'react';
import { LuClock, LuCircleAlert, LuPenLine, LuNewspaper } from 'react-icons/lu';
import ArticleCard from '../../components/article/ArticleCard';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { articleApi } from '../../services/api';
import { normalizeArticle } from '../../utils/normalizeArticle';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';

const LatestPage = () => {
  const { isWriter } = useAuth();
  const { data, loading, error } = useApi(() =>
    articleApi.getArticles({ limit: 24 }).then(res => (res?.data?.articles || []).map(normalizeArticle))
  );
  const articles = data || [];

  return (
    <>
      <Seo title="Latest" description={`The newest articles published on ${brand.name}.`} />
      <div className="container">
        <header className="page-header">
          <p className="page-eyebrow"><LuClock size={14} aria-hidden="true" /> Latest</p>
          <h1 className="page-title">Fresh off the press</h1>
          <p className="page-lede">The newest articles on {brand.name}, most recent first.</p>
        </header>

        <div className="grid-3 stagger-children">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {!loading && articles.length === 0 && (
          error ? (
            <EmptyState icon={LuCircleAlert} tone="error" title="We couldn’t load the articles">{error.message}</EmptyState>
          ) : (
            <EmptyState
              icon={LuNewspaper}
              title="No articles published yet"
              action={isWriter && <Button to="/write" variant="primary" icon={<LuPenLine />}>Write your first post</Button>}
            >
              New articles will appear here as soon as they are published.
            </EmptyState>
          )
        )}
      </div>
    </>
  );
};

export default LatestPage;
