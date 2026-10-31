const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');

let mongoServer;

async function runTests() {
  console.log('🧪 Starting Phase 2 Comprehensive Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  };

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-Memory MongoDB instance connected.\n');

    // 1. Health check
    console.log('--- Test 1: Health Check Endpoint ---');
    const healthRes = await request(app).get('/api/v1/health');
    assert(healthRes.status === 200, 'GET /api/v1/health returns 200 OK');
    assert(healthRes.body.status === 'healthy', 'Health status is "healthy"');

    // 2. Register Reader
    console.log('\n--- Test 2: Reader Registration ---');
    const readerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Reader',
        email: 'jane@example.com',
        password: 'Password123!',
        role: 'reader'
      });
    assert(readerRes.status === 201, 'POST /api/v1/auth/register returns 201 Created');
    assert(readerRes.body.success === true, 'Response success is true');
    assert(!!readerRes.body.token, 'Returns valid JWT token');
    assert(readerRes.body.data.user.role === 'reader', 'User role assigned as "reader"');
    assert(readerRes.body.data.user.username === 'jane_reader', 'Username auto-generated from name');

    // 3. Register Writer
    console.log('\n--- Test 3: Writer Registration ---');
    const writerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Alex Writer',
        email: 'alex@example.com',
        password: 'Password123!',
        role: 'writer',
        username: 'alex_wordsmith'
      });
    assert(writerRes.status === 201, 'Writer registered with 201 Created');
    assert(writerRes.body.data.user.role === 'writer', 'User role assigned as "writer"');
    assert(writerRes.body.data.user.username === 'alex_wordsmith', 'Custom username accepted');

    // 4. Reject Duplicate Email
    console.log('\n--- Test 4: Duplicate Email Rejection ---');
    const dupRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Jane',
        email: 'jane@example.com',
        password: 'Password123!'
      });
    assert(dupRes.status === 400, 'Duplicate email rejected with 400 Bad Request');
    assert(dupRes.body.message.includes('already exists'), 'Accurate duplicate error message returned');

    // 5. Successful Login
    console.log('\n--- Test 5: User Login ---');
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'Password123!'
      });
    assert(loginRes.status === 200, 'POST /api/v1/auth/login returns 200 OK');
    assert(!!loginRes.body.token, 'Login returns JWT token');
    const authToken = loginRes.body.token;

    // 6. Reject Invalid Password
    console.log('\n--- Test 6: Invalid Password Rejection ---');
    const badLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'WrongPassword999'
      });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 7. Protected Route /me with valid token
    console.log('\n--- Test 7: Protected Route Access (/me) ---');
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    assert(meRes.status === 200, 'GET /api/v1/auth/me returns 200 with Bearer token');
    assert(meRes.body.data.user.email === 'jane@example.com', 'Matches authenticated user email');

    // 8. Reject Protected Route without token
    console.log('\n--- Test 8: Protected Route Access Without Token ---');
    const unauthRes = await request(app).get('/api/v1/auth/me');
    assert(unauthRes.status === 401, 'Unauthenticated request correctly rejected with 401');

    // 9. Profile Update
    console.log('\n--- Test 9: Profile Update ---');
    const updateRes = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bio: 'Tech enthusiast and avid reader.',
        socialLinks: { twitter: 'https://twitter.com/janereader' }
      });
    assert(updateRes.status === 200, 'PUT /api/v1/auth/profile returns 200');
    assert(updateRes.body.data.user.bio === 'Tech enthusiast and avid reader.', 'Bio updated correctly');

    // 10. Logout
    console.log('\n--- Test 10: Logout ---');
    const logoutRes = await request(app).post('/api/v1/auth/logout');
    assert(logoutRes.status === 200, 'POST /api/v1/auth/logout returns 200 OK');

    console.log('\n=============================================');
    console.log(`📊 Phase 2 Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

  } catch (err) {
    console.error('Fatal test runner error:', err);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
