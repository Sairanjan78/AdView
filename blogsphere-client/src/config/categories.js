/**
 * Category presentation fallback (name, icon key, colour per slug).
 * `icon` is a Lucide key rendered by components/ui/CategoryIcon.
 * The live list and article counts come from GET /api/v1/categories; this map is only used
 * to style an article's category badge before (or without) that request.
 */
const DEFAULT_CATEGORIES = [
  { slug: 'technology',    name: 'Technology',        icon: 'cpu', color: '#4F46E5' },
  { slug: 'science',       name: 'Science',           icon: 'flask-conical', color: '#0F766E' },
  { slug: 'business',      name: 'Business',          icon: 'briefcase', color: '#A16207' },
  { slug: 'health',        name: 'Health & Wellness', icon: 'heart-pulse', color: '#BE185D' },
  { slug: 'arts',          name: 'Arts & Culture',    icon: 'palette', color: '#7E22CE' },
  { slug: 'travel',        name: 'Travel',            icon: 'plane', color: '#0369A1' },
  { slug: 'food',          name: 'Food & Cooking',    icon: 'chef-hat', color: '#C2410C' },
  { slug: 'finance',       name: 'Finance',           icon: 'wallet', color: '#15803D' },
  { slug: 'education',     name: 'Education',         icon: 'graduation-cap', color: '#1D4ED8' },
  { slug: 'environment',   name: 'Environment',       icon: 'leaf', color: '#4D7C0F' },
  { slug: 'sports',        name: 'Sports',            icon: 'trophy', color: '#B45309' },
  { slug: 'entertainment', name: 'Entertainment',     icon: 'clapperboard', color: '#B91C1C' },
].map(c => ({ ...c, id: c.slug, count: 0 }));

const registry = new Map(DEFAULT_CATEGORIES.map(c => [c.slug, c]));

/** Remember categories loaded from the API so article badges use the database names/colours. */
export function registerCategories(list = []) {
  list.forEach(c => registry.set(c.slug, { ...registry.get(c.slug), ...c, id: c.id || c.slug }));
}

/** Look up display info for a category slug (undefined if unknown). */
export function getCategoryMeta(slug) {
  return slug ? registry.get(String(slug).toLowerCase()) : undefined;
}

export default DEFAULT_CATEGORIES;
