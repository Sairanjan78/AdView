// Quiet request logging during tests
process.env.NODE_ENV = 'test';
process.env.SITE_URL = 'https://www.example-blog.com/';

const assert = require('assert');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Article = require('../src/models/Article');
const ContactMessage = require('../src/models/ContactMessage');
const { ROLES } = require('../src/constants/roles');
const { ARTICLE_STATUS } = require('../src/constants/articles');
const slugify = require('../src/utils/slugify');
const { seedDatabase } = require('../src/seed/seedDatabase');

async function main() {
  console.log('\n--- Running SEO (sitemap, robots, slugs) & Contact Tests ---\n');

  // Slugs (pure function)
  assert.strictEqual(slugify("The Baker's Café & Sourdough — Part 2!"), 'the-bakers-cafe-and-sourdough-part-2');
  assert.strictEqual(slugify('  --Hello   World-- '), 'hello-world');
  const long = slugify('word '.repeat(40));
  assert.ok(long.length <= 80 && !long.endsWith('-') && long.startsWith('word-word'));
  console.log('✓ slugify produces clean, short, ASCII slugs');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    await seedDatabase({ admin: { email: 'admin@test.local', password: 'Test-Admin-Pass-1' }, log: () => {} });
    const priya = await User.findOne({ username: 'priya_tech' });

    // Slug stays stable after publishing, but follows the title while still a draft
    const draft = await Article.create({
      title: 'Draft Title One', excerpt: 'x', content: '<p>x</p>', category: 'science',
      author: priya._id, status: ARTICLE_STATUS.DRAFT
    });
    assert.strictEqual(draft.slug, 'draft-title-one');
    draft.title = 'Better Draft Title';
    await draft.save();
    assert.strictEqual(draft.slug, 'better-draft-title', 'draft slug follows title');
    draft.status = ARTICLE_STATUS.PUBLISHED;
    await draft.save();
    draft.title = 'Renamed After Publishing';
    await draft.save();
    assert.strictEqual(draft.slug, 'better-draft-title', 'published slug is stable');
    console.log('✓ Draft slugs follow the title; published slugs never change');

    const hidden = await Article.create({
      title: 'Unpublished Secret', excerpt: 'x', content: '<p>x</p>', category: 'arts',
      author: priya._id, status: ARTICLE_STATUS.DRAFT
    });

    // Sitemap
    let res = await request(app).get('/sitemap.xml');
    assert.strictEqual(res.status, 200);
    assert.match(res.headers['content-type'], /application\/xml/);
    const xml = res.text;
    assert.ok(xml.startsWith('<?xml'), 'xml declaration');
    assert.ok(xml.includes('<loc>https://www.example-blog.com/</loc>'), 'home page, trailing slash normalised');
    assert.ok(xml.includes('<loc>https://www.example-blog.com/article/hidden-valleys-kyrgyzstan</loc>'));
    assert.ok(xml.includes('<loc>https://www.example-blog.com/article/better-draft-title</loc>'));
    assert.ok(!xml.includes(hidden.slug), 'drafts excluded');
    assert.ok(xml.includes('/categories/travel</loc>'), 'categories with articles');
    assert.ok(!xml.includes('/categories/sports</loc>'), 'empty categories excluded');
    assert.ok(xml.includes('/writer/priya_tech</loc>'), 'writers with articles');
    assert.ok(!xml.includes('/writer/admin</loc>'));
    assert.ok(xml.includes('/privacy-policy</loc>') && xml.includes('/terms</loc>') && xml.includes('/contact</loc>'));
    assert.ok(/<lastmod>\d{4}-\d{2}-\d{2}T/.test(xml), 'ISO lastmod');
    const count = (xml.match(/<url>/g) || []).length;
    res = await request(app).get('/api/v1/sitemap.xml');
    assert.strictEqual(res.status, 200, 'also available under /api/v1');
    console.log(`✓ GET /sitemap.xml lists ${count} public URLs from published content only`);

    // robots.txt
    res = await request(app).get('/robots.txt');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /Sitemap: http:\/\/127\.0\.0\.1:\d+\/sitemap\.xml/);
    assert.match(res.text, /Disallow: \/api\//);
    console.log('✓ GET /robots.txt points crawlers to the sitemap');

    // Contact form
    res = await request(app).post('/api/v1/contact').send({
      name: 'Asha Reader', email: 'asha@example.com', subject: 'Hello', message: 'I love the travel stories!'
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(await ContactMessage.countDocuments(), 1);

    res = await request(app).post('/api/v1/contact').send({ name: 'No Email', message: 'Long enough message' });
    assert.strictEqual(res.status, 400);
    res = await request(app).post('/api/v1/contact').send({ name: 'Bad', email: 'not-an-email', message: 'Long enough message' });
    assert.strictEqual(res.status, 400);
    res = await request(app).post('/api/v1/contact').send({ name: 'Short', email: 'a@b.co', message: 'hi' });
    assert.strictEqual(res.status, 400);
    res = await request(app).post('/api/v1/contact').send({
      name: 'Bot', email: 'bot@spam.io', message: 'Buy cheap things now!!', website: 'http://spam.io'
    });
    assert.strictEqual(res.status, 201, 'honeypot looks successful to bots');
    assert.strictEqual(await ContactMessage.countDocuments(), 1, 'honeypot message not stored');
    console.log('✓ POST /contact stores valid messages, rejects invalid ones, drops honeypot spam');

    // Only admins can read messages
    const admin = await User.findOne({ role: ROLES.ADMIN });
    res = await request(app).get('/api/v1/contact');
    assert.strictEqual(res.status, 401);
    res = await request(app).get('/api/v1/contact').set('Authorization', `Bearer ${priya.getSignedJwtToken()}`);
    assert.strictEqual(res.status, 403);
    res = await request(app).get('/api/v1/contact').set('Authorization', `Bearer ${admin.getSignedJwtToken()}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.messages[0].email, 'asha@example.com');
    console.log('✓ GET /contact is admin-only');

    // Rate limit (5/hour per IP; 5 requests already made above)
    res = await request(app).post('/api/v1/contact').send({ name: 'Six', email: 'six@example.com', message: 'Sixth message here' });
    assert.strictEqual(res.status, 429, 'rate limited after 5 submissions');
    console.log('✓ Contact form is rate limited');

    console.log('\n--- All SEO & Contact Tests Passed Successfully! ---\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
