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

async function main() {
  console.log('\n--- Running Article API Tests (Phase 3 Backend) ---\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    // Create a writer user
    const writerUser = await User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      username: 'janedoe',
      password: 'Password123!',
      role: ROLES.WRITER,
      isEmailVerified: true
    });
    const writerToken = writerUser.getSignedJwtToken();

    // Test 1: Public articles list (should return empty without login)
    let res = await request(app).get('/api/v1/articles');
    assert(res.status === 200, 'Test 1 Failed: GET /articles public access');
    assert(res.body.data.articles.length === 0, 'Test 1 Failed: empty initial articles');
    console.log('✓ Test 1: Readers can fetch articles without authentication');

    // Test 2: Unauthenticated user cannot create an article
    res = await request(app)
      .post('/api/v1/articles')
      .send({
        title: 'Draft Article',
        category: 'technology',
        content: '<p>Content</p>'
      });
    assert(res.status === 401, 'Test 2 Failed: Unauthenticated creation blocked');
    console.log('✓ Test 2: Unauthenticated article creation is properly blocked (401)');

    // Test 3: Writer creates a published article
    res = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${writerToken}`)
      .send({
        title: 'The Future of AI in Publishing',
        category: 'technology',
        excerpt: 'Exploring how modern editorial systems scale.',
        content: '<p>AI agents and rich editorial workflows represent the future of journalism.</p>',
        tags: ['ai', 'tech', 'future'],
        status: ARTICLE_STATUS.PUBLISHED
      });
    assert(res.status === 201, 'Test 3 Failed: Article creation status');
    const createdArticle = res.body.data.article;
    assert(createdArticle.slug === 'the-future-of-ai-in-publishing', 'Test 3 Failed: Slug generation');
    assert(createdArticle.readTime >= 1, 'Test 3 Failed: Read time calculation');
    console.log(`✓ Test 3: Writer created published article: "${createdArticle.title}" (slug: ${createdArticle.slug})`);

    // Test 4: Reader fetches the single article by slug without login
    res = await request(app).get(`/api/v1/articles/${createdArticle.slug}`);
    assert(res.status === 200, 'Test 4 Failed: GET /articles/:slug status');
    assert(res.body.data.article.views === 1, 'Test 4 Failed: View count increment');
    console.log('✓ Test 4: Readers can read full article by slug without signing in (views: 1)');

    // Test 5: Writer can update their article
    res = await request(app)
      .put(`/api/v1/articles/${createdArticle._id}`)
      .set('Authorization', `Bearer ${writerToken}`)
      .send({
        title: 'The Future of AI in Modern Publishing'
      });
    assert(res.status === 200, 'Test 5 Failed: PUT /articles/:id status');
    assert(res.body.data.article.title === 'The Future of AI in Modern Publishing', 'Test 5 Failed: Title update');
    console.log('✓ Test 5: Writer can update their article');

    // Test 6: Delete article
    res = await request(app)
      .delete(`/api/v1/articles/${createdArticle._id}`)
      .set('Authorization', `Bearer ${writerToken}`);
    assert(res.status === 200, 'Test 6 Failed: DELETE /articles/:id status');
    console.log('✓ Test 6: Writer can delete their article');

    console.log('\n--- All Phase 3 Article API Tests Passed Successfully! ---\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
