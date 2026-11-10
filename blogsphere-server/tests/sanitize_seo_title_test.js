// Quiet request logging during tests
process.env.NODE_ENV = 'test';
process.env.SITE_URL = 'https://www.example-blog.com/';

const assert = require('assert');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const { ROLES } = require('../src/constants/roles');
const { ARTICLE_STATUS } = require('../src/constants/articles');
const sanitizeArticleHtml = require('../src/utils/sanitizeArticle');

async function main() {
  console.log('\n--- Running Sanitizer, SEO title & policy sitemap Tests ---\n');

  // Sanitizer (pure function): keeps blog markup, drops scripts and handlers
  const dirty = [
    '<h2 id="faq">FAQ</h2><p onclick="alert(1)">Hi <a href="javascript:alert(1)">x</a> <a href="https://a.com" target="_blank">ok</a></p>',
    '<script>alert(1)</script><style>p{}</style>',
    '<table><thead><tr><th scope="col">Plan</th></tr></thead><tbody><tr><td colspan="2">$10</td></tr></tbody></table>',
    '<figure><img src="https://img.example/a.webp" alt="Cover" onerror="x()"><figcaption>c</figcaption></figure>',
    '<iframe src="https://evil.example/x"></iframe><iframe src="https://www.youtube.com/embed/abc"></iframe>'
  ].join('');
  const clean = sanitizeArticleHtml(dirty);
  assert.ok(!/script|onclick|onerror|javascript:|<style|evil\.example/i.test(clean), clean);
  assert.ok(clean.includes('<h2 id="faq">FAQ</h2>'));
  assert.ok(clean.includes('<th scope="col">Plan</th>') && clean.includes('<td colspan="2">$10</td>'));
  assert.ok(clean.includes('<img src="https://img.example/a.webp" alt="Cover" />') || clean.includes('<img src="https://img.example/a.webp" alt="Cover">'));
  assert.ok(clean.includes('rel="noopener noreferrer"'));
  assert.ok(clean.includes('https://www.youtube.com/embed/abc'));
  console.log('✓ sanitize-html keeps headings, tables, images, links, embeds and drops unsafe code');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    const writer = await User.create({
      name: 'Sam Writer', email: 'sam@example.com', username: 'samwriter',
      password: 'Password123!', role: ROLES.WRITER, isEmailVerified: true,
      socialLinks: { linkedin: 'https://www.linkedin.com/in/sam' }
    });
    const token = writer.getSignedJwtToken();

    let res = await request(app).post('/api/v1/articles').set('Authorization', `Bearer ${token}`).send({
      title: 'A Very Long Headline About Something Interesting That Keeps Going On',
      seoTitle: 'Short SEO Title',
      excerpt: 'Summary.',
      content: '<p>Body <script>alert(1)</script></p>',
      category: 'technology',
      status: ARTICLE_STATUS.PUBLISHED
    });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    const { article } = res.body.data;
    assert.strictEqual(article.seoTitle, 'Short SEO Title');
    assert.ok(!article.content.includes('<script'), 'content sanitized on save');

    res = await request(app).get(`/api/v1/articles/${article.slug}`).set('x-prerender', '1');
    assert.strictEqual(res.body.data.article.seoTitle, 'Short SEO Title');
    assert.strictEqual(res.body.data.article.author.socialLinks.linkedin, 'https://www.linkedin.com/in/sam');

    res = await request(app).put(`/api/v1/articles/${article._id}`).set('Authorization', `Bearer ${token}`).send({ seoTitle: '' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.article.seoTitle, '', 'empty string clears seoTitle');
    console.log('✓ seoTitle is saved, returned publicly, and can be cleared; author social links are public');

    res = await request(app).get('/sitemap.xml');
    ['/cookie-policy', '/advertising-disclosure', '/writer-monetization-policy'].forEach(p =>
      assert.ok(res.text.includes(`<loc>https://www.example-blog.com${p}</loc>`), p));
    console.log('✓ Sitemap lists the cookie, advertising and monetization policy pages');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
