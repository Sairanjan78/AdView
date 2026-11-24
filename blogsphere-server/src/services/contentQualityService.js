/**
 * Editorial quality preflight for BlogSphere Mag article drafts.
 *
 * This deterministic checklist is not an AI detector, plagiarism checker,
 * factuality verifier, or AdSense approval predictor. A human editor must
 * verify accuracy, originality, source quality, image rights, and usefulness.
 */
const stripHtml = value => String(value || '')
  .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
  .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/\\s+/g, ' ')
  .trim();

const countMatches = (value, regex) => (String(value || '').match(regex) || []).length;

const evaluateArticleDraft = ({ title, seoTitle, excerpt, content, coverImage, author } = {}) => {
  const html = String(content || '');
  const plainText = stripHtml(html);
  const words = plainText ? plainText.split(/\\s+/).filter(Boolean).length : 0;
  const h2Count = countMatches(html, /<h2\\b/gi);
  const h3Count = countMatches(html, /<h3\\b/gi);
  const externalLinks = (html.match(/<a\\b[^>]*href=["']https?:\\/\\//gi) || []).length;
  const images = html.match(/<img\\b[^>]*>/gi) || [];
  const imagesMissingAlt = images.filter(tag => !/\\balt=["'][^"']+["']/i.test(tag)).length;

  const checks = {
    title: { passed: Boolean(String(title || '').trim()) && String(title).trim().length <= 150 },
    seoTitle: { passed: !seoTitle || String(seoTitle).trim().length <= 70, optional: true },
    excerpt: { passed: Boolean(String(excerpt || '').trim()) && String(excerpt).trim().length <= 300 },
    bodyLength: { passed: words >= 500, wordCount: words, note: '500 words is an editorial review prompt, not a Google or AdSense minimum.' },
    structure: { passed: h2Count >= 2, h2Count, h3Count },
    sourceLinks: { passed: externalLinks >= 2, externalLinkCount: externalLinks },
    coverImage: { passed: Boolean(String(coverImage || '').trim()) },
    imageAltText: { passed: imagesMissingAlt === 0, imageCount: images.length, missingAltCount: imagesMissingAlt },
    author: { passed: Boolean(author && author.name && author.username) },
  };

  const recommendations = [];
  if (!checks.title.passed) recommendations.push('Add a clear, descriptive title of no more than 150 characters.');
  if (!checks.seoTitle.passed) recommendations.push('Keep the SEO title at or below 70 characters.');
  if (!checks.excerpt.passed) recommendations.push('Add a useful excerpt of up to 300 characters.');
  if (!checks.bodyLength.passed) recommendations.push('Review whether the article answers the topic fully; do not add filler to increase word count.');
  if (!checks.structure.passed) recommendations.push('Use descriptive section headings where they improve navigation.');
  if (!checks.sourceLinks.passed) recommendations.push('Add and verify relevant authoritative sources where factual claims need support.');
  if (!checks.coverImage.passed) recommendations.push('Add a relevant, properly licensed cover image.');
  if (!checks.imageAltText.passed) recommendations.push('Add accurate, descriptive alt text to article images.');
  if (!checks.author.passed) recommendations.push('Associate the article with a complete author profile.');
  recommendations.push('Human editor: verify factual claims, originality, source reliability, image licensing, and audience usefulness before publication.');

  const passedCount = Object.values(checks).filter(check => check.passed).length;
  return {
    status: 'manual_review_required',
    score: Math.round((passedCount / Object.keys(checks).length) * 100),
    checks,
    recommendations,
    disclaimer: 'This checklist is an editorial aid only. It does not detect AI-generated text or plagiarism and does not guarantee search ranking or AdSense approval.'
  };
};

module.exports = { evaluateArticleDraft };
