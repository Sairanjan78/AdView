// Forgot / reset password and "remember me" token lifetimes
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:3000';

const assert = require('assert');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const sendEmail = require('../src/utils/email');

const DAY = 24 * 60 * 60;
const tokenLifetime = (token) => {
  const { iat, exp } = jwt.decode(token);
  return exp - iat;
};
// Reset emails go out in the background; wait for one to land in the test outbox
const waitForEmails = async (count) => {
  for (let i = 0; i < 50 && sendEmail.outbox.length < count; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
  }
};
const tokenFromEmail = (mail) => {
  const match = mail.text.match(/\/reset-password\/([a-f0-9]{64})/);
  assert.ok(match, 'reset email contains a /reset-password/:token link');
  return match[1];
};

async function main() {
  console.log('\n--- Running Forgot / Reset Password & Remember Me Tests ---\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    const user = await User.create({
      name: 'Rita Reader', email: 'rita@example.com', username: 'rita_reader', password: 'Original-Pass-1'
    });

    // --- Remember me ---
    let res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'rita@example.com', password: 'Original-Pass-1', remember: true });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(tokenLifetime(res.body.token), 30 * DAY, 'remember me gives a 30-day token');
    assert.ok(/Expires=/i.test(res.headers['set-cookie'][0]), 'remember me sets a persistent cookie');

    res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'rita@example.com', password: 'Original-Pass-1', remember: false });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(tokenLifetime(res.body.token), 1 * DAY, 'no remember me gives a 1-day token');
    assert.ok(!/Expires=/i.test(res.headers['set-cookie'][0]), 'no remember me sets a browser-session cookie');
    assert.ok(res.body.expiresAt, 'response includes expiresAt');
    console.log('✓ Remember me: 30-day token when ticked, 1-day session token otherwise');

    // --- Forgot password: same answer whether the account exists ---
    res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'Rita@Example.com' });
    const unknown = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(unknown.status, 200);
    assert.deepStrictEqual(unknown.body, res.body, 'identical response for unknown email (no enumeration)');
    await waitForEmails(1);
    assert.strictEqual(sendEmail.outbox.length, 1, 'only the real account gets an email');
    assert.strictEqual(sendEmail.outbox[0].to, 'rita@example.com');
    const token = tokenFromEmail(sendEmail.outbox[0]);
    assert.ok(sendEmail.outbox[0].text.startsWith('Hi Rita Reader'));
    assert.ok(sendEmail.outbox[0].text.includes(`${env.clientUrl}/reset-password/${token}`), 'link built from CLIENT_URL');
    console.log('✓ Forgot password gives the same response for unknown emails and emails a link');

    // Stored token is a hash with a 30-minute expiry, never the raw token
    let stored = await User.findById(user._id);
    assert.notStrictEqual(stored.resetPasswordToken, token, 'raw token is not stored');
    assert.strictEqual(stored.resetPasswordToken.length, 64, 'SHA-256 hash stored');
    const ttl = stored.resetPasswordExpire.getTime() - Date.now();
    assert.ok(ttl > 29 * 60 * 1000 && ttl <= 30 * 60 * 1000, 'expires in 30 minutes');

    // A second request within a minute does not send another email
    res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'rita@example.com' });
    assert.strictEqual(res.status, 200);
    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(sendEmail.outbox.length, 1, 'resend cooldown per account');

    res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'not-an-email' });
    assert.strictEqual(res.status, 400);
    console.log('✓ Token stored hashed with 30-minute expiry; resend cooldown; bad email rejected');

    // --- Reset password ---
    res = await request(app).get(`/api/v1/auth/reset-password/${token}`);
    assert.strictEqual(res.status, 200, 'valid link checks out');

    res = await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: 'short' });
    assert.strictEqual(res.status, 400, 'weak password rejected');

    // A token issued before the reset must stop working afterwards
    const oldSessionToken = jwt.sign(
      { id: user._id, role: user.role, username: user.username, iat: Math.floor(Date.now() / 1000) - 60 },
      env.jwtSecret,
      { expiresIn: '1d' }
    );
    res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${oldSessionToken}`);
    assert.strictEqual(res.status, 200, 'old session works before the reset');

    res = await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: 'Brand-New-Pass-2' });
    assert.strictEqual(res.status, 200, 'reset succeeds');
    assert.strictEqual(res.body.token, undefined, 'reset does not sign the user in');

    res = await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: 'Another-Pass-3' });
    assert.strictEqual(res.status, 400, 'reset link is single use');
    res = await request(app).get(`/api/v1/auth/reset-password/${token}`);
    assert.strictEqual(res.status, 400, 'used link no longer checks out');

    res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${oldSessionToken}`);
    assert.strictEqual(res.status, 401, 'sessions issued before the reset are revoked');

    res = await request(app).post('/api/v1/auth/login').send({ email: 'rita@example.com', password: 'Original-Pass-1' });
    assert.strictEqual(res.status, 401, 'old password no longer works');
    res = await request(app).post('/api/v1/auth/login').send({ email: 'rita@example.com', password: 'Brand-New-Pass-2' });
    assert.strictEqual(res.status, 200, 'new password works');
    res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    assert.strictEqual(res.status, 200, 'new session works');
    console.log('✓ Reset sets the new password, is single use, and revokes older sessions');

    // --- Expired token ---
    stored = await User.findById(user._id);
    const expiredToken = stored.generatePasswordResetToken();
    stored.resetPasswordExpire = new Date(Date.now() - 1000);
    await stored.save({ validateBeforeSave: false });
    res = await request(app).get(`/api/v1/auth/reset-password/${expiredToken}`);
    assert.strictEqual(res.status, 400, 'expired link fails the check');
    res = await request(app).post('/api/v1/auth/reset-password').send({ token: expiredToken, password: 'Expired-Pass-4' });
    assert.strictEqual(res.status, 400, 'expired link cannot reset');
    console.log('✓ Expired reset links are rejected');

    // --- Rate limit: 5 requests per 15 minutes per IP (4 made above) ---
    res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    assert.strictEqual(res.status, 200);
    res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    assert.strictEqual(res.status, 429, 'forgot password is rate limited');
    console.log('✓ Forgot password is rate limited');

    console.log('\n--- All Forgot / Reset Password & Remember Me Tests Passed Successfully! ---\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
