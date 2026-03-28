const phoneRotation = require('../services/phoneRotation');

const getDashboardStats = async (req, res) => {
  try {
    const stats = await phoneRotation.getDashboardStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getDashboardStats };
