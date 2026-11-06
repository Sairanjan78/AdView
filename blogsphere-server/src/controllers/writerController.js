const User = require('../models/User');
const Article = require('../models/Article');
const { ARTICLE_STATUS } = require('../constants/articles');
const { ROLES, USER_STATUS } = require('../constants/roles');
const { sendSuccess, sendError } = require('../utils/response');
const { parseLimit } = require('../utils/query');

const PUBLIC_WRITER_FIELDS = 'name username avatar bio verified followers socialLinks nicheSpecialties role createdAt';

// Never expose email, role internals or monetization data publicly
const toPublicWriter = (user, stats = {}) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  avatar: user.avatar || '',
  bio: user.bio || '',
  verified: Boolean(user.verified),
  followers: user.followers || 0,
  articles: stats.articles || 0,
  totalViews: stats.totalViews || 0,
  socialLinks: user.socialLinks || {},
  nicheSpecialties: user.nicheSpecialties || [],
  joinedAt: user.createdAt
});

// Published article count + total views per author id
const statsByAuthor = async (authorIds) => {
  const rows = await Article.aggregate([
    { $match: { status: ARTICLE_STATUS.PUBLISHED, author: { $in: authorIds } } },
    { $group: { _id: '$author', articles: { $sum: 1 }, totalViews: { $sum: '$views' } } }
  ]);
  return rows.reduce((acc, r) => ({ ...acc, [r._id.toString()]: r }), {});
};

/**
 * @desc    List writers (top writers first: followers, then published articles)
 * @route   GET /api/v1/writers?limit=5
 * @access  Public
 */
exports.getWriters = async (req, res) => {
  try {
    const limitNum = parseLimit(req.query.limit, 10);

    const users = await User.find({
      role: { $in: [ROLES.WRITER, ROLES.ADMIN] },
      status: { $ne: USER_STATUS.SUSPENDED }
    })
      .select(PUBLIC_WRITER_FIELDS)
      .lean();

    const stats = await statsByAuthor(users.map(u => u._id));

    const writers = users
      .map(u => toPublicWriter(u, stats[u._id.toString()]))
      // Admins only appear if they actually publish
      .filter((w, i) => users[i].role === ROLES.WRITER || w.articles > 0)
      .sort((a, b) => b.followers - a.followers || b.articles - a.articles)
      .slice(0, limitNum);

    return sendSuccess(res, 200, 'Writers retrieved successfully', { writers });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

/**
 * @desc    Get a writer's public profile and their published articles
 * @route   GET /api/v1/writers/:username
 * @access  Public
 */
exports.getWriterByUsername = async (req, res) => {
  try {
    const username = String(req.params.username).toLowerCase();
    const user = await User.findOne({
      username,
      role: { $in: [ROLES.WRITER, ROLES.ADMIN] },
      status: { $ne: USER_STATUS.SUSPENDED }
    })
      .select(PUBLIC_WRITER_FIELDS)
      .lean();

    if (!user) {
      return sendError(res, 404, 'Writer not found');
    }

    const articles = await Article.find({ author: user._id, status: ARTICLE_STATUS.PUBLISHED })
      .populate('author', 'name username avatar bio verified followers')
      .sort({ publishedAt: -1 })
      .lean();

    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const writer = toPublicWriter(user, { articles: articles.length, totalViews });

    return sendSuccess(res, 200, 'Writer profile retrieved', { writer, articles });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
