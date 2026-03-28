const { sequelize, User, Contact, OutboundNumber, CallLog, CallQueue } = require('../src/models');
const phoneRotation = require('../src/services/phoneRotation');

beforeAll(async () => {
  // Disable websocket broadcasts during tests
  phoneRotation.setIo(null);
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

async function cleanAll() {
  await CallLog.destroy({ where: {} });
  await CallQueue.destroy({ where: {} });
  await OutboundNumber.destroy({ where: {} });
  await Contact.destroy({ where: {} });
  await User.destroy({ where: {} });
}

describe('PhoneRotationService', () => {
  let user, contact, number1, number2;

  beforeEach(async () => {
    await cleanAll();
    user = await User.create({ username: 'sales1', password: 'pass', name: 'Sales Rep' });
    contact = await Contact.create({ name: 'Client A', phone: '+33600000001' });
    number1 = await OutboundNumber.create({ phone_number: '01 10 10 10 10' });
    number2 = await OutboundNumber.create({ phone_number: '01 20 20 20 20' });
  });

  describe('findAvailableNumber', () => {
    test('returns a free number', async () => {
      const available = await phoneRotation.findAvailableNumber();
      expect(available).not.toBeNull();
      expect(available.status).toBe('libre');
    });

    test('returns null when no numbers are free', async () => {
      await number1.update({ status: 'en_appel' });
      await number2.update({ status: 'en_appel' });

      const available = await phoneRotation.findAvailableNumber();
      expect(available).toBeNull();
    });

    test('returns the least recently used number', async () => {
      const past = new Date('2020-01-01');
      const recent = new Date('2024-01-01');
      await number1.update({ last_used_at: recent });
      await number2.update({ last_used_at: past });

      const available = await phoneRotation.findAvailableNumber();
      expect(available.id).toBe(number2.id);
    });
  });

  describe('getNumbersStatus', () => {
    test('returns all numbers ordered by id', async () => {
      const numbers = await phoneRotation.getNumbersStatus();
      expect(numbers).toHaveLength(2);
      expect(numbers[0].id).toBe(number1.id);
      expect(numbers[1].id).toBe(number2.id);
    });
  });

  describe('assignPhoneNumber', () => {
    test('assigns an available number and creates a call log', async () => {
      const result = await phoneRotation.assignPhoneNumber(user.id, contact.id);

      expect(result.success).toBe(true);
      expect(result.number).toBeDefined();
      expect(result.callLog).toBeDefined();
      expect(result.callLog.user_id).toBe(user.id);
      expect(result.callLog.contact_id).toBe(contact.id);
      expect(result.callLog.call_status).toBe('en_cours');

      // Verify number status updated
      const updatedNumber = await OutboundNumber.findByPk(result.number.id);
      expect(updatedNumber.status).toBe('en_appel');
      expect(updatedNumber.current_user_id).toBe(user.id);
      expect(updatedNumber.current_call_id).toBe(result.callLog.id);
    });

    test('updates contact on first call', async () => {
      await phoneRotation.assignPhoneNumber(user.id, contact.id);

      const updatedContact = await Contact.findByPk(contact.id);
      expect(updatedContact.status).toBe('en_cours');
      expect(updatedContact.call_count).toBe(1);
      expect(updatedContact.last_call_date).not.toBeNull();
    });

    test('queues when no numbers available', async () => {
      await number1.update({ status: 'en_appel' });
      await number2.update({ status: 'en_appel' });

      const result = await phoneRotation.assignPhoneNumber(user.id, contact.id);

      expect(result.success).toBe(false);
      expect(result.queueEntry).toBeDefined();
      expect(result.queueEntry.status).toBe('en_attente');
      expect(result.message).toContain("file d'attente");
    });

    test('throws if contact not found', async () => {
      await expect(
        phoneRotation.assignPhoneNumber(user.id, 99999)
      ).rejects.toThrow('Contact non trouvé');
    });
  });

  describe('endCall', () => {
    test('ends a call and transitions number to post_appel', async () => {
      const assignResult = await phoneRotation.assignPhoneNumber(user.id, contact.id);
      const callLogId = assignResult.callLog.id;

      const result = await phoneRotation.endCall(callLogId);

      expect(result.success).toBe(true);
      expect(result.callLog.call_status).toBe('termine');
      expect(result.callLog.ended_at).not.toBeNull();
      expect(result.callLog.duration).toBeGreaterThanOrEqual(0);

      const updatedNumber = await OutboundNumber.findByPk(assignResult.number.id);
      expect(updatedNumber.status).toBe('post_appel');
    });

    test('throws if call not found', async () => {
      await expect(phoneRotation.endCall(99999)).rejects.toThrow('Appel non trouvé');
    });
  });

  describe('fillCallForm', () => {
    test('fills form data and releases number', async () => {
      const assignResult = await phoneRotation.assignPhoneNumber(user.id, contact.id);
      const callLogId = assignResult.callLog.id;
      await phoneRotation.endCall(callLogId);

      const result = await phoneRotation.fillCallForm(callLogId, {
        call_result: 'repondu',
        notes: 'Interested in product',
        tags: ['hot-lead'],
        next_action: 'rappeler',
        next_call_date: '2025-12-01',
        contact_status: 'converti',
      });

      expect(result.success).toBe(true);
      expect(result.callLog.call_result).toBe('repondu');
      expect(result.callLog.notes).toBe('Interested in product');
      expect(result.callLog.form_filled_at).not.toBeNull();

      // Number released
      const updatedNumber = await OutboundNumber.findByPk(assignResult.number.id);
      expect(updatedNumber.status).toBe('libre');
      expect(updatedNumber.current_user_id).toBeNull();
      expect(updatedNumber.current_call_id).toBeNull();

      // Contact updated
      const updatedContact = await Contact.findByPk(contact.id);
      expect(updatedContact.status).toBe('converti');
      expect(updatedContact.next_call_date).not.toBeNull();
    });

    test('throws if call not found', async () => {
      await expect(
        phoneRotation.fillCallForm(99999, { call_result: 'repondu' })
      ).rejects.toThrow('Appel non trouvé');
    });
  });

  describe('Queue management', () => {
    test('addToQueue creates an entry', async () => {
      const entry = await phoneRotation.addToQueue(user.id, contact.id);
      expect(entry.status).toBe('en_attente');
      expect(entry.user_id).toBe(user.id);
      expect(entry.contact_id).toBe(contact.id);
    });

    test('addToQueue returns existing entry if duplicate', async () => {
      const entry1 = await phoneRotation.addToQueue(user.id, contact.id);
      const entry2 = await phoneRotation.addToQueue(user.id, contact.id);
      expect(entry1.id).toBe(entry2.id);
    });

    test('getNextInQueue returns highest priority first', async () => {
      const contact2 = await Contact.create({ name: 'Client B', phone: '+33600000002' });
      await CallQueue.create({ user_id: user.id, contact_id: contact.id, priority: 1, queued_at: new Date() });
      await CallQueue.create({ user_id: user.id, contact_id: contact2.id, priority: 5, queued_at: new Date() });

      const next = await phoneRotation.getNextInQueue();
      expect(next.contact_id).toBe(contact2.id);
    });

    test('getQueueStatus returns only waiting entries', async () => {
      await CallQueue.create({ user_id: user.id, contact_id: contact.id, status: 'en_attente' });
      await CallQueue.create({
        user_id: user.id,
        contact_id: (await Contact.create({ name: 'Done', phone: '123' })).id,
        status: 'termine',
      });

      const queue = await phoneRotation.getQueueStatus();
      expect(queue).toHaveLength(1);
      expect(queue[0].status).toBe('en_attente');
    });

    test('removeFromQueue cancels entry', async () => {
      const entry = await CallQueue.create({ user_id: user.id, contact_id: contact.id });
      await phoneRotation.removeFromQueue(entry.id);

      const updated = await CallQueue.findByPk(entry.id);
      expect(updated.status).toBe('annule');
    });

    test('removeFromQueue throws for invalid id', async () => {
      await expect(phoneRotation.removeFromQueue(99999)).rejects.toThrow();
    });
  });

  describe('releasePhoneNumber & queue processing', () => {
    test('releasing a number processes next queue entry', async () => {
      // Occupy both numbers
      await number1.update({ status: 'en_appel', current_user_id: user.id });
      await number2.update({ status: 'en_appel', current_user_id: user.id });

      // Add to queue
      const contact2 = await Contact.create({ name: 'Queued Client', phone: '+33600000003' });
      const user2 = await User.create({ username: 'sales2', password: 'pass', name: 'Sales Rep 2' });
      await phoneRotation.addToQueue(user2.id, contact2.id);

      // Release number1
      await number1.update({ status: 'libre', current_user_id: null, current_call_id: null });

      // Manually trigger releasePhoneNumber logic on number2
      await phoneRotation.releasePhoneNumber(number2.id);

      // The queue entry should have been processed
      const queueEntries = await CallQueue.findAll({ where: { user_id: user2.id } });
      // At least one should be 'termine' (processed) or 'en_attente' if there was a second assignment
      const hasProcessed = queueEntries.some(e => e.status === 'termine');
      expect(hasProcessed).toBe(true);
    });

    test('throws if number not found', async () => {
      await expect(phoneRotation.releasePhoneNumber(99999)).rejects.toThrow('Numéro non trouvé');
    });
  });

  describe('getDashboardStats', () => {
    test('returns stats for the current day', async () => {
      // Create calls for today
      const assignResult = await phoneRotation.assignPhoneNumber(user.id, contact.id);
      await phoneRotation.endCall(assignResult.callLog.id);
      await phoneRotation.fillCallForm(assignResult.callLog.id, {
        call_result: 'repondu',
        notes: 'Test',
      });

      const stats = await phoneRotation.getDashboardStats(user.id);

      expect(stats.totalCalls).toBe(1);
      expect(stats.answeredCalls).toBe(1);
      expect(stats.responseRate).toBe(100);
      expect(stats.totalDuration).toBeGreaterThanOrEqual(0);
    });

    test('returns zeros when no calls', async () => {
      const stats = await phoneRotation.getDashboardStats(user.id);

      expect(stats.totalCalls).toBe(0);
      expect(stats.answeredCalls).toBe(0);
      expect(stats.responseRate).toBe(0);
      expect(stats.totalDuration).toBe(0);
    });
  });

  describe('broadcastUpdate', () => {
    test('emits events when io is set', async () => {
      const mockIo = {
        emit: jest.fn(),
      };
      phoneRotation.setIo(mockIo);

      phoneRotation.broadcastUpdate();

      // Allow async broadcast promises to resolve
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockIo.emit).toHaveBeenCalledWith('number_status_changed', expect.any(Array));
      expect(mockIo.emit).toHaveBeenCalledWith('queue_updated', expect.any(Array));

      phoneRotation.setIo(null);
    });

    test('does not throw when io is null', () => {
      phoneRotation.setIo(null);
      expect(() => phoneRotation.broadcastUpdate()).not.toThrow();
    });
  });
});
