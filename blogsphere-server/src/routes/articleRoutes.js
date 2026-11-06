const express = require('express');
const {
  getArticles,
  getTrendingArticles,
  getFeaturedArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  getMyArticles
} = require('../controllers/articleController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Public routes (Direct reader access - no sign-in required)
router.get('/', getArticles);
router.get('/trending', getTrendingArticles);
router.get('/featured', getFeaturedArticles);
router.get('/:slug', getArticleBySlug);

// Writer / Admin protected routes
router.use(protect);
router.get('/me/mine', authorize(ROLES.WRITER, ROLES.ADMIN), getMyArticles);
router.post('/', authorize(ROLES.WRITER, ROLES.ADMIN), createArticle);
router.put('/:id', authorize(ROLES.WRITER, ROLES.ADMIN), updateArticle);
router.delete('/:id', authorize(ROLES.WRITER, ROLES.ADMIN), deleteArticle);

module.exports = router;

