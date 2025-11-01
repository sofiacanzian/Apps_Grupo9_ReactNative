// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Ruta para solicitar el código OTP y enviarlo por email
router.post('/request-otp', authController.requestOtp);

// Ruta para iniciar sesión con el código OTP
router.post('/login-otp', authController.loginWithOtp);

module.exports = router;