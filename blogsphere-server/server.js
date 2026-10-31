const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Connect to MongoDB
connectDB();

// Start Server
const server = app.listen(env.port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 BlogSphere API Server running in [${env.nodeEnv}] mode`);
  console.log(`📡 URL: http://localhost:${env.port}/api/v1`);
  console.log(`🩺 Health: http://localhost:${env.port}/api/v1/health`);
  console.log(`======================================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled Rejection:', err.name, err.message);
  server.close(() => process.exit(1));
});
