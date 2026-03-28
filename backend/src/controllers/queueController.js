const phoneRotation = require('../services/phoneRotation');

const getQueueStatus = async (req, res) => {
  try {
    const queue = await phoneRotation.getQueueStatus();
    res.json(queue);
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const removeFromQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await phoneRotation.removeFromQueue(id);
    res.json(result);
  } catch (error) {
    console.error('Error removing from queue:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

module.exports = { getQueueStatus, removeFromQueue };
