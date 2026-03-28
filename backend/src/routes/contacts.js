const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getContacts, createContact, getContact, updateContact } = require('../controllers/contactsController');

router.get('/', authenticate, getContacts);
router.post('/', authenticate, createContact);
router.get('/:id', authenticate, getContact);
router.put('/:id', authenticate, updateContact);

module.exports = router;
