// routes/asistencia.routes.js
const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistencia.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas están protegidas
router.use(authMiddleware.protect);

// Punto 8: Ver Historial (Filtro por fecha en Query Params)
router.get('/historial', asistenciaController.getHistorial);

// Simulación de Check-in (Solo Admin/Instructor pueden registrar asistencias)
router.post('/checkin', authMiddleware.restrictTo('admin', 'instructor'), asistenciaController.checkIn);

module.exports = router;