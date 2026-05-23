const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', achievementController.getAchievements);
router.post('/check', achievementController.checkAchievements);

module.exports = router;
