// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rutas para solicitar el código OTP y enviarlo por email
router.post('/request-otp', authController.requestOtp);
router.post('/otp/request', authController.requestOtp); // alias compatible con enunciado

// Rutas para iniciar sesión con el código OTP
router.post('/login-otp', authController.loginWithOtp);
router.post('/otp/verify', authController.loginWithOtp); // alias compatible con enunciado

// Nuevos flujos con contraseña + verificación de email
router.post('/login', authController.loginWithPassword);
router.post('/register', authController.register);
router.post('/register/verify', authController.verifyRegistrationOtp);
router.post('/password/reset/request', authController.requestPasswordReset);
router.post('/password/reset/confirm', authController.confirmPasswordReset);

module.exports = router;
