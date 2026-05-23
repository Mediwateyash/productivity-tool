const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route    POST api/auth/register
// @desc     Register user
// @access   Public
router.post('/register', authController.register);

// @route    POST api/auth/login
// @desc     Login user & get token
// @access   Public
router.post('/login', authController.login);

// @route    GET api/auth/profile
// @desc     Get current user profile
// @access   Private
router.get('/profile', auth, authController.getProfile);

// @route    PUT api/auth/profile
// @desc     Update user profile (theme, stats, settings)
// @access   Private
router.put('/profile', auth, authController.updateProfile);

// @route    POST api/auth/test-email
// @desc     Send test email reminder
// @access   Private
router.post('/test-email', auth, authController.sendTestEmail);

module.exports = router;
