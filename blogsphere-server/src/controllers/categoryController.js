const Category = require('../models/Category');
const Article = require('../models/Article');
const { ARTICLE_STATUS, CATEGORIES_LIST } = require('../constants/articles');
const { sendSuccess, sendError } = require('../utils/response');

// Fallback display data for a category slug that has not been seeded yet
const defaultCategory = (slug, index) => ({
  slug,
  name: slug.charAt(0).toUpperCase() + slug.slice(1),
  icon: 'file-text',
  color: '#B69B75',
  description: '',
  order: 100 + index
});

const toPublic = (cat, count) => ({
  id: cat._id || cat.slug,
  slug: cat.slug,
  name: cat.name,
  icon: cat.icon,
  color: cat.color,
  description: cat.description || '',
  order: cat.order,
  count
});

// Published article count per category slug
const publishedCounts = async () => {
  const rows = await Article.aggregate([
    { $match: { status: ARTICLE_STATUS.PUBLISHED } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  return rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {});
};

/**
 * @desc    Get all categories with published article counts
 * @route   GET /api/v1/categories
 * @access  Public
 */
exports.getCategories = async (req, res) => {
  try {
    const [docs, counts] = await Promise.all([Category.find().lean(), publishedCounts()]);
    const bySlug = docs.reduce((acc, d) => ({ ...acc, [d.slug]: d }), {});

    const categories = CATEGORIES_LIST
      .map((slug, i) => toPublic(bySlug[slug] || defaultCategory(slug, i), counts[slug] || 0))
      .sort((a, b) => a.order - b.order);

    return sendSuccess(res, 200, 'Categories retrieved successfully', { categories });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @desc    Get a single category by slug
 * @route   GET /api/v1/categories/:slug
 * @access  Public
 */
exports.getCategoryBySlug = async (req, res) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const index = CATEGORIES_LIST.indexOf(slug);
    if (index === -1) {
      return sendError(res, 404, `Category not found: ${slug}`);
    }

    const [doc, count] = await Promise.all([
      Category.findOne({ slug }).lean(),
      Article.countDocuments({ status: ARTICLE_STATUS.PUBLISHED, category: slug })
    ]);

    return sendSuccess(res, 200, 'Category retrieved', {
      category: toPublic(doc || defaultCategory(slug, index), count)
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
