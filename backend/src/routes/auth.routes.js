'use strict';
const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin, validateOTP, validateRequestOTP } = require('../validators/auth.validator');
const { authenticate, rateLimit } = require('../middleware');

const router = express.Router();

// OTP rate limit: 5 per 15 min per IP
const otpRateLimit = rateLimit(5, 900, 'otp');
// Login rate limit: 10 per 15 min per IP
const loginRateLimit = rateLimit(10, 900, 'login');

router.post('/register', rateLimit(5, 3600, 'register'), validateRegister, authController.register);
router.post('/verify-phone', otpRateLimit, validateOTP, authController.verifyPhone);
router.post('/login', loginRateLimit, validateLogin, authController.login);
router.post('/request-otp', otpRateLimit, validateRequestOTP, authController.requestOTP);
router.post('/refresh', rateLimit(20, 900, 'refresh'), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
