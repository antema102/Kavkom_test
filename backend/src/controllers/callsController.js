const phoneRotation = require('../services/phoneRotation');
const { CallLog, Contact, OutboundNumber, User } = require('../models');

const requestCall = async (req, res) => {
  try {
    const { contact_id } = req.body;
    if (!contact_id) {
      return res.status(400).json({ error: 'contact_id requis' });
    }

    const result = await phoneRotation.assignPhoneNumber(req.user.id, contact_id);
    res.json(result);
  } catch (error) {
    console.error('Error requesting call:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

const initiateCall = async (req, res) => {
  try {
    const { call_id } = req.body;
    if (!call_id) {
      return res.status(400).json({ error: 'call_id requis' });
    }

    const result = await phoneRotation.initiateKavkomCall(call_id);
    res.json(result);
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'initiation de l\'appel' });
  }
};

const endCall = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await phoneRotation.endCall(id);
    res.json(result);
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

const fillCallForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { call_result, notes, tags, next_action, next_call_date, contact_status } = req.body;

    if (!call_result) {
      return res.status(400).json({ error: 'Résultat de l\'appel requis' });
    }

    const result = await phoneRotation.fillCallForm(id, {
      call_result,
      notes,
      tags,
      next_action,
      next_call_date,
      contact_status,
    });

    res.json(result);
  } catch (error) {
    console.error('Error filling call form:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (req.user.role === 'commercial') {
      where.user_id = req.user.id;
    }

    const { count, rows } = await CallLog.findAndCountAll({
      where,
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'name', 'phone', 'company'] },
        { model: OutboundNumber, as: 'outboundNumber', attributes: ['id', 'phone_number'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      order: [['started_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      calls: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { requestCall, initiateCall, endCall, fillCallForm, getCallHistory };
