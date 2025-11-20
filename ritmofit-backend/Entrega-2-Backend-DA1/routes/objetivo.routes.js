// routes/objetivo.routes.js
const express = require('express');
const router = express.Router();
const objetivoController = require('../controllers/objetivo.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware.protect);

router.post('/', objetivoController.createObjetivo);
router.get('/', objetivoController.getUserObjetivos);
router.get('/:id/progress', objetivoController.getObjetivoProgress);
router.put('/:id', objetivoController.updateObjetivo);
router.delete('/:id', objetivoController.deleteObjetivo);

module.exports = router;

