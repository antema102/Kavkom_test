const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { sequelize, User, Contact, OutboundNumber, CallLog, CallQueue } = require('../src/models');
const phoneRotation = require('../src/services/phoneRotation');
const { JWT_SECRET } = require('../src/middleware/auth');

let adminUser, commercialUser, adminToken, commercialToken;
let testContact, testNumber;

function makeToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  phoneRotation.setIo(null);
  await sequelize.sync({ force: true });

  adminUser = await User.create({
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  });
  commercialUser = await User.create({
    username: 'commercial',
    password: 'comm123',
    name: 'Commercial User',
    role: 'commercial',
  });

  adminToken = makeToken(adminUser);
  commercialToken = makeToken(commercialUser);

  testContact = await Contact.create({ name: 'API Client', phone: '+33611223344', email: 'api@test.com', company: 'TestCorp' });
  testNumber = await OutboundNumber.create({ phone_number: '01 99 99 99 99' });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── Health ────────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ─── Auth ──────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.password).toBeUndefined();
  });

  test('fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('fails with unknown user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'pass' });

    expect(res.status).toBe(401);
  });

  test('fails with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── Auth middleware ───────────────────────────────────────────────────────────

describe('Authentication middleware', () => {
  test('rejects request without token', async () => {
    const res = await request(app).get('/api/numbers/status');
    expect(res.status).toBe(401);
  });

  test('rejects request with invalid token', async () => {
    const res = await request(app)
      .get('/api/numbers/status')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  test('rejects request with expired token', async () => {
    const expired = jwt.sign({ id: adminUser.id, role: 'admin' }, JWT_SECRET, { expiresIn: '0s' });
    // Wait a tick for the token to expire
    await new Promise(r => setTimeout(r, 1100));
    const res = await request(app)
      .get('/api/numbers/status')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});

// ─── Numbers ───────────────────────────────────────────────────────────────────

describe('GET /api/numbers/status', () => {
  test('returns numbers list for authenticated user', async () => {
    const res = await request(app)
      .get('/api/numbers/status')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/numbers', () => {
  test('admin can create a number', async () => {
    const res = await request(app)
      .post('/api/numbers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone_number: '01 77 77 77 77' });

    expect(res.status).toBe(201);
    expect(res.body.phone_number).toBe('01 77 77 77 77');

    // Cleanup
    await OutboundNumber.destroy({ where: { phone_number: '01 77 77 77 77' } });
  });

  test('commercial cannot create a number (403)', async () => {
    const res = await request(app)
      .post('/api/numbers')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ phone_number: '01 88 88 88 88' });

    expect(res.status).toBe(403);
  });

  test('rejects missing phone_number', async () => {
    const res = await request(app)
      .post('/api/numbers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── Calls workflow ────────────────────────────────────────────────────────────

describe('Call workflow', () => {
  let callId;

  beforeEach(async () => {
    await CallLog.destroy({ where: {} });
    await CallQueue.destroy({ where: {} });
    // Reset ALL outbound numbers to libre using class method
    await OutboundNumber.update(
      { status: 'libre', current_user_id: null, current_call_id: null },
      { where: {} }
    );
  });

  test('POST /api/calls/request - assigns a number', async () => {
    const res = await request(app)
      .post('/api/calls/request')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ contact_id: testContact.id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.callLog).toBeDefined();

    callId = res.body.callLog.id;
  });

  test('POST /api/calls/request - requires contact_id', async () => {
    const res = await request(app)
      .post('/api/calls/request')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('PUT /api/calls/:id/end - ends a call', async () => {
    // First request a call
    const reqRes = await request(app)
      .post('/api/calls/request')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ contact_id: testContact.id });

    expect(reqRes.status).toBe(200);
    expect(reqRes.body.success).toBe(true);
    callId = reqRes.body.callLog.id;

    const res = await request(app)
      .put(`/api/calls/${callId}/end`)
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.callLog.call_status).toBe('termine');
  });

  test('POST /api/calls/:id/form - fills call form', async () => {
    // Request + end a call first
    const reqRes = await request(app)
      .post('/api/calls/request')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ contact_id: testContact.id });
    expect(reqRes.body.success).toBe(true);
    callId = reqRes.body.callLog.id;

    await request(app)
      .put(`/api/calls/${callId}/end`)
      .set('Authorization', `Bearer ${commercialToken}`);

    const res = await request(app)
      .post(`/api/calls/${callId}/form`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        call_result: 'repondu',
        notes: 'Great conversation',
        next_action: 'rappeler',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/calls/:id/form - requires call_result', async () => {
    const reqRes = await request(app)
      .post('/api/calls/request')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ contact_id: testContact.id });
    expect(reqRes.body.success).toBe(true);
    callId = reqRes.body.callLog.id;

    const res = await request(app)
      .post(`/api/calls/${callId}/form`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ notes: 'No result' });

    expect(res.status).toBe(400);
  });

  test('Full workflow: request → end → form', async () => {
    // 1. Request
    const step1 = await request(app)
      .post('/api/calls/request')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ contact_id: testContact.id });
    expect(step1.status).toBe(200);
    expect(step1.body.success).toBe(true);
    callId = step1.body.callLog.id;

    // 2. End call
    const step2 = await request(app)
      .put(`/api/calls/${callId}/end`)
      .set('Authorization', `Bearer ${commercialToken}`);
    expect(step2.status).toBe(200);

    // 3. Fill form
    const step3 = await request(app)
      .post(`/api/calls/${callId}/form`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        call_result: 'pas_de_reponse',
        notes: 'No answer, try again later',
        next_action: 'rappeler',
        next_call_date: '2025-12-15',
      });
    expect(step3.status).toBe(200);

    // Verify number is released
    const number = await OutboundNumber.findByPk(testNumber.id);
    expect(number.status).toBe('libre');

    // Verify call log
    const log = await CallLog.findByPk(callId);
    expect(log.call_status).toBe('termine');
    expect(log.call_result).toBe('pas_de_reponse');
    expect(log.form_filled_at).not.toBeNull();
  });
});

// ─── Queue ─────────────────────────────────────────────────────────────────────

describe('GET /api/queue/status', () => {
  test('returns queue entries', async () => {
    const res = await request(app)
      .get('/api/queue/status')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('DELETE /api/queue/:id', () => {
  test('removes an entry from queue', async () => {
    const entry = await CallQueue.create({
      user_id: commercialUser.id,
      contact_id: testContact.id,
      status: 'en_attente',
    });

    const res = await request(app)
      .delete(`/api/queue/${entry.id}`)
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 500 for non-existent entry', async () => {
    const res = await request(app)
      .delete('/api/queue/99999')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(500);
  });
});

// ─── Contacts ──────────────────────────────────────────────────────────────────

describe('Contacts API', () => {
  test('GET /api/contacts - returns paginated contacts', async () => {
    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.contacts).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/contacts - supports search', async () => {
    const res = await request(app)
      .get('/api/contacts?search=API')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.contacts.length).toBeGreaterThanOrEqual(1);
    expect(res.body.contacts[0].name).toContain('API');
  });

  test('GET /api/contacts - supports status filter', async () => {
    const res = await request(app)
      .get('/api/contacts?status=nouveau')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    // All returned contacts should have 'nouveau' status
    for (const c of res.body.contacts) {
      expect(c.status).toBe('nouveau');
    }
  });

  test('POST /api/contacts - creates a contact', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ name: 'New Contact', phone: '+33699000000', email: 'new@test.com' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Contact');
    expect(res.body.id).toBeDefined();

    // Cleanup
    await Contact.destroy({ where: { id: res.body.id } });
  });

  test('POST /api/contacts - requires name and phone', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ email: 'only-email@test.com' });

    expect(res.status).toBe(400);
  });

  test('GET /api/contacts/:id - returns a single contact', async () => {
    const res = await request(app)
      .get(`/api/contacts/${testContact.id}`)
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testContact.id);
    expect(res.body.name).toBe('API Client');
  });

  test('GET /api/contacts/:id - returns 404 for missing contact', async () => {
    const res = await request(app)
      .get('/api/contacts/99999')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(404);
  });

  test('PUT /api/contacts/:id - updates a contact', async () => {
    const c = await Contact.create({ name: 'Update Me', phone: '0600000000' });

    const res = await request(app)
      .put(`/api/contacts/${c.id}`)
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({ name: 'Updated Name', phone: '0600000000', status: 'en_cours' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body.status).toBe('en_cours');

    await Contact.destroy({ where: { id: c.id } });
  });
});

// ─── Dashboard ─────────────────────────────────────────────────────────────────

describe('GET /api/dashboard/stats', () => {
  test('returns dashboard statistics', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalCalls');
    expect(res.body).toHaveProperty('answeredCalls');
    expect(res.body).toHaveProperty('responseRate');
    expect(res.body).toHaveProperty('totalDuration');
  });
});

// ─── Call History ──────────────────────────────────────────────────────────────

describe('GET /api/calls/history', () => {
  test('returns paginated call history', async () => {
    const res = await request(app)
      .get('/api/calls/history')
      .set('Authorization', `Bearer ${commercialToken}`);

    expect(res.status).toBe(200);
    expect(res.body.calls).toBeDefined();
    expect(res.body.pagination).toBeDefined();
  });
});
