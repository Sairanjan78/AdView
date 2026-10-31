const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const { ROLES } = require('../src/constants/roles');

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('[Seed] Connected to MongoDB.');

    const adminEmail = 'admin@blogsphere.local';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Seed] Admin already exists: ${adminEmail}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'BlogSphere Administrator',
      email: adminEmail,
      username: 'admin',
      password: 'AdminPassword123!',
      role: ROLES.ADMIN,
      isEmailVerified: true
    });

    console.log(`[Seed] Administrator created successfully:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password: AdminPassword123!`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedAdmin();
