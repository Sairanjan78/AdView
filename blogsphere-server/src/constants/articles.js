const ARTICLE_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
});

const CATEGORIES_LIST = Object.freeze([
  'technology',
  'science',
  'business',
  'health',
  'arts',
  'travel',
  'food',
  'finance',
  'education',
  'environment',
  'sports',
  'entertainment',
  'jobs-careers',
  'innovation',
  'world-affairs'
]);

module.exports = {
  ARTICLE_STATUS,
  CATEGORIES_LIST
};

