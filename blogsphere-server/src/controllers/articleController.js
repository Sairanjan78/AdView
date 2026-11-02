const Article = require('../models/Article');
const { ARTICLE_STATUS } = require('../constants/articles');
const { ROLES } = require('../constants/roles');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Get published articles (public, filterable, pagination)
 * @route   GET /api/v1/articles
 * @access  Public (No auth needed for readers)
 */
exports.getArticles = async (req, res) => {
  try {
    const { category, tag, search, sort = 'latest', page = 1, limit = 10 } = req.query;

    const query = { status: ARTICLE_STATUS.PUBLISHED };

    if (category) {
      query.category = category.toLowerCase();
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { publishedAt: -1 };
    if (sort === 'popular' || sort === 'trending') {
      sortOption = { views: -1, likes: -1 };
    } else if (sort === 'oldest') {
      sortOption = { publishedAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('author', 'name username avatar bio')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Article.countDocuments(query)
    ]);

    return sendSuccess(res, 200, 'Articles retrieved successfully', {
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @desc    Get single article by slug (increments view count)
 * @route   GET /api/v1/articles/:slug
 * @access  Public (No auth needed for readers)
 */
exports.getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOneAndUpdate(
      { slug, status: ARTICLE_STATUS.PUBLISHED },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name username avatar bio');

    if (!article) {
      return sendError(res, 404, 'Article not found or not yet published');
    }

    return sendSuccess(res, 200, 'Article details retrieved', { article });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @desc    Create a new article (draft or published)
 * @route   POST /api/v1/articles
 * @access  Private (Writer / Admin)
 */
exports.createArticle = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, tags, status } = req.body;

    if (!title || !content || !category) {
      return sendError(res, 400, 'Please provide title, category, and content');
    }

    const autoExcerpt = excerpt || (content.replace(/<[^>]*>?/gm, '').slice(0, 250) + '...');

    const article = await Article.create({
      title,
      excerpt: autoExcerpt,
      content,
      coverImage,
      category,
      tags: Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase()) : [],
      status: status || ARTICLE_STATUS.DRAFT,
      author: req.user._id
    });

    const populatedArticle = await article.populate('author', 'name username avatar bio');

    return sendSuccess(res, 201, 'Article created successfully', { article: populatedArticle });
  } catch (err) {
    return sendError(res, 400, err.message);
  }
};

/**
 * @desc    Update article
 * @route   PUT /api/v1/articles/:id
 * @access  Private (Author or Admin)
 */
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    // Authorization check
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 403, 'You are not authorized to update this article');
    }

    const { title, excerpt, content, coverImage, category, tags, status } = req.body;

    if (title) article.title = title;
    if (excerpt) article.excerpt = excerpt;
    if (content) article.content = content;
    if (coverImage) article.coverImage = coverImage;
    if (category) article.category = category;
    if (tags) article.tags = Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase()) : article.tags;
    if (status) article.status = status;

    await article.save();
    const updated = await article.populate('author', 'name username avatar bio');

    return sendSuccess(res, 200, 'Article updated successfully', { article: updated });
  } catch (err) {
    return sendError(res, 400, err.message);
  }
};

/**
 * @desc    Delete article
 * @route   DELETE /api/v1/articles/:id
 * @access  Private (Author or Admin)
 */
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    if (article.author.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 403, 'You are not authorized to delete this article');
    }

    await article.deleteOne();
    return sendSuccess(res, 200, 'Article deleted successfully');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @desc    Get articles by current logged-in writer
 * @route   GET /api/v1/articles/me/mine
 * @access  Private (Writer / Admin)
 */
exports.getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'My articles retrieved', { articles });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

