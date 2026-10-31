import React from 'react';
import { Helmet } from 'react-helmet-async';
import ArticleCard from '../../components/article/ArticleCard';
import brand from '../../config/brand';
import { LATEST_ARTICLES } from '../../data/mockData';

const LatestPage = () => (
  <>
    <Helmet>
      <title>Latest — {brand.name}</title>
      <meta name="description" content={`The newest articles published on ${brand.name}.`} />
    </Helmet>
    <div style={{ padding: 'var(--space-12) 0 var(--space-20)' }}>
      <div className="container">
        <h1 className="gradient-text" style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-5xl)', fontWeight: 'var(--font-extrabold)', letterSpacing: '-0.03em', marginBottom: 'var(--space-2)' }}>
          Latest
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-10)' }}>
          Fresh articles, published just now
        </p>
        <div className="grid-3 stagger-children">
          {LATEST_ARTICLES.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  </>
);

export default LatestPage;
