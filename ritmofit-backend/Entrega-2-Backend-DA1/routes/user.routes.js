// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas Protegidas por el middleware 'protect'
router.use(authMiddleware.protect);

// GET /api/users/me (Ver perfil)
router.get('/me', userController.getMe);

// PUT /api/users/me (Editar perfil)
router.put('/me', userController.updateMe); 

module.exports = router;