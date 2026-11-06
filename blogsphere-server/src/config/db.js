const mongoose = require('mongoose');
const env = require('./env');

/**
 * Hide the password part of a connection string before printing it.
 * mongodb+srv://user:secret@cluster0.x.mongodb.net/blogsphere -> mongodb+srv://user:****@cluster0.x.mongodb.net/blogsphere
 */
const maskUri = (uri = '') => uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:****@');

/**
 * Work out which MongoDB URI to use.
 * - MONGODB_URI set           -> use it (local MongoDB or MongoDB Atlas, identical code path)
 * - missing in development    -> fall back to a local MongoDB on 127.0.0.1:27017 with a warning
 * - missing anywhere else     -> throw (server/seed exit with a helpful message)
 */
const resolveMongoUri = () => {
  if (env.mongoUri) return env.mongoUri;

  if (env.nodeEnv === 'development') {
    console.warn(
      `[Database Notice] MONGODB_URI is not set. Falling back to local MongoDB at ${env.devLocalMongoUri}.\n` +
      '                  Create blogsphere-server/.env from .env.example and set MONGODB_URI to use MongoDB Atlas.'
    );
    return env.devLocalMongoUri;
  }

  const err = new Error('MONGODB_URI is not set.');
  err.code = 'MONGODB_URI_MISSING';
  throw err;
};

const printHelp = (uri, error) => {
  const lines = [
    '',
    '======================================================',
    '❌ Could not connect to MongoDB',
    '======================================================',
    error.code === 'MONGODB_URI_MISSING'
      ? '   Reason: MONGODB_URI is missing from the environment / .env file.'
      : `   URI:    ${maskUri(uri)}\n   Reason: ${error.message}`,
    '',
    '   How to fix:',
    '   1. Make sure blogsphere-server/.env exists (copy it from .env.example).',
    '   2. Set MONGODB_URI to one of:',
    '        - MongoDB Atlas: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/blogsphere?retryWrites=true&w=majority',
    '        - Local MongoDB: mongodb://127.0.0.1:27017/blogsphere',
    '   3. Atlas only: check the database user/password (Database Access) and that your',
    '      current IP is allowed (Network Access). Special characters in the password',
    '      must be URL-encoded (e.g. @ -> %40).',
    '   4. Local only: make sure the MongoDB service (mongod) is running.',
    '======================================================',
    ''
  ];
  console.error(lines.join('\n'));
};

/**
 * Connect to MongoDB. Resolves with the mongoose connection, or rejects with a
 * descriptive error after printing setup help. Callers decide whether to exit.
 */
const connectDB = async () => {
  let uri;
  try {
    uri = resolveMongoUri();
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT_MS, 10) || 10000
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host} / db "${conn.connection.name}"`);
    return conn;
  } catch (error) {
    printHelp(uri, error);
    throw error;
  }
};

module.exports = connectDB;
module.exports.maskUri = maskUri;
module.exports.resolveMongoUri = resolveMongoUri;
