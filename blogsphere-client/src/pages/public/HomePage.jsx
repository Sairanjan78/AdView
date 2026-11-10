import React from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowRight, LuTrendingUp, LuClock, LuPenLine, LuSparkles, LuCompass,
} from 'react-icons/lu';
import FeaturedCard from '../../components/article/FeaturedCard';
import ArticleCard from '../../components/article/ArticleCard';
import SearchBar from '../../components/search/SearchBar';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import CategoryIcon from '../../components/ui/CategoryIcon';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import AdSlot from '../../components/ads/AdSlot';
import { AD_SLOTS } from '../../config/ads';
import { articleApi, writerApi } from '../../services/api';
import { normalizeArticle, normalizeWriter } from '../../utils/normalizeArticle';
import { formatPublished, toIsoDate } from '../../utils/format';
import useApi from '../../hooks/useApi';
import useCategories from '../../hooks/useCategories';
import { useAuth } from '../../context/AuthContext';
import CoverImage from '../../components/ui/CoverImage';
import './HomePage.css';

const toArticles = res => (res?.data?.articles || []).map(normalizeArticle);

const HomePage = () => {
  const { isWriter } = useAuth();
  const { categories } = useCategories();
  const { data: featured } = useApi(() => articleApi.getFeatured({ limit: 3 }).then(toArticles));
  const { data: trending } = useApi(() => articleApi.getTrending({ limit: 5 }).then(toArticles));
  const { data: latest, loading: latestLoading, error: latestError } =
    useApi(() => articleApi.getArticles({ limit: 9 }).then(toArticles));
  const { data: writers } = useApi(() =>
    writerApi.getWriters({ limit: 4 }).then(res => (res?.data?.writers || []).map(normalizeWriter))
  );

  const latestList = latest || [];
  const featuredList = featured || [];
  const trendingList = trending || [];
  const writerList = (writers || []).filter(w => w.articles > 0);

  // Lead story: the first featured article, otherwise the newest one
  const lead = featuredList[0] || latestList[0];
  const picks = featuredList.filter(a => a.id !== lead?.id).slice(0, 2);
  const shownIds = new Set([lead?.id, ...picks.map(a => a.id)]);
  const moreStories = latestList.filter(a => !shownIds.has(a.id)).slice(0, 6);
  const noArticles = !latestLoading && latestList.length === 0;

  return (
    <>
      <Seo
        description={brand.homeDescription}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'WebSite', '@id': `${brand.url}/#website`, name: brand.name, url: `${brand.url}/`, inLanguage: 'en-US', publisher: { '@id': `${brand.url}/#organization` } },
            {
              '@type': 'Organization',
              '@id': `${brand.url}/#organization`,
              name: brand.name,
              url: `${brand.url}/`,
              logo: `${brand.url}/logo512.png`,
              sameAs: Object.values(brand.social).filter(Boolean),
            },
          ],
        }}
      />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className={`container hero__inner ${lead ? '' : 'hero__inner--solo'}`}>
          <div className="hero__copy animate-fadeInUp">
            <p className="page-eyebrow"><LuSparkles size={14} aria-hidden="true" /> {brand.tagline}</p>
            <h1 className="hero__headline" id="hero-title">
              Stories worth your <em className="text-accent">time</em>.
            </h1>
            <p className="hero__sub">
              Thoughtful writing on technology, science, travel, culture and more, written to be read,
              not skimmed.
            </p>
            <div className="hero__search">
              <SearchBar variant="hero" placeholder="Search articles, writers, topics…" />
            </div>
          </div>

          {lead && (
            <div className="hero__featured animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <FeaturedCard article={lead} size="lg" />
            </div>
          )}
        </div>
      </section>

      {/* ── Category chips ───────────────────────────────── */}
      <section className="category-strip" id="categories" aria-label="Browse categories">
        <div className="container">
          <ul className="category-strip__scroll">
            {categories.map(cat => (
              <li key={cat.id}>
                <Link to={`/categories/${cat.slug}`} className="category-pill" style={{ '--cat-color': cat.color }}>
                  <CategoryIcon icon={cat.icon} size={16} className="category-pill__icon" />
                  <span className="category-pill__name">{cat.name}</span>
                  {cat.count > 0 && <span className="category-pill__count">{cat.count}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {noArticles ? (
        <section className="section">
          <div className="container">
            <EmptyState
              icon={latestError ? undefined : LuPenLine}
              tone={latestError ? 'error' : 'default'}
              title={latestError ? 'We couldn’t load the stories' : 'No stories yet'}
              action={!latestError && (isWriter
                ? <Button to="/write" variant="primary" icon={<LuPenLine />}>Write your first post</Button>
                : <Button to="/about" variant="outline">About {brand.name}</Button>)}
            >
              {latestError
                ? latestError.message
                : isWriter
                  ? 'Your blog is ready. Publish your first article and it will appear here.'
                  : 'The first articles are on their way. Check back soon.'}
            </EmptyState>
          </div>
        </section>
      ) : (
        <>
          {/* ── Editor's picks ──────────────────────────── */}
          {picks.length > 0 && (
            <section className="section section--tight" id="editors-picks" aria-labelledby="picks-title">
              <div className="container">
                <div className="section-header">
                  <h2 className="section-title" id="picks-title">Editor’s picks</h2>
                  <Link to="/explore" className="section-link">Explore all <LuArrowRight size={14} aria-hidden="true" /></Link>
                </div>
                <div className="picks-grid stagger-children">
                  {picks.map(article => (
                    <FeaturedCard key={article.id} article={article} size="sm" headingLevel="h3" />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Trending + Latest ─────────────────────────── */}
          <section className="section trending-latest" id="most-read" aria-label="Trending and latest articles">
            <div className="container trending-latest__grid">
              <div className="trending-latest__col" id="trending">
                <div className="section-header">
                  <h2 className="section-title">
                    <LuTrendingUp className="section-title-icon" size={22} aria-hidden="true" />
                    Most read
                  </h2>
                  <Link to="/trending" className="section-link">See all <LuArrowRight size={13} aria-hidden="true" /></Link>
                </div>
                <ol className="trending-list" aria-label="Most read articles">
                  {trendingList.map((article, index) => (
                    <TrendingItem key={article.id} article={article} rank={index + 1} />
                  ))}
                </ol>
              </div>

              <div className="trending-latest__col" id="latest">
                <div className="section-header">
                  <h2 className="section-title">
                    <LuClock className="section-title-icon" size={22} aria-hidden="true" />
                    Latest
                  </h2>
                  <Link to="/latest" className="section-link">See all <LuArrowRight size={13} aria-hidden="true" /></Link>
                </div>
                <div className="latest-list">
                  {latestList.slice(0, 4).map(article => (
                    <LatestItem key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Single, unobtrusive home ad (renders nothing unless AdSense is configured) */}
          <div className="container">
            <AdSlot slot={AD_SLOTS.home} />
          </div>

          {/* ── More stories ──────────────────────────────── */}
          {moreStories.length > 0 && (
            <section className="section" id="more-stories" aria-labelledby="more-title">
              <div className="container">
                <div className="section-header">
                  <h2 className="section-title" id="more-title">More stories</h2>
                  <Link to="/explore" className="section-link">Explore all <LuArrowRight size={14} aria-hidden="true" /></Link>
                </div>
                <div className="grid-3 stagger-children">
                  {moreStories.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Writers ───────────────────────────────────── */}
          {writerList.length > 0 && (
            <section className="section" id="writers" aria-labelledby="writers-title">
              <div className="container">
                <div className="section-header">
                  <h2 className="section-title" id="writers-title">The writers</h2>
                </div>
                <div className="writers-grid stagger-children">
                  {writerList.map(author => (
                    <WriterCard key={author.id} author={author} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Write CTA ─────────────────────────────────────── */}
      <section className="section write-cta" id="start-writing" aria-labelledby="write-cta-title">
        <div className="container">
          <div className="write-cta__card">
            <span className="write-cta__icon" aria-hidden="true"><LuPenLine size={22} /></span>
            <div className="write-cta__content">
              <h2 className="write-cta__title" id="write-cta-title">
                {isWriter ? 'Ready for your next story?' : 'Have a story to tell?'}
              </h2>
              <p className="write-cta__sub">
                {isWriter
                  ? 'Open the writer studio to draft and publish your next article.'
                  : `Publish your ideas on ${brand.name}, build an audience, and earn from eligible advertising revenue under our transparent revenue-sharing programme.`}
              </p>
              {!isWriter && (
                <p className="write-cta__disclaimer">
                  Earnings are based on eligible advertising revenue and platform policy. No earnings are guaranteed.
                </p>
              )}
            </div>
            <div className="write-cta__actions">
              {isWriter ? (
                <Button to="/write" variant="accent" size="lg" icon={<LuPenLine />}>Open writer studio</Button>
              ) : (
                <>
                  <Button to="/register" variant="accent" size="lg" iconRight={<LuArrowRight />}>Start writing</Button>
                  <Button to="/writer-monetization-policy" variant="ghost" size="lg" icon={<LuCompass />} className="write-cta__ghost">
                    How earnings work
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

/* ── Sub-components ─────────────────────────────────────── */

const TrendingItem = ({ article, rank }) => (
  <li className="trending-item">
    <span className="trending-item__rank" aria-hidden="true">{rank}</span>
    <div className="trending-item__body">
      <Link to={`/categories/${article.category.slug}`} className="kicker" style={{ '--cat-color': article.category.color }}>
        <CategoryIcon icon={article.category.icon} size={13} /> {article.category.name}
      </Link>
      <h3 className="trending-item__title">
        <Link to={`/article/${article.slug}`}>{article.title}</Link>
      </h3>
      <div className="trending-item__meta">
        <span>{article.author.name}</span>
        <span aria-hidden="true">·</span>
        <span>{article.readTime} min read</span>
      </div>
    </div>
  </li>
);

const LatestItem = ({ article }) => (
  <div className="latest-item">
    <Link to={`/article/${article.slug}`} className="latest-item__thumb" tabIndex={-1} aria-hidden="true">
      <CoverImage src={article.cover} loading="lazy" />
    </Link>
    <div className="latest-item__body">
      <Link to={`/categories/${article.category.slug}`} className="kicker" style={{ '--cat-color': article.category.color }}>
        <CategoryIcon icon={article.category.icon} size={13} /> {article.category.name}
      </Link>
      <h3 className="latest-item__title line-clamp-2">
        <Link to={`/article/${article.slug}`}>{article.title}</Link>
      </h3>
      <time className="latest-item__time" dateTime={toIsoDate(article.publishedAt)}>
        {formatPublished(article.publishedAt)}
      </time>
    </div>
  </div>
);

const WriterCard = ({ author }) => (
  <Link to={`/writer/${author.username}`} className="writer-card glass-card">
    <Avatar src={author.avatar} name={author.name} size="lg" verified={author.verified} />
    <span className="writer-card__name">{author.name}</span>
    {author.bio && <span className="writer-card__bio line-clamp-2">{author.bio}</span>}
    <span className="writer-card__count">
      {author.articles} article{author.articles !== 1 ? 's' : ''}
    </span>
  </Link>
);

export default HomePage;
