const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', analyticsController.getAnalytics);
router.post('/parse-task', analyticsController.parseTaskShorthand);
router.post('/chat', analyticsController.chatWithMentor);

module.exports = router;
