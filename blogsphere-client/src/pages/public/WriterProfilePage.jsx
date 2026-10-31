import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiTwitter, FiEdit3 } from 'react-icons/fi';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import ArticleCard from '../../components/article/ArticleCard';
import brand from '../../config/brand';
import { AUTHORS, LATEST_ARTICLES } from '../../data/mockData';
import './WriterProfilePage.css';

const WriterProfilePage = () => {
  const { username } = useParams();
  const author = AUTHORS.find(a => a.username === username) || AUTHORS[0];
  const authorArticles = LATEST_ARTICLES.filter(a => a.author.id === author.id);

  return (
    <>
      <Helmet>
        <title>{author.name} — Writer on {brand.name}</title>
        <meta name="description" content={author.bio} />
      </Helmet>

      <div className="writer-profile">
        {/* Hero banner */}
        <div className="writer-profile__banner">
          <div className="writer-profile__banner-glow" aria-hidden="true" />
        </div>

        <div className="container writer-profile__inner">
          {/* Profile card */}
          <div className="writer-profile__card glass-card">
            <Avatar src={author.avatar} name={author.name} size="2xl" verified={author.verified} ring />
            <div className="writer-profile__info">
              <div className="writer-profile__name-row">
                <h1 className="writer-profile__name">{author.name}</h1>
                {author.verified && <span className="writer-profile__verified-badge">✓ Verified Writer</span>}
              </div>
              <p className="writer-profile__username">@{author.username}</p>
              <p className="writer-profile__bio">{author.bio}</p>
              <div className="writer-profile__stats">
                <div className="writer-profile__stat">
                  <span className="writer-profile__stat-val gradient-text">{(author.followers / 1000).toFixed(1)}k</span>
                  <span className="writer-profile__stat-label">Followers</span>
                </div>
                <div className="writer-profile__stat-divider" />
                <div className="writer-profile__stat">
                  <span className="writer-profile__stat-val gradient-text">{author.articles}</span>
                  <span className="writer-profile__stat-label">Articles</span>
                </div>
              </div>
              <div className="writer-profile__actions">
                <Button variant="primary" size="md">Follow</Button>
                <Button variant="ghost" size="md" icon={<FiTwitter />}>Follow on X</Button>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="writer-profile__articles">
            <h2 className="writer-profile__articles-title">
              {authorArticles.length > 0
                ? `${authorArticles.length} Published Article${authorArticles.length !== 1 ? 's' : ''}`
                : 'No published articles yet'
              }
            </h2>
            {authorArticles.length > 0 ? (
              <div className="grid-3 stagger-children">
                {authorArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="writer-profile__empty">
                <span>✍️</span>
                <p>This writer hasn't published any articles yet.</p>
              </div>
            )}
          </div>

          {/* Write CTA for visitors */}
          <div className="writer-profile__cta glass-card">
            <p>Want to share your own stories?</p>
            <Link to="/register">
              <Button variant="primary" size="md" icon={<FiEdit3 />}>
                Start writing on {brand.name}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default WriterProfilePage;
