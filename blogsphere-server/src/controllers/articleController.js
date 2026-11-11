const Article = require('../models/Article');
const User = require('../models/User');
const { ARTICLE_STATUS } = require('../constants/articles');
const { ROLES } = require('../constants/roles');
const { sendSuccess, sendError } = require('../utils/response');
const { escapeRegex, parseLimit } = require('../utils/query');

const sanitizeHtml = require('sanitize-html');
const jwt = require('jsonwebtoken');

// Allow normal article formatting; strip scripts, event handlers and javascript: links (stored-XSS guard)
const cleanContent = (html = '') => sanitizeHtml(String(html), {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'figure', 'figcaption', 'picture', 'source', 'iframe']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['id', 'class'],
    img: ['src', 'srcset', 'sizes', 'alt', 'title', 'width', 'height', 'loading'],
    source: ['srcset', 'type', 'media'],
    a: ['href', 'name', 'target', 'rel', 'title'],
    th: ['colspan', 'rowspan', 'scope'], td: ['colspan', 'rowspan'],
    iframe: ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder'],
  },
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  allowedSchemes: ['http', 'https', 'mailto'],
});
const env = require('../config/env');

const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|linkedin|skype|applebot|yandex|baidu|duckduck|semrush|ahrefs|gptbot|chatgpt|perplexity|claude|anthropic|bytespider|amazonbot|ccbot|petalbot/i;
const isBotUA = (ua) => !ua || BOT_UA.test(ua);

// Reads the JWT if present (header or cookie) without requiring sign-in.
const getOptionalViewerId = async (req) => {
  try {
    let token = null;
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) token = h.split(' ')[1];
    else if (req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token) return null;
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('role').lean();
    return user ? { id: String(user._id), role: user.role } : null;
  } catch (e) {
    return null;
  }
};


// Public author fields included with every article
const AUTHOR_FIELDS = 'name username avatar bio verified followers socialLinks';

/**
 * @desc    Get published articles (public, filterable, pagination)
 * @route   GET /api/v1/articles
 * @access  Public (No auth needed for readers)
 */
exports.getArticles = async (req, res) => {
  try {
    const { category, tag, search, author, featured, sort = 'latest', page = 1, limit = 10 } = req.query;

    const query = { status: ARTICLE_STATUS.PUBLISHED };

    if (category) {
      query.category = String(category).toLowerCase();
    }

    if (tag) {
      query.tags = String(tag).toLowerCase();
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (author) {
      const authorUser = await User.findOne({ username: String(author).toLowerCase() }).select('_id').lean();
      if (!authorUser) {
        return sendSuccess(res, 200, 'Articles retrieved successfully', {
          articles: [],
          pagination: { page: 1, limit: parseLimit(limit, 10), total: 0, pages: 0 }
        });
      }
      query.author = authorUser._id;
    }

    if (search && String(search).trim()) {
      const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
      // Also match articles whose writer's name or username matches
      const matchingAuthors = await User.find({ $or: [{ name: pattern }, { username: pattern }] })
        .select('_id')
        .lean();
      query.$or = [
        { title: pattern },
        { excerpt: pattern },
        { tags: pattern },
        { category: pattern },
        ...(matchingAuthors.length ? [{ author: { $in: matchingAuthors.map(u => u._id) } }] : [])
      ];
    }

    let sortOption = { publishedAt: -1 };
    if (sort === 'popular' || sort === 'trending') {
      sortOption = { views: -1, likes: -1 };
    } else if (sort === 'oldest') {
      sortOption = { publishedAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = parseLimit(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('author', AUTHOR_FIELDS)
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
 * @desc    Get trending articles (most viewed, then most liked)
 * @route   GET /api/v1/articles/trending?limit=5&category=
 * @access  Public
 */
exports.getTrendingArticles = async (req, res) => {
  try {
    const limitNum = parseLimit(req.query.limit, 5);
    const query = { status: ARTICLE_STATUS.PUBLISHED };
    if (req.query.category) query.category = String(req.query.category).toLowerCase();

    const articles = await Article.find(query)
      .populate('author', AUTHOR_FIELDS)
      .sort({ views: -1, likes: -1, publishedAt: -1 })
      .limit(limitNum)
      .lean();

    return sendSuccess(res, 200, 'Trending articles retrieved', { articles });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @desc    Get featured articles; topped up with the latest articles if too few are featured
 * @route   GET /api/v1/articles/featured?limit=3
 * @access  Public
 */
exports.getFeaturedArticles = async (req, res) => {
  try {
    const limitNum = parseLimit(req.query.limit, 3, 12);
    const base = { status: ARTICLE_STATUS.PUBLISHED };

    const featured = await Article.find({ ...base, featured: true })
      .populate('author', AUTHOR_FIELDS)
      .sort({ publishedAt: -1 })
      .limit(limitNum)
      .lean();

    let articles = featured;
    if (featured.length < limitNum) {
      const fill = await Article.find({ ...base, _id: { $nin: featured.map(a => a._id) } })
        .populate('author', AUTHOR_FIELDS)
        .sort({ publishedAt: -1 })
        .limit(limitNum - featured.length)
        .lean();
      articles = featured.concat(fill);
    }

    return sendSuccess(res, 200, 'Featured articles retrieved', { articles });
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

    let doc = await Article.findOne({ slug, status: ARTICLE_STATUS.PUBLISHED })
      .populate('author', AUTHOR_FIELDS);

    if (!doc) {
      return sendError(res, 404, 'Article not found or not yet published');
    }

    // Count a view only for real readers: not the site's bot renderer,
    // not crawlers, and not the signed-in author or an admin.
    const viewer = await getOptionalViewerId(req);
    const authorId = doc.author && doc.author._id ? String(doc.author._id) : null;
    const isOwnOrStaff = viewer && (viewer.id === authorId || viewer.role === 'admin');
    if (!req.get('x-prerender') && !isBotUA(req.get('user-agent')) && !isOwnOrStaff) {
      await Article.updateOne({ _id: doc._id }, { $inc: { views: 1 } });
      doc.views = (doc.views || 0) + 1;
    }

    const article = doc.toObject();
    if (article.author && article.author._id) {
      // Writer's published article count for the author card
      article.author.articles = await Article.countDocuments({
        author: article.author._id,
        status: ARTICLE_STATUS.PUBLISHED
      });
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
    const { title, seoTitle, excerpt, content, coverImage, category, tags, status } = req.body;

    if (!title || !content || !category) {
      return sendError(res, 400, 'Please provide title, category, and content');
    }

    const autoExcerpt = excerpt || (content.replace(/<[^>]*>?/gm, '').slice(0, 250) + '...');

    const article = await Article.create({
      title,
      seoTitle: typeof seoTitle === 'string' ? seoTitle : undefined,
      excerpt: autoExcerpt,
      content: cleanContent(content),
      coverImage,
      category,
      tags: Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase()) : [],
      status: status || ARTICLE_STATUS.DRAFT,
      author: req.user._id
    });

    const populatedArticle = await article.populate('author', AUTHOR_FIELDS);

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

    const { title, seoTitle, excerpt, content, coverImage, category, tags, status } = req.body;

    if (title) article.title = title;
    if (typeof seoTitle === 'string') article.seoTitle = seoTitle; // '' clears it
    if (excerpt) article.excerpt = excerpt;
    if (content) article.content = cleanContent(content);
    if (coverImage) article.coverImage = coverImage;
    if (category) article.category = category;
    if (tags) article.tags = Array.isArray(tags) ? tags.map(t => t.trim().toLowerCase()) : article.tags;
    if (status) article.status = status;

    await article.save();
    const updated = await article.populate('author', AUTHOR_FIELDS);

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

