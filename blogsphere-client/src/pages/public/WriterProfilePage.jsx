import React from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  LuTwitter, LuLinkedin, LuGlobe, LuPenLine, LuArrowLeft, LuUserX, LuLoaderCircle, LuBadgeCheck,
} from 'react-icons/lu';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ArticleCard from '../../components/article/ArticleCard';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { writerApi } from '../../services/api';
import { normalizeArticle, normalizeWriter } from '../../utils/normalizeArticle';
import { formatCount } from '../../utils/format';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import './WriterProfilePage.css';

const SOCIAL = [
  { key: 'twitter',  label: 'X (Twitter)', Icon: LuTwitter },
  { key: 'linkedin', label: 'LinkedIn',    Icon: LuLinkedin },
  { key: 'website',  label: 'Website',     Icon: LuGlobe },
];

const WriterProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { data, loading, error } = useApi(
    () => writerApi.getWriter(username).then(res => ({
      author: normalizeWriter(res?.data?.writer),
      articles: (res?.data?.articles || []).map(normalizeArticle),
    })),
    [username]
  );

  if (loading) {
    return (
      <div className="page-loader" role="status">
        <LuLoaderCircle size={28} aria-hidden="true" />
        Loading profile…
      </div>
    );
  }

  if (!data?.author) {
    const failed = error && error.status !== 404;
    return (
      <div className="container">
        <Seo title={failed ? 'Could not load profile' : 'Writer not found'} noindex />
        <EmptyState
          icon={LuUserX}
          tone={failed ? 'error' : 'default'}
          title={failed ? 'We couldn’t load this profile' : 'Writer not found'}
          action={<Button to="/explore" variant="outline" icon={<LuArrowLeft />}>Explore articles</Button>}
        >
          {failed ? error.message : 'There is no writer with that username.'}
        </EmptyState>
      </div>
    );
  }

  const { author, articles } = data;
  const isOwnProfile = user?.username === author.username;
  const links = SOCIAL.filter(s => /^https?:\/\//i.test(author.socialLinks?.[s.key] || ''));

  return (
    <>
      <Seo
        title={`${author.name} — Writer`}
        description={author.bio || `Read articles by ${author.name} on ${brand.name}.`}
        path={`/writer/${author.username}`}
        image={author.avatar || undefined}
        type="profile"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: author.name,
            alternateName: author.username,
            description: author.bio || undefined,
            image: author.avatar || undefined,
          },
        }}
      />

      <div className="container writer-profile">
        <header className="writer-profile__header">
          <Avatar src={author.avatar} name={author.name} size="2xl" />
          <div className="writer-profile__info">
            <h1 className="writer-profile__name">
              {author.name}
              {author.verified && (
                <span className="writer-profile__verified" title="Verified writer">
                  <LuBadgeCheck aria-hidden="true" /><span className="sr-only">Verified writer</span>
                </span>
              )}
            </h1>
            <p className="writer-profile__username">@{author.username}</p>
            {author.bio && <p className="writer-profile__bio">{author.bio}</p>}

            <dl className="writer-profile__stats">
              <div>
                <dt>Articles</dt>
                <dd>{author.articles}</dd>
              </div>
              {author.totalViews > 0 && (
                <div>
                  <dt>Reads</dt>
                  <dd>{formatCount(author.totalViews)}</dd>
                </div>
              )}
              {author.joinedAt && (
                <div>
                  <dt>Writing since</dt>
                  <dd>{format(new Date(author.joinedAt), 'MMM yyyy')}</dd>
                </div>
              )}
            </dl>

            {(links.length > 0 || isOwnProfile) && (
              <div className="writer-profile__actions">
                {isOwnProfile && <Button to="/write" variant="primary" size="sm" icon={<LuPenLine />}>Write a story</Button>}
                {links.map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={author.socialLinks[key]}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="writer-profile__social"
                    aria-label={`${author.name} on ${label}`}
                  >
                    <Icon aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </header>

        <section className="writer-profile__articles" aria-labelledby="writer-articles-title">
          <h2 className="writer-profile__articles-title" id="writer-articles-title">
            {articles.length > 0 ? 'Published articles' : 'No published articles yet'}
          </h2>
          {articles.length > 0 ? (
            <div className="grid-3 stagger-children">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={LuPenLine}
              title={isOwnProfile ? 'Your first story starts here' : 'Nothing published yet'}
              action={isOwnProfile && <Button to="/write" variant="primary" icon={<LuPenLine />}>Write your first post</Button>}
            >
              {isOwnProfile
                ? 'Articles you publish will be listed on this page.'
                : `${author.name} hasn’t published any articles yet.`}
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
};

export default WriterProfilePage;
