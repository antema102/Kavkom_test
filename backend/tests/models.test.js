const { sequelize, User, Contact, OutboundNumber, CallLog, CallQueue } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('User model', () => {
  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  test('creates a user with hashed password', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'plaintext123',
      name: 'Test User',
      role: 'commercial',
    });

    expect(user.id).toBeDefined();
    expect(user.username).toBe('testuser');
    expect(user.password).not.toBe('plaintext123');
    expect(user.role).toBe('commercial');
    expect(user.is_active).toBe(true);
  });

  test('validates password correctly', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'mypassword',
      name: 'Test User',
    });

    expect(await user.validatePassword('mypassword')).toBe(true);
    expect(await user.validatePassword('wrongpassword')).toBe(false);
  });

  test('toJSON excludes password', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'secret',
      name: 'Test User',
    });

    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.username).toBe('testuser');
  });

  test('enforces unique username', async () => {
    await User.create({ username: 'unique', password: 'pass', name: 'User 1' });
    await expect(
      User.create({ username: 'unique', password: 'pass', name: 'User 2' })
    ).rejects.toThrow();
  });

  test('requires username, password, and name', async () => {
    await expect(User.create({ password: 'p', name: 'n' })).rejects.toThrow();
    await expect(User.create({ username: 'u', name: 'n' })).rejects.toThrow();
    await expect(User.create({ username: 'u', password: 'p' })).rejects.toThrow();
  });

  test('defaults role to commercial', async () => {
    const user = await User.create({ username: 'u', password: 'p', name: 'N' });
    expect(user.role).toBe('commercial');
  });
});

describe('Contact model', () => {
  afterEach(async () => {
    await Contact.destroy({ where: {} });
  });

  test('creates a contact with defaults', async () => {
    const contact = await Contact.create({ name: 'Alice', phone: '+33612345678' });

    expect(contact.id).toBeDefined();
    expect(contact.name).toBe('Alice');
    expect(contact.status).toBe('nouveau');
    expect(contact.call_count).toBe(0);
  });

  test('requires name and phone', async () => {
    await expect(Contact.create({ name: 'Alice' })).rejects.toThrow();
    await expect(Contact.create({ phone: '123' })).rejects.toThrow();
  });

  test('allows optional fields', async () => {
    const contact = await Contact.create({
      name: 'Bob',
      phone: '+33699887766',
      email: 'bob@test.com',
      company: 'ACME',
    });

    expect(contact.email).toBe('bob@test.com');
    expect(contact.company).toBe('ACME');
  });
});

describe('OutboundNumber model', () => {
  afterEach(async () => {
    await OutboundNumber.destroy({ where: {} });
  });

  test('creates an outbound number with defaults', async () => {
    const number = await OutboundNumber.create({ phone_number: '01 00 00 00 01' });

    expect(number.id).toBeDefined();
    expect(number.status).toBe('libre');
    expect(number.current_user_id == null).toBe(true);
    expect(number.current_call_id == null).toBe(true);
  });

  test('enforces unique phone_number', async () => {
    await OutboundNumber.create({ phone_number: '01 00 00 00 02' });
    await expect(
      OutboundNumber.create({ phone_number: '01 00 00 00 02' })
    ).rejects.toThrow();
  });

  test('requires phone_number', async () => {
    await expect(OutboundNumber.create({})).rejects.toThrow();
  });
});

describe('CallLog model', () => {
  let user, contact, number;

  beforeAll(async () => {
    user = await User.create({ username: 'calluser', password: 'pass', name: 'Caller' });
    contact = await Contact.create({ name: 'Target', phone: '0600000000' });
    number = await OutboundNumber.create({ phone_number: '01 11 11 11 11' });
  });

  afterAll(async () => {
    await CallLog.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Contact.destroy({ where: {} });
    await OutboundNumber.destroy({ where: {} });
  });

  test('creates a call log', async () => {
    const log = await CallLog.create({
      user_id: user.id,
      contact_id: contact.id,
      outbound_number_id: number.id,
      destination_number: contact.phone,
      call_status: 'en_cours',
    });

    expect(log.id).toBeDefined();
    expect(log.call_status).toBe('en_cours');
    expect(log.call_result == null).toBe(true);
  });

  test('requires user_id, contact_id, outbound_number_id, destination_number', async () => {
    await expect(CallLog.create({
      contact_id: contact.id,
      outbound_number_id: number.id,
      destination_number: '123',
    })).rejects.toThrow();
  });
});

describe('CallQueue model', () => {
  let user, contact;

  beforeAll(async () => {
    user = await User.create({ username: 'queueuser', password: 'pass', name: 'Queue User' });
    contact = await Contact.create({ name: 'Queue Target', phone: '0611111111' });
  });

  afterAll(async () => {
    await CallQueue.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Contact.destroy({ where: {} });
  });

  test('creates a queue entry with defaults', async () => {
    const entry = await CallQueue.create({
      user_id: user.id,
      contact_id: contact.id,
    });

    expect(entry.id).toBeDefined();
    expect(entry.status).toBe('en_attente');
    expect(entry.priority).toBe(0);
    expect(entry.assigned_number_id == null).toBe(true);
  });
});

describe('Associations', () => {
  let user, contact, number, callLog;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    user = await User.create({ username: 'assocuser', password: 'pass', name: 'Assoc User' });
    contact = await Contact.create({ name: 'Assoc Contact', phone: '0622222222' });
    number = await OutboundNumber.create({ phone_number: '01 22 22 22 22' });
    callLog = await CallLog.create({
      user_id: user.id,
      contact_id: contact.id,
      outbound_number_id: number.id,
      destination_number: contact.phone,
      call_status: 'en_cours',
    });
  });

  afterAll(async () => {
    await CallLog.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Contact.destroy({ where: {} });
    await OutboundNumber.destroy({ where: {} });
  });

  test('CallLog belongs to User', async () => {
    const log = await CallLog.findByPk(callLog.id, { include: [{ model: User, as: 'user' }] });
    expect(log.user).toBeDefined();
    expect(log.user.username).toBe('assocuser');
  });

  test('CallLog belongs to Contact', async () => {
    const log = await CallLog.findByPk(callLog.id, { include: [{ model: Contact, as: 'contact' }] });
    expect(log.contact).toBeDefined();
    expect(log.contact.name).toBe('Assoc Contact');
  });

  test('CallLog belongs to OutboundNumber', async () => {
    const log = await CallLog.findByPk(callLog.id, {
      include: [{ model: OutboundNumber, as: 'outboundNumber' }],
    });
    expect(log.outboundNumber).toBeDefined();
    expect(log.outboundNumber.phone_number).toBe('01 22 22 22 22');
  });

  test('User has many CallLogs', async () => {
    const u = await User.findByPk(user.id, { include: [{ model: CallLog, as: 'calls' }] });
    expect(u.calls).toHaveLength(1);
  });

  test('Contact has many CallLogs', async () => {
    const c = await Contact.findByPk(contact.id, { include: [{ model: CallLog, as: 'calls' }] });
    expect(c.calls).toHaveLength(1);
  });
});
