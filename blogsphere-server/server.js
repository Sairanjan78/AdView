const mongoose = require('mongoose');
const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const start = async () => {
  if (env.nodeEnv === 'production' && env.jwtSecretIsDefault) {
    console.error('[FATAL] JWT_SECRET must be set in production. Add a long random value to your environment.');
    process.exit(1);
  }

  // The API is useless without its database, so connect first and exit clearly if it fails
  try {
    await connectDB();
  } catch (err) {
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 BlogSphere API Server running in [${env.nodeEnv}] mode`);
    console.log(`📡 URL: http://localhost:${env.port}/api/v1`);
    console.log(`🩺 Health: http://localhost:${env.port}/api/v1/health`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${env.port} is already in use. Stop the other process or set PORT in .env.`);
    } else {
      console.error('[FATAL] Server error:', err.message);
    }
    process.exit(1);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected. Requests will fail until the connection is restored.');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled Rejection:', err.name, err.message);
    server.close(() => process.exit(1));
  });

  const shutdown = () => {
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
