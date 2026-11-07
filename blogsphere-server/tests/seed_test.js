// Quiet request logging during tests
process.env.NODE_ENV = 'test';

const assert = require('assert');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Article = require('../src/models/Article');
const Category = require('../src/models/Category');
const { ROLES } = require('../src/constants/roles');
const { seedDatabase } = require('../src/seed/seedDatabase');
const { maskUri } = require('../src/config/db');

async function main() {
  console.log('\n--- Running Seed & Config Tests ---\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    const silent = () => {};

    // Requires admin credentials
    await assert.rejects(() => seedDatabase({ log: silent }), /ADMIN_EMAIL and ADMIN_PASSWORD/);
    await assert.rejects(
      () => seedDatabase({ admin: { email: 'a@b.co', password: 'short' }, log: silent }),
      /at least 8/
    );
    console.log('✓ Seed refuses to run without a valid ADMIN_EMAIL / ADMIN_PASSWORD');

    const admin = { email: 'Owner@Example.com', password: 'Strong-Pass-123', username: 'owner' };
    const first = await seedDatabase({ admin, log: silent });
    assert.strictEqual(first.admin, 'created');
    assert.strictEqual(first.writersCreated, 5);
    assert.strictEqual(first.articlesCreated, 8);

    const adminUser = await User.findOne({ email: 'owner@example.com' }).select('+password');
    assert.strictEqual(adminUser.role, ROLES.ADMIN);
    assert.ok(await adminUser.matchPassword('Strong-Pass-123'), 'admin password from options');
    assert.notStrictEqual(adminUser.password, 'Strong-Pass-123', 'password is hashed');
    assert.strictEqual(await Category.countDocuments(), 15);
    const kyrgyz = await Article.findOne({ slug: 'hidden-valleys-kyrgyzstan' });
    assert.ok(kyrgyz, 'seeded article keeps its slug');
    assert.strictEqual(kyrgyz.views, 104300, 'keeps mock stats');
    assert.strictEqual(kyrgyz.readTime, 14);
    assert.strictEqual(kyrgyz.status, 'published');
    console.log('✓ Seed creates admin, 15 categories, 5 writers and 8 articles');

    // Idempotent: second run creates nothing and keeps the admin password
    const second = await seedDatabase({ admin: { ...admin, password: 'Different-Pass-999' }, log: silent });
    assert.strictEqual(second.admin, 'existing');
    assert.strictEqual(second.writersCreated, 0);
    assert.strictEqual(second.articlesCreated, 0);
    assert.strictEqual(await Article.countDocuments(), 8);
    const again = await User.findOne({ email: 'owner@example.com' }).select('+password');
    assert.ok(await again.matchPassword('Strong-Pass-123'), 'existing admin password untouched');
    console.log('✓ Seed is idempotent and never overwrites an existing password');

    // Writer password option
    await mongoose.connection.dropDatabase();
    await seedDatabase({ admin, writerPassword: 'Writer-Pass-123', log: silent });
    const writer = await User.findOne({ username: 'alex_writes' }).select('+password');
    assert.strictEqual(writer.role, ROLES.WRITER);
    assert.ok(await writer.matchPassword('Writer-Pass-123'));
    console.log('✓ SEED_WRITER_PASSWORD is applied to sample writers');

    // Admin-only mode
    await mongoose.connection.dropDatabase();
    const adminOnly = await seedDatabase({ admin, sampleContent: false, log: silent });
    assert.strictEqual(adminOnly.admin, 'created');
    assert.strictEqual(await Article.countDocuments(), 0);
    assert.strictEqual(await Category.countDocuments(), 15);
    console.log('✓ Admin-only seed skips sample writers and articles');

    // Categories use icon keys, and re-seeding migrates legacy emoji icons
    const tech = await Category.findOne({ slug: 'technology' }).lean();
    assert.strictEqual(tech.icon, 'cpu');
    assert.ok((await Category.find().lean()).every(c => /^[a-z0-9-]+$/.test(c.icon)), 'all icons are keys');
    await Category.updateOne({ slug: 'technology' }, { $set: { icon: '💻' } });
    await seedDatabase({ admin, sampleContent: false, log: silent });
    assert.strictEqual((await Category.findOne({ slug: 'technology' }).lean()).icon, 'cpu');
    console.log('✓ Seed stores icon keys and migrates emoji category icons');

    // Credentials are masked in logs
    assert.strictEqual(
      maskUri('mongodb+srv://bob:p%40ss@cluster0.abc.mongodb.net/blogsphere?retryWrites=true'),
      'mongodb+srv://bob:****@cluster0.abc.mongodb.net/blogsphere?retryWrites=true'
    );
    assert.strictEqual(maskUri('mongodb://127.0.0.1:27017/blogsphere'), 'mongodb://127.0.0.1:27017/blogsphere');
    console.log('✓ MongoDB URIs are masked before logging');

    console.log('\n--- All Seed & Config Tests Passed Successfully! ---\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
