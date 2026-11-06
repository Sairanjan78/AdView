/**
 * npm run unseed
 * Removes the demo content that `npm run seed` adds: the sample writers
 * (alex_writes, priya_tech, ...) and every article they wrote, plus any
 * leftover sample articles by slug. Your admin account, your own users and
 * articles, and the categories are kept.
 */
const mongoose = require('mongoose');
require('../src/config/env'); // loads .env
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Article = require('../src/models/Article');
const { ROLES } = require('../src/constants/roles');
const { WRITERS, ARTICLES } = require('../src/seed/sampleData');

const run = async () => {
  try {
    await connectDB();
  } catch (err) {
    process.exit(1);
  }

  try {
    const usernames = WRITERS.map((w) => w.username);
    const emails = usernames.map((u) => `${u}@blogsphere.local`);
    // Only the seeded demo writers: matching username AND seeded email, never admins
    const writers = await User.find({
      username: { $in: usernames },
      email: { $in: emails },
      role: { $ne: ROLES.ADMIN }
    }).select('_id username');
    const writerIds = writers.map((w) => w._id);

    const articles = await Article.deleteMany({
      $or: [{ author: { $in: writerIds } }, { slug: { $in: ARTICLES.map((a) => a.slug) } }]
    });
    const users = await User.deleteMany({ _id: { $in: writerIds } });

    console.log(`[Unseed] Removed ${articles.deletedCount} demo articles and ${users.deletedCount} demo writers.`);
    console.log('[Unseed] Kept your admin account, your own posts and the categories.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Unseed Error]', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
