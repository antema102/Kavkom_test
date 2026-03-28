const { Contact } = require('../models');
const { Op } = require('sequelize');

const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Contact.findAndCountAll({
      where,
      order: [['next_call_date', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      contacts: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createContact = async (req, res) => {
  try {
    const { name, phone, email, company } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }

    const contact = await Contact.create({ name, phone, email, company });
    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getContact = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }
    res.json(contact);
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    const { name, phone, email, company, status } = req.body;
    await contact.update({ name, phone, email, company, status });
    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getContacts, createContact, getContact, updateContact };
