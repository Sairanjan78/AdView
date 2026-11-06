// Quiet request logging during tests
process.env.NODE_ENV = 'test';

const assert = require('assert');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Article = require('../src/models/Article');
const { ROLES } = require('../src/constants/roles');
const { ARTICLE_STATUS } = require('../src/constants/articles');
const { seedDatabase } = require('../src/seed/seedDatabase');

async function main() {
  console.log('\n--- Running Catalog API Tests (categories, writers, trending, featured, search) ---\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    await seedDatabase({
      admin: { email: 'admin@test.local', password: 'Test-Admin-Pass-1' },
      log: () => {}
    });

    // A draft that must never appear publicly
    const priya = await User.findOne({ username: 'priya_tech' });
    await Article.create({
      title: 'Secret Quantum Draft',
      excerpt: 'Not public yet',
      content: '<p>draft</p>',
      category: 'science',
      author: priya._id,
      status: ARTICLE_STATUS.DRAFT
    });

    // Categories
    let res = await request(app).get('/api/v1/categories');
    assert.strictEqual(res.status, 200);
    const cats = res.body.data.categories;
    assert.strictEqual(cats.length, 12, 'all 12 categories listed');
    assert.strictEqual(cats[0].slug, 'technology', 'ordered by seed order');
    assert.strictEqual(cats.find(c => c.slug === 'science').count, 1, 'draft not counted');
    assert.strictEqual(cats.find(c => c.slug === 'sports').count, 0);
    assert.ok(cats[0].icon && cats[0].color && cats[0].name);
    console.log('✓ GET /categories returns all categories with published counts');

    res = await request(app).get('/api/v1/categories/travel');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.category.name, 'Travel');
    assert.strictEqual(res.body.data.category.count, 1);
    res = await request(app).get('/api/v1/categories/not-a-category');
    assert.strictEqual(res.status, 404);
    console.log('✓ GET /categories/:slug returns one category, 404 for unknown');

    // Category filter
    res = await request(app).get('/api/v1/articles?category=science');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data.articles.map(a => a.slug), ['quantum-computing-explainer']);
    console.log('✓ GET /articles?category= filters by category (drafts excluded)');

    // Latest ordering
    res = await request(app).get('/api/v1/articles?limit=3');
    assert.strictEqual(res.body.data.articles[0].slug, 'the-rise-of-ai-agents-2025', 'newest first');
    assert.strictEqual(res.body.data.pagination.total, 8);
    console.log('✓ GET /articles returns latest first with pagination');

    // Trending
    res = await request(app).get('/api/v1/articles/trending?limit=3');
    assert.strictEqual(res.status, 200);
    const trending = res.body.data.articles;
    assert.strictEqual(trending.length, 3);
    assert.strictEqual(trending[0].slug, 'passive-income-myths', 'most viewed first');
    assert.ok(trending[0].views >= trending[1].views && trending[1].views >= trending[2].views);
    assert.ok(trending[0].author.username, 'author populated');
    console.log('✓ GET /articles/trending orders by views');

    // Featured (and top-up when there are too few featured)
    res = await request(app).get('/api/v1/articles/featured?limit=3');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.articles.every(a => a.featured === true));
    assert.strictEqual(res.body.data.articles.length, 3);
    res = await request(app).get('/api/v1/articles/featured?limit=5');
    assert.strictEqual(res.body.data.articles.length, 5, 'topped up with latest');
    console.log('✓ GET /articles/featured returns featured, topped up with latest');

    // Search: title, tag, writer name, regex safety
    res = await request(app).get('/api/v1/articles?search=sourdough');
    assert.deepStrictEqual(res.body.data.articles.map(a => a.slug), ['sourdough-mastery-guide']);
    res = await request(app).get('/api/v1/articles?search=microbiome');
    assert.ok(res.body.data.articles.some(a => a.slug === 'gut-microbiome-mental-health'), 'matches tag/title');
    res = await request(app).get('/api/v1/articles?search=Kevin%20Chen');
    assert.deepStrictEqual(res.body.data.articles.map(a => a.slug), ['gut-microbiome-mental-health'], 'matches writer name');
    res = await request(app).get('/api/v1/articles?search=' + encodeURIComponent('(.*'));
    assert.strictEqual(res.status, 200, 'regex characters are escaped');
    assert.strictEqual(res.body.data.articles.length, 0);
    res = await request(app).get('/api/v1/articles?search=Secret%20Quantum');
    assert.strictEqual(res.body.data.articles.length, 0, 'drafts not searchable');
    console.log('✓ GET /articles?search= matches title, tags and writer; input escaped');

    // Author filter
    res = await request(app).get('/api/v1/articles?author=alex_writes');
    assert.strictEqual(res.body.data.articles.length, 2);
    res = await request(app).get('/api/v1/articles?author=nobody_here');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.articles.length, 0);
    console.log('✓ GET /articles?author= filters by writer username');

    // Writers
    res = await request(app).get('/api/v1/writers?limit=3');
    assert.strictEqual(res.status, 200);
    const writers = res.body.data.writers;
    assert.strictEqual(writers.length, 3);
    assert.strictEqual(writers[0].username, 'dr_chen_md', 'most followers first');
    assert.ok(writers.every(w => w.email === undefined), 'no emails exposed');
    res = await request(app).get('/api/v1/writers');
    assert.ok(!res.body.data.writers.some(w => w.username === 'admin'), 'admin without articles hidden');
    console.log('✓ GET /writers lists top writers without private fields');

    res = await request(app).get('/api/v1/writers/priya_tech');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.writer.name, 'Priya Sharma');
    assert.strictEqual(res.body.data.writer.articles, 2, 'published only');
    assert.strictEqual(res.body.data.articles.length, 2);
    assert.strictEqual(res.body.data.writer.email, undefined);
    res = await request(app).get('/api/v1/writers/ghost_writer');
    assert.strictEqual(res.status, 404);
    console.log('✓ GET /writers/:username returns profile + published articles, 404 for unknown');

    // Readers have no public writer profile
    await User.create({
      name: 'Reader Rita', email: 'rita@test.local', username: 'rita', password: 'Password123!', role: ROLES.READER
    });
    res = await request(app).get('/api/v1/writers/rita');
    assert.strictEqual(res.status, 404);
    console.log('✓ Reader accounts are not exposed as writers');

    // Article detail includes the author's published article count
    res = await request(app).get('/api/v1/articles/quantum-computing-explainer');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.article.author.articles, 2);
    assert.strictEqual(res.body.data.article.author.verified, true);
    console.log('✓ GET /articles/:slug includes author stats');

    console.log('\n--- All Catalog API Tests Passed Successfully! ---\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
