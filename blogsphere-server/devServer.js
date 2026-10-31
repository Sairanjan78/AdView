const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./src/app');
const env = require('./src/config/env');
const User = require('./src/models/User');
const { ROLES } = require('./src/constants/roles');

async function startDevServer() {
  try {
    console.log('[DevServer] Starting in-memory MongoDB for zero-config local development & browser testing...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`[DevServer] Connected to in-memory database: ${uri}`);

    // Seed default admin user
    const admin = await User.create({
      name: 'BlogSphere Administrator',
      email: 'admin@blogsphere.local',
      username: 'admin',
      password: 'AdminPassword123!',
      role: ROLES.ADMIN,
      isEmailVerified: true
    });
    console.log(`[DevServer] Seeded default admin: ${admin.email}`);

    // Start Express listener
    app.listen(env.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 BlogSphere Dev API Server running on port ${env.port}`);
      console.log(`📡 URL: http://localhost:${env.port}/api/v1`);
      console.log(`🩺 Health: http://localhost:${env.port}/api/v1/health`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('[DevServer Fatal]', err);
    process.exit(1);
  }
}

startDevServer();
