const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requestCall, initiateCall, endCall, fillCallForm, getCallHistory } = require('../controllers/callsController');

router.post('/request', authenticate, requestCall);
router.post('/initiate', authenticate, initiateCall);
router.put('/:id/end', authenticate, endCall);
router.post('/:id/form', authenticate, fillCallForm);
router.get('/history', authenticate, getCallHistory);

module.exports = router;
