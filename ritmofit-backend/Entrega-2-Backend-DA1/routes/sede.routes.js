// routes/sede.routes.js
const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sede.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas de Acceso Público (Cualquier usuario puede ver las sedes)
router.get('/', sedeController.getAllSedes);
router.get('/:id', sedeController.getSede);

// Rutas Protegidas (Solo Admin puede CREAR, ACTUALIZAR, BORRAR)
router.use(authMiddleware.protect, authMiddleware.restrictTo('admin'));

router.post('/', sedeController.createSede);
router.patch('/:id', sedeController.updateSede);
router.delete('/:id', sedeController.deleteSede);

module.exports = router;