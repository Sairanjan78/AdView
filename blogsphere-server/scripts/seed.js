/**
 * npm run seed
 * Creates the admin account (from ADMIN_EMAIL / ADMIN_PASSWORD in .env), the categories,
 * and sample writers + articles. Safe to run more than once.
 *
 * Flags:
 *   --admin-only   only create the admin account and categories (no sample content)
 */
const mongoose = require('mongoose');
require('../src/config/env'); // loads .env
const connectDB = require('../src/config/db');
const { seedDatabase, seedOptionsFromEnv } = require('../src/seed/seedDatabase');

const run = async () => {
  const options = seedOptionsFromEnv();
  if (process.argv.includes('--admin-only')) options.sampleContent = false;

  if (!options.admin.email || !options.admin.password) {
    console.error(
      '[Seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in blogsphere-server/.env (see .env.example).'
    );
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (err) {
    process.exit(1);
  }

  try {
    await seedDatabase(options);
    console.log('[Seed] Done. Sign in with ADMIN_EMAIL / ADMIN_PASSWORD from your .env file.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
