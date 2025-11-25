// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

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

// Login con PIN
router.post('/login-pin', authController.loginWithPin);
// Comprobar existencia de PIN para un identifier (email o username)
router.post('/pin/check', authController.checkPinExists);

// Rutas protegidas para set/clear PIN
router.post('/pin', protect, authController.setPin);
router.delete('/pin', protect, authController.clearPin);

module.exports = router;
