/**
 * Sample content used by `npm run seed`.
 * Taken from the client's original mock data (blogsphere-client/src/data/mockData.js)
 * so a fresh database shows the same categories, writers and articles.
 */

// `icon` is a Lucide icon key (kebab-case) mapped to a component in the client's
// categoryIcons map. `npm run seed` upserts these, which also migrates older
// databases whose categories still store emoji icons.
const CATEGORIES = [
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
  { slug: 'entertainment', name: 'Entertainment',     icon: 'clapperboard', color: '#B91C1C' }
].map((c, i) => ({ ...c, order: i + 1 }));

const WRITERS = [
  {
    username: 'alex_writes', name: 'Alex Morgan',
    avatar: 'https://i.pravatar.cc/150?img=11',
    bio: 'Senior tech journalist covering AI and the future of work.',
    followers: 12400, verified: true
  },
  {
    username: 'priya_tech', name: 'Priya Sharma',
    avatar: 'https://i.pravatar.cc/150?img=23',
    bio: 'Data scientist turned writer. Making complex ideas simple.',
    followers: 8750, verified: true
  },
  {
    username: 'james_globe', name: 'James Okafor',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Travel photographer and storyteller. 40 countries and counting.',
    followers: 31200, verified: false
  },
  {
    username: 'sofia_eats', name: 'Sofia Reyes',
    avatar: 'https://i.pravatar.cc/150?img=47',
    bio: 'Chef, food critic, and recipe developer based in Barcelona.',
    followers: 19800, verified: true
  },
  {
    username: 'dr_chen_md', name: 'Dr. Kevin Chen',
    avatar: 'https://i.pravatar.cc/150?img=58',
    bio: 'Physician and public health advocate. Evidence-based wellness.',
    followers: 44500, verified: true
  }
];

const ARTICLES = [
  {
    slug: 'the-rise-of-ai-agents-2025',
    title: 'The Rise of AI Agents: How Autonomous Software Is Reshaping Every Industry',
    excerpt: 'From coding assistants to healthcare diagnostics, AI agents are no longer science fiction — they\'re rewriting the rules of work, creativity, and commerce at breathtaking speed.',
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    category: 'technology', author: 'alex_writes',
    publishedAt: '2025-11-15T14:30:00+05:30',
    readTime: 8, likes: 4231, views: 87400,
    tags: ['ai', 'technology', 'future of work'], featured: true
  },
  {
    slug: 'gut-microbiome-mental-health',
    title: 'Your Gut Is Talking to Your Brain — And the Conversation Is Surprising',
    excerpt: 'Emerging research is revealing a two-way neural highway between your intestines and your mind. Here\'s what the latest science says about the microbiome-mental health connection.',
    coverImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    category: 'health', author: 'dr_chen_md',
    publishedAt: '2025-11-12T20:00:00+05:30',
    readTime: 11, likes: 3108, views: 62100,
    tags: ['health', 'neuroscience', 'microbiome'], featured: true
  },
  {
    slug: 'hidden-valleys-kyrgyzstan',
    title: 'Lost in the Hidden Valleys of Kyrgyzstan — A Journey Beyond the Tourist Trail',
    excerpt: 'In a country few travellers visit, I discovered soaring mountain passes, nomad hospitality, and a landscape that made every hardship worthwhile.',
    coverImage: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80',
    category: 'travel', author: 'james_globe',
    publishedAt: '2025-11-10T12:45:00+05:30',
    readTime: 14, likes: 5672, views: 104300,
    tags: ['travel', 'adventure', 'central asia'], featured: true
  },
  {
    slug: 'sourdough-mastery-guide',
    title: 'The Science of Perfect Sourdough: A Baker\'s Deep Dive',
    excerpt: 'Fermentation chemistry, hydration ratios, crumb structure — baking great sourdough is equal parts art and science. Let\'s demystify it.',
    coverImage: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=800&q=80',
    category: 'food', author: 'sofia_eats',
    publishedAt: '2025-11-08T16:30:00+05:30',
    readTime: 10, likes: 2890, views: 51200,
    tags: ['food', 'baking', 'science'], featured: false
  },
  {
    slug: 'quantum-computing-explainer',
    title: 'Quantum Computing Without the Headache: A Plain-English Explainer',
    excerpt: 'Superposition, entanglement, qubits — these words don\'t have to be terrifying. Here\'s the clearest explanation you\'ll find on what quantum computers actually do.',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
    category: 'science', author: 'priya_tech',
    publishedAt: '2025-11-06T22:15:00+05:30',
    readTime: 9, likes: 3445, views: 73800,
    tags: ['science', 'quantum', 'technology'], featured: false
  },
  {
    slug: 'remote-work-future-offices',
    title: 'The Office Is Dead. Long Live the Office.',
    excerpt: 'Three years after the great remote-work experiment, companies are still fighting over desks and calendars. What does the data actually tell us?',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    category: 'business', author: 'alex_writes',
    publishedAt: '2025-11-04T15:30:00+05:30',
    readTime: 7, likes: 1987, views: 48200,
    tags: ['business', 'remote work', 'future'], featured: false
  },
  {
    slug: 'biodiversity-crisis-solutions',
    title: 'We Are Losing Species Faster Than We Can Name Them — Here\'s What\'s Being Done',
    excerpt: 'The sixth mass extinction is not a future threat. It\'s happening right now. But scientists and communities worldwide are fighting back in extraordinary ways.',
    coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    category: 'environment', author: 'priya_tech',
    publishedAt: '2025-11-02T14:00:00+05:30',
    readTime: 12, likes: 4102, views: 81600,
    tags: ['environment', 'biodiversity', 'science'], featured: false
  },
  {
    slug: 'passive-income-myths',
    title: 'The Passive Income Lie: What Financial Influencers Won\'t Tell You',
    excerpt: 'Behind every "passive income" story is a mountain of active work, capital, or both. Let\'s cut through the noise with actual data.',
    coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
    category: 'finance', author: 'sofia_eats',
    publishedAt: '2025-10-30T18:30:00+05:30',
    readTime: 8, likes: 6231, views: 142000,
    tags: ['finance', 'investing', 'personal finance'], featured: false
  }
];

/**
 * The mock data had no article bodies, so build a short placeholder body from the excerpt.
 */
const buildContent = (article) => `
<p>${article.excerpt}</p>
<p>This is sample content created by the BlogSphere seed script so the site has something to read on a fresh database. Writers can replace it from the Writer Studio, or you can delete these sample articles at any time.</p>
<h2>Why this matters</h2>
<p>Stories about ${article.tags.slice(0, 2).join(' and ')} reach readers everywhere when great writing meets great presentation.</p>
<blockquote>Great writing deserves great presentation. BlogSphere is built to make both effortless.</blockquote>
`.trim();

module.exports = {
  CATEGORIES,
  WRITERS,
  ARTICLES,
  buildContent
};
