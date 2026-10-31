const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.warn(`[Database Notice] Ensure MongoDB is running locally at ${env.mongoUri} or provide a valid Atlas connection string in .env`);
    // In production we would exit, but in development allow server to start so healthchecks pass
    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
