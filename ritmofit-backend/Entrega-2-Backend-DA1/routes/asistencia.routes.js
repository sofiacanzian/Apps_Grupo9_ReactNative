// routes/asistencia.routes.js
const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistencia.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas están protegidas
router.use(authMiddleware.protect);

// Punto 8: Ver Historial (Filtro por fecha en Query Params)
router.get('/', asistenciaController.getHistorial);
router.get('/historial', asistenciaController.getHistorial);

// Simulación de Check-in mediante QR (cualquier usuario autenticado)
router.post('/checkin', asistenciaController.checkIn);

module.exports = router;
