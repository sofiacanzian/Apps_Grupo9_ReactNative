// routes/reserva.routes.js
const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas de reserva están protegidas por JWT
router.use(authMiddleware.protect);

// Crear una reserva (Solo socios)
router.post('/', authMiddleware.restrictTo('socio'), reservaController.createReserva);

// Obtener reservas (Socio ve las suyas, Admin/Instructor ven todas)
router.get('/', reservaController.getAllReservas);

// Cancelar/Eliminar una reserva (Socio o Admin)
router.delete('/:id', reservaController.deleteReserva);

module.exports = router;