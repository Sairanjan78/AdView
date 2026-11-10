import { getCategoryMeta } from '../config/categories';

/**
 * Normalizes an article object from the API into the shape the UI components expect.
 */
export function normalizeArticle(raw) {
  if (!raw) return null;

  // Resolve category
  let categoryObj;
  if (typeof raw.category === 'string') {
    const found = getCategoryMeta(raw.category);
    categoryObj = found || {
      id: raw.category,
      slug: raw.category.toLowerCase(),
      name: raw.category.charAt(0).toUpperCase() + raw.category.slice(1),
      icon: 'file-text',
      color: '#B69B75'
    };
  } else if (raw.category && typeof raw.category === 'object') {
    categoryObj = raw.category;
  } else {
    categoryObj = {
      id: 'general',
      slug: 'general',
      name: 'General',
      icon: 'file-text',
      color: '#B69B75'
    };
  }

  // Resolve author
  let authorObj;
  if (raw.author && typeof raw.author === 'object') {
    authorObj = {
      id: raw.author._id || raw.author.id || 'author',
      name: raw.author.name || 'Anonymous Writer',
      username: raw.author.username || 'writer',
      avatar: raw.author.avatar || '', // no avatar -> Avatar shows initials
      bio: raw.author.bio || '',
      verified: Boolean(raw.author.verified),
      followers: raw.author.followers || 0,
      articles: raw.author.articles || 0,
      socialLinks: raw.author.socialLinks || {}
    };
  } else {
    authorObj = {
      id: 'author',
      name: 'Editorial team',
      username: 'editorial',
      avatar: '',
      bio: '',
      verified: false,
      followers: 0,
      articles: 0
    };
  }

  return {
    id: raw._id || raw.id,
    slug: raw.slug || 'article',
    title: raw.title || 'Untitled',
    seoTitle: raw.seoTitle || '', // optional shorter <title> for search results
    excerpt: raw.excerpt || '',
    content: raw.content || '',
    cover: raw.coverImage || raw.cover || '', // cards show a neutral placeholder when empty
    category: categoryObj,
    author: authorObj,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    publishedAt: raw.publishedAt || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.publishedAt || raw.createdAt,
    readTime: raw.readTime || 3,
    views: raw.views || 0,
    likes: raw.likes || 0,
    comments: raw.comments || 0
  };
}


/**
 * Normalizes a writer from GET /writers or /writers/:username.
 */
export function normalizeWriter(raw) {
  if (!raw) return null;
  return {
    id: raw.id || raw._id || raw.username,
    name: raw.name || 'Anonymous Writer',
    username: raw.username || 'writer',
    avatar: raw.avatar || '',
    bio: raw.bio || '',
    verified: Boolean(raw.verified),
    followers: raw.followers || 0,
    articles: raw.articles || 0,
    totalViews: raw.totalViews || 0,
    joinedAt: raw.joinedAt,
    socialLinks: raw.socialLinks || {},
  };
}
