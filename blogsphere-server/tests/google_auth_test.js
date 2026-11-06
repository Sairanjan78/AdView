// "Continue with Google" with a mocked Google ID-token verifier
process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

const assert = require('assert');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const googleAuth = require('../src/utils/googleAuth');
const { ROLES } = require('../src/constants/roles');

// credential string -> payload Google would return; anything else is an invalid token
const fakeTokens = {
  'new-user': { sub: 'g-100', email: 'New.Person@gmail.com', email_verified: true, name: 'New Person', picture: 'https://lh3.googleusercontent.com/a/new' },
  'existing-user': { sub: 'g-200', email: 'writer@example.com', email_verified: true, name: 'Writer Google' },
  'other-google-same-email': { sub: 'g-999', email: 'writer@example.com', email_verified: true, name: 'Impostor' },
  unverified: { sub: 'g-300', email: 'unverified@gmail.com', email_verified: false, name: 'Unverified' },
  'short-name': { sub: 'g-400', email: 'al@gmail.com', email_verified: true, name: 'Al' }
};
googleAuth.verifyIdToken = async (idToken) => {
  if (!fakeTokens[idToken]) throw new Error('Invalid token signature');
  return fakeTokens[idToken];
};

const DAY = 24 * 60 * 60;
const lifetime = (token) => { const { iat, exp } = jwt.decode(token); return exp - iat; };

async function main() {
  console.log('\n--- Running Google Sign-In Tests ---\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    // New account: always a verified reader, even if the request asks for admin
    let res = await request(app).post('/api/v1/auth/google')
      .send({ credential: 'new-user', remember: true, role: ROLES.ADMIN });
    assert.strictEqual(res.status, 201, 'new Google user is created');
    assert.strictEqual(res.body.data.user.role, ROLES.READER, 'never auto-creates admins');
    assert.strictEqual(res.body.data.user.email, 'new.person@gmail.com');
    assert.strictEqual(res.body.data.user.isEmailVerified, true);
    assert.strictEqual(lifetime(res.body.token), 30 * DAY, 'remember me respected');
    const created = await User.findOne({ email: 'new.person@gmail.com' }).select('+googleId +password');
    assert.strictEqual(created.googleId, 'g-100');
    assert.ok(created.password.startsWith('$2'), 'random password is stored hashed');
    const newId = res.body.data.user.id;
    console.log('✓ Creates a verified reader account (never admin) and respects remember me');

    res = await request(app).post('/api/v1/auth/google').send({ credential: 'new-user', remember: false });
    assert.strictEqual(res.status, 200, 'second Google sign-in logs in');
    assert.strictEqual(res.body.data.user.id, newId, 'same account');
    assert.strictEqual(lifetime(res.body.token), 1 * DAY, 'session token without remember me');
    res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    assert.strictEqual(res.status, 200, 'Google token works on protected routes');
    assert.strictEqual(await User.countDocuments({ email: 'new.person@gmail.com' }), 1);
    console.log('✓ Signing in again reuses the same account');

    // Existing password account is linked by email and keeps its role
    const writer = await User.create({
      name: 'Existing Writer', email: 'writer@example.com', username: 'existing_writer',
      password: 'Writer-Pass-1', role: ROLES.WRITER
    });
    res = await request(app).post('/api/v1/auth/google').send({ credential: 'existing-user' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.user.id, String(writer._id), 'links to the existing account');
    assert.strictEqual(res.body.data.user.role, ROLES.WRITER, 'keeps the existing role');
    const linked = await User.findById(writer._id).select('+googleId');
    assert.strictEqual(linked.googleId, 'g-200');
    assert.strictEqual(linked.isEmailVerified, true);
    res = await request(app).post('/api/v1/auth/login').send({ email: 'writer@example.com', password: 'Writer-Pass-1' });
    assert.strictEqual(res.status, 200, 'password sign-in still works after linking');
    console.log('✓ Links Google to an existing account by email');

    res = await request(app).post('/api/v1/auth/google').send({ credential: 'other-google-same-email' });
    assert.strictEqual(res.status, 409, 'a different Google account cannot take over a linked account');

    res = await request(app).post('/api/v1/auth/google').send({ credential: 'unverified' });
    assert.strictEqual(res.status, 401, 'unverified Google email rejected');
    assert.strictEqual(await User.countDocuments({ email: 'unverified@gmail.com' }), 0);

    res = await request(app).post('/api/v1/auth/google').send({ credential: 'forged-token' });
    assert.strictEqual(res.status, 401, 'invalid ID token rejected');

    res = await request(app).post('/api/v1/auth/google').send({});
    assert.strictEqual(res.status, 400, 'missing credential rejected');

    res = await request(app).post('/api/v1/auth/google').send({ credential: 'short-name' });
    assert.strictEqual(res.status, 201, 'short Google names still get a valid username');
    assert.ok(res.body.data.user.username.length >= 3);
    console.log('✓ Rejects other Google accounts, unverified emails, forged and missing tokens');

    // Hidden entirely when GOOGLE_CLIENT_ID is not set
    env.googleClientId = '';
    res = await request(app).post('/api/v1/auth/google').send({ credential: 'new-user' });
    assert.strictEqual(res.status, 503, 'disabled when GOOGLE_CLIENT_ID is not set');
    console.log('✓ Route is disabled without GOOGLE_CLIENT_ID');

    console.log('\n--- All Google Sign-In Tests Passed Successfully! ---\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
