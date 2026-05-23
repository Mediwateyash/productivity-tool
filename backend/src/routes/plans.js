const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', planController.getPlan);
router.post('/', planController.upsertPlan);

module.exports = router;
