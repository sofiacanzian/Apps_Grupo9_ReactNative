const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistencia.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware.protect);

router.get('/', asistenciaController.getHistorial);

module.exports = router;
