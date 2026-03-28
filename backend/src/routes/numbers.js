const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getNumbersStatus, createNumber, updateNumberStatus } = require('../controllers/numbersController');

router.get('/status', authenticate, getNumbersStatus);
router.post('/', authenticate, authorize('admin'), createNumber);
router.put('/:id/status', authenticate, authorize('admin', 'superviseur'), updateNumberStatus);

module.exports = router;
