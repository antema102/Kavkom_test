const { OutboundNumber, CallQueue, CallLog, Contact } = require('../models');
const kavkomApi = require('./kavkomApi');

class PhoneRotationService {
  constructor(io) {
    this.io = io;
  }

  setIo(io) {
    this.io = io;
  }

  async findAvailableNumber() {
    return OutboundNumber.findOne({
      where: { status: 'libre' },
      order: [['last_used_at', 'ASC']],
    });
  }

  async getNumbersStatus() {
    return OutboundNumber.findAll({
      order: [['id', 'ASC']],
    });
  }

  async assignPhoneNumber(userId, contactId) {
    const availableNumber = await this.findAvailableNumber();

    if (availableNumber) {
      const contact = await Contact.findByPk(contactId);
      if (!contact) {
        throw new Error('Contact non trouvé');
      }

      await availableNumber.update({
        status: 'en_appel',
        current_user_id: userId,
        last_used_at: new Date(),
      });

      const callLog = await CallLog.create({
        user_id: userId,
        contact_id: contactId,
        outbound_number_id: availableNumber.id,
        destination_number: contact.phone,
        call_status: 'en_cours',
        started_at: new Date(),
      });

      await availableNumber.update({ current_call_id: callLog.id });

      await contact.update({
        last_call_date: new Date(),
        call_count: contact.call_count + 1,
        status: contact.status === 'nouveau' ? 'en_cours' : contact.status,
      });

      this.broadcastUpdate();

      return { success: true, number: availableNumber, callLog };
    } else {
      const queueEntry = await this.addToQueue(userId, contactId);
      this.broadcastUpdate();
      return {
        success: false,
        message: "Tous les numéros sont occupés. Ajouté à la file d'attente.",
        queueEntry,
      };
    }
  }

  async initiateKavkomCall(callLogId) {
    const callLog = await CallLog.findByPk(callLogId, {
      include: [{ model: OutboundNumber, as: 'outboundNumber' }],
    });

    if (!callLog) {
      throw new Error('Appel non trouvé');
    }

    try {
      const domainUuid = process.env.KAVKOM_DOMAIN_UUID;
      const result = await kavkomApi.initiateCall(
        domainUuid,
        callLog.outboundNumber.phone_number,
        callLog.destination_number
      );

      if (result && result.extension_uuid) {
        await callLog.update({ extension_uuid: result.extension_uuid });
      }

      return { success: true, kavkomResponse: result };
    } catch (error) {
      await callLog.update({ call_status: 'echoue' });
      await callLog.outboundNumber.update({
        status: 'libre',
        current_user_id: null,
        current_call_id: null,
      });

      this.broadcastUpdate();
      throw error;
    }
  }

  async endCall(callLogId) {
    const callLog = await CallLog.findByPk(callLogId);
    if (!callLog) {
      throw new Error('Appel non trouvé');
    }

    const now = new Date();
    const duration = callLog.started_at
      ? Math.round((now - new Date(callLog.started_at)) / 1000)
      : 0;

    await callLog.update({
      call_status: 'termine',
      ended_at: now,
      duration,
    });

    const outboundNumber = await OutboundNumber.findByPk(callLog.outbound_number_id);
    if (outboundNumber) {
      await outboundNumber.update({ status: 'post_appel' });
    }

    this.broadcastUpdate();

    return { success: true, callLog };
  }

  async fillCallForm(callLogId, formData) {
    const callLog = await CallLog.findByPk(callLogId);
    if (!callLog) {
      throw new Error('Appel non trouvé');
    }

    await callLog.update({
      call_result: formData.call_result,
      notes: formData.notes,
      tags: formData.tags,
      next_action: formData.next_action,
      next_call_date: formData.next_call_date || null,
      form_filled_at: new Date(),
    });

    if (formData.next_call_date) {
      await Contact.update(
        { next_call_date: formData.next_call_date },
        { where: { id: callLog.contact_id } }
      );
    }

    if (formData.contact_status) {
      await Contact.update(
        { status: formData.contact_status },
        { where: { id: callLog.contact_id } }
      );
    }

    await this.releasePhoneNumber(callLog.outbound_number_id);

    return { success: true, callLog };
  }

  async releasePhoneNumber(numberId) {
    const outboundNumber = await OutboundNumber.findByPk(numberId);
    if (!outboundNumber) {
      throw new Error('Numéro non trouvé');
    }

    await outboundNumber.update({
      status: 'libre',
      current_user_id: null,
      current_call_id: null,
    });

    const nextInQueue = await this.getNextInQueue();
    if (nextInQueue) {
      await this.processQueueEntry(nextInQueue);
    }

    this.broadcastUpdate();
  }

  async addToQueue(userId, contactId) {
    const existingEntry = await CallQueue.findOne({
      where: { user_id: userId, contact_id: contactId, status: 'en_attente' },
    });

    if (existingEntry) {
      return existingEntry;
    }

    return CallQueue.create({
      user_id: userId,
      contact_id: contactId,
      status: 'en_attente',
      queued_at: new Date(),
    });
  }

  async getNextInQueue() {
    return CallQueue.findOne({
      where: { status: 'en_attente' },
      order: [
        ['priority', 'DESC'],
        ['queued_at', 'ASC'],
      ],
    });
  }

  async processQueueEntry(queueEntry) {
    const availableNumber = await this.findAvailableNumber();
    if (!availableNumber) return;

    await queueEntry.update({
      status: 'en_cours',
      started_at: new Date(),
      assigned_number_id: availableNumber.id,
    });

    try {
      await this.assignPhoneNumber(queueEntry.user_id, queueEntry.contact_id);
      await queueEntry.update({
        status: 'termine',
        completed_at: new Date(),
      });
    } catch (error) {
      await queueEntry.update({ status: 'en_attente', assigned_number_id: null });
      console.error('Error processing queue entry:', error);
    }
  }

  async getQueueStatus() {
    return CallQueue.findAll({
      where: { status: 'en_attente' },
      order: [
        ['priority', 'DESC'],
        ['queued_at', 'ASC'],
      ],
    });
  }

  async removeFromQueue(queueId) {
    const entry = await CallQueue.findByPk(queueId);
    if (!entry) {
      throw new Error("Entrée de file d'attente non trouvée");
    }
    await entry.update({ status: 'annule' });
    this.broadcastUpdate();
    return { success: true };
  }

  async getDashboardStats(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { Op } = require('sequelize');

    const totalCalls = await CallLog.count({
      where: {
        user_id: userId,
        started_at: { [Op.gte]: today },
      },
    });

    const answeredCalls = await CallLog.count({
      where: {
        user_id: userId,
        started_at: { [Op.gte]: today },
        call_result: 'repondu',
      },
    });

    const totalDuration = await CallLog.sum('duration', {
      where: {
        user_id: userId,
        started_at: { [Op.gte]: today },
      },
    });

    return {
      totalCalls,
      answeredCalls,
      responseRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
      totalDuration: totalDuration || 0,
    };
  }

  broadcastUpdate() {
    if (this.io) {
      this.getNumbersStatus().then((numbers) => {
        this.io.emit('number_status_changed', numbers);
      });
      this.getQueueStatus().then((queue) => {
        this.io.emit('queue_updated', queue);
      });
    }
  }
}

module.exports = new PhoneRotationService();
