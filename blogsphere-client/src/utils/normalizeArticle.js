import { CATEGORIES } from '../data/mockData';

/**
 * Normalizes an article object whether it came from MongoDB API or mock data.
 */
export function normalizeArticle(raw) {
  if (!raw) return null;

  // Resolve category
  let categoryObj;
  if (typeof raw.category === 'string') {
    const found = CATEGORIES.find(c => c.slug === raw.category.toLowerCase());
    categoryObj = found || {
      id: raw.category,
      slug: raw.category.toLowerCase(),
      name: raw.category.charAt(0).toUpperCase() + raw.category.slice(1),
      icon: '📄',
      color: '#B69B75'
    };
  } else if (raw.category && typeof raw.category === 'object') {
    categoryObj = raw.category;
  } else {
    categoryObj = {
      id: 'general',
      slug: 'general',
      name: 'General',
      icon: '📄',
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
      avatar: raw.author.avatar || `https://i.pravatar.cc/150?u=${raw.author.username || 'writer'}`,
      bio: raw.author.bio || 'Contributing Writer at BlogSphere',
      verified: Boolean(raw.author.verified),
      followers: raw.author.followers || 1200,
      articles: raw.author.articles || 1
    };
  } else {
    authorObj = {
      id: 'author',
      name: 'BlogSphere Editorial',
      username: 'editorial',
      avatar: 'https://i.pravatar.cc/150?img=11',
      bio: 'Editorial Staff',
      verified: true,
      followers: 5000,
      articles: 10
    };
  }

  return {
    id: raw._id || raw.id,
    slug: raw.slug || 'article',
    title: raw.title || 'Untitled',
    excerpt: raw.excerpt || '',
    content: raw.content || '',
    cover: raw.coverImage || raw.cover || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
    category: categoryObj,
    author: authorObj,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    publishedAt: raw.publishedAt || raw.createdAt || new Date().toISOString(),
    readTime: raw.readTime || 3,
    views: raw.views || 0,
    likes: raw.likes || 0,
    comments: raw.comments || 0
  };
}

