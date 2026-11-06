const crypto = require('crypto');
const User = require('../models/User');
const Article = require('../models/Article');
const Category = require('../models/Category');
const { ROLES } = require('../constants/roles');
const { ARTICLE_STATUS } = require('../constants/articles');
const { CATEGORIES, WRITERS, ARTICLES, buildContent } = require('./sampleData');

/**
 * Seeds the connected database. Safe to run repeatedly (idempotent):
 * existing categories are updated, existing users/articles are left untouched.
 *
 * @param {object}  options
 * @param {object}  options.admin            { email, password, name?, username? } - required
 * @param {string}  [options.writerPassword] password for sample writers (random if omitted)
 * @param {boolean} [options.sampleContent]  seed sample writers & articles (default true)
 * @param {Function}[options.log]            logger (default console.log)
 */
const seedDatabase = async ({ admin, writerPassword, sampleContent = true, log = console.log } = {}) => {
  if (!admin || !admin.email || !admin.password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the administrator account.');
  }
  if (admin.password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const summary = { admin: null, categories: 0, writersCreated: 0, articlesCreated: 0 };

  // 1. Administrator
  const adminEmail = admin.email.toLowerCase().trim();
  let adminUser = await User.findOne({ email: adminEmail });
  if (adminUser) {
    if (adminUser.role !== ROLES.ADMIN) {
      adminUser.role = ROLES.ADMIN;
      await adminUser.save({ validateBeforeSave: false });
      log(`[Seed] Existing user ${adminEmail} promoted to admin (password unchanged).`);
    } else {
      log(`[Seed] Admin already exists: ${adminEmail} (password unchanged).`);
    }
    summary.admin = 'existing';
  } else {
    adminUser = await User.create({
      name: admin.name || 'BlogSphere Administrator',
      email: adminEmail,
      username: (admin.username || 'admin').toLowerCase(),
      password: admin.password,
      role: ROLES.ADMIN,
      isEmailVerified: true
    });
    log(`[Seed] Admin created: ${adminUser.email} (username: ${adminUser.username})`);
    summary.admin = 'created';
  }

  // 2. Categories (upsert display metadata)
  for (const cat of CATEGORIES) {
    await Category.updateOne({ slug: cat.slug }, { $set: cat }, { upsert: true, runValidators: true });
  }
  summary.categories = CATEGORIES.length;
  log(`[Seed] ${CATEGORIES.length} categories ready.`);

  if (!sampleContent) return summary;

  // 3. Sample writers
  const writerIds = {};
  for (const w of WRITERS) {
    let writer = await User.findOne({ username: w.username });
    if (!writer) {
      writer = await User.create({
        ...w,
        email: `${w.username}@blogsphere.local`,
        password: writerPassword || crypto.randomBytes(18).toString('base64url'),
        role: ROLES.WRITER,
        isEmailVerified: true
      });
      summary.writersCreated += 1;
    }
    writerIds[w.username] = writer._id;
  }
  log(`[Seed] Sample writers: ${summary.writersCreated} created, ${WRITERS.length - summary.writersCreated} already existed.`);

  // 4. Sample articles
  for (const a of ARTICLES) {
    const exists = await Article.exists({ slug: a.slug });
    if (exists) continue;

    const { author, readTime, likes, views, publishedAt, ...fields } = a;
    const article = new Article({
      ...fields,
      content: buildContent(a),
      author: writerIds[author],
      status: ARTICLE_STATUS.PUBLISHED,
      publishedAt: new Date(publishedAt)
    });
    await article.save(); // runs slug + read-time hooks
    // Keep the original stats from the mock data
    await Article.updateOne({ _id: article._id }, { $set: { readTime, likes, views } });
    summary.articlesCreated += 1;
  }
  log(`[Seed] Sample articles: ${summary.articlesCreated} created, ${ARTICLES.length - summary.articlesCreated} already existed.`);

  return summary;
};

/** Reads the seed options from environment variables. */
const seedOptionsFromEnv = () => ({
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME,
    username: process.env.ADMIN_USERNAME
  },
  writerPassword: process.env.SEED_WRITER_PASSWORD || undefined,
  sampleContent: process.env.SEED_SAMPLE_CONTENT !== 'false'
});

module.exports = { seedDatabase, seedOptionsFromEnv };
