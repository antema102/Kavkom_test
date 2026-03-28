const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getQueueStatus, removeFromQueue } = require('../controllers/queueController');

router.get('/status', authenticate, getQueueStatus);
router.delete('/:id', authenticate, removeFromQueue);

module.exports = router;
