// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas Protegidas por el middleware 'protect'
router.use(authMiddleware.protect);

// GET /api/users/me (Ver perfil)
router.get('/me', userController.getMe);
router.get('/profile', userController.getMe); // alias para compatibilidad móvil

// PUT /api/users/me (Editar perfil)
router.put('/me', userController.updateMe); 
router.put('/profile', userController.updateMe);

// OTP para eliminar cuenta
router.post('/delete/request', userController.requestAccountDeletionOtp);
router.post('/delete/confirm', userController.confirmAccountDeletion);

// Registro de tokens push
router.post('/push-token', userController.registerPushToken);
router.delete('/push-token', userController.clearPushToken);

module.exports = router;
