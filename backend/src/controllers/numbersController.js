const { OutboundNumber } = require('../models');
const phoneRotation = require('../services/phoneRotation');

const getNumbersStatus = async (req, res) => {
  try {
    const numbers = await phoneRotation.getNumbersStatus();
    res.json(numbers);
  } catch (error) {
    console.error('Error getting numbers status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createNumber = async (req, res) => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }

    const number = await OutboundNumber.create({ phone_number, status: 'libre' });
    res.status(201).json(number);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ce numéro existe déjà' });
    }
    console.error('Error creating number:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateNumberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const number = await OutboundNumber.findByPk(id);
    if (!number) {
      return res.status(404).json({ error: 'Numéro non trouvé' });
    }

    const validStatuses = ['libre', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide. Utilisez: libre, maintenance' });
    }

    await number.update({ status, current_user_id: null, current_call_id: null });
    phoneRotation.broadcastUpdate();
    res.json(number);
  } catch (error) {
    console.error('Error updating number status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getNumbersStatus, createNumber, updateNumberStatus };
