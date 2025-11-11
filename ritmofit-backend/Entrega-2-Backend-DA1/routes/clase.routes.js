// routes/clase.routes.js
const express = require('express');
const router = express.Router();
const claseController = require('../controllers/clase.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas de Acceso Público (Cualquier usuario puede ver el horario)
router.get('/', claseController.getAllClases);
router.get('/:id', claseController.getClaseById);

// Rutas Protegidas (Solo Admin/Instructor pueden CREAR, ACTUALIZAR, BORRAR)
router.use(authMiddleware.protect);

// Admin y Instructor pueden crear/actualizar
router.post('/', authMiddleware.restrictTo('admin', 'instructor'), claseController.createClase);
router.patch('/:id', authMiddleware.restrictTo('admin', 'instructor'), claseController.updateClase);

// Solo Admin puede eliminar
router.delete('/:id', authMiddleware.restrictTo('admin'), claseController.deleteClase);

module.exports = router;
