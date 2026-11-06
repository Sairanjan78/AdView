/**
 * npm run dev:memory
 * Zero-config playground: starts a throwaway in-memory MongoDB, seeds it, and runs the API.
 * Everything is lost when the process stops. Use `npm run dev` with MONGODB_URI for real data.
 */
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./src/app');
const env = require('./src/config/env');
const { seedDatabase, seedOptionsFromEnv } = require('./src/seed/seedDatabase');

async function startDevServer() {
  try {
    console.log('[DevServer] Starting in-memory MongoDB (data is NOT saved)...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`[DevServer] Connected to in-memory database: ${uri}`);

    const options = seedOptionsFromEnv();
    let generatedPassword = null;
    if (!options.admin.email) options.admin.email = 'admin@blogsphere.local';
    if (!options.admin.password) {
      generatedPassword = crypto.randomBytes(9).toString('base64url');
      options.admin.password = generatedPassword;
    }
    await seedDatabase(options);
    if (generatedPassword) {
      console.log(`[DevServer] No ADMIN_PASSWORD in .env - temporary admin password for this session: ${generatedPassword}`);
    }

    app.listen(env.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 BlogSphere Dev API Server (in-memory DB) on port ${env.port}`);
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
