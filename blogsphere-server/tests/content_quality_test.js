const assert = require('assert');
const { evaluateArticleDraft } = require('../src/services/contentQualityService');

const longText = Array.from({ length: 520 }, (_, i) => `useful word${i}`).join(' ');
const result = evaluateArticleDraft({
  title: 'A practical guide',
  seoTitle: 'A practical guide for readers',
  excerpt: 'A concise summary.',
  content: `<h2>First section</h2><p>${longText}</p><h2>Second section</h2><p>More detail.</p><a href="https://example.com/source-one">Source one</a><a href="https://example.org/source-two">Source two</a><img src="cover.jpg" alt="A descriptive illustration">`,
  coverImage: 'https://example.com/cover.jpg',
  author: { name: 'Example Author', username: 'example-author' }
});
assert.strictEqual(result.status, 'manual_review_required');
assert.strictEqual(result.checks.title.passed, true);
assert.strictEqual(result.checks.bodyLength.passed, true);
assert.strictEqual(result.checks.structure.passed, true);
assert.strictEqual(result.checks.sourceLinks.passed, true);
assert.strictEqual(result.checks.imageAltText.passed, true);
assert.strictEqual(result.checks.author.passed, true);
assert.match(result.disclaimer, /does not detect AI-generated text/);

const weak = evaluateArticleDraft({ title: '', content: '<p>Short</p>' });
assert.strictEqual(weak.checks.title.passed, false);
assert.strictEqual(weak.checks.bodyLength.passed, false);
assert.strictEqual(weak.status, 'manual_review_required');

console.log('content_quality_test: all checks passed');
