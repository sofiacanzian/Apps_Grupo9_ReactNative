const express = require('express');
const router = express.Router();
const calificacionController = require('../controllers/calificacion.controller');

router.post('/', calificacionController.createCalificacion);
router.get('/user/:userId', calificacionController.getUserCalificaciones);
router.get('/clase/:claseId', calificacionController.getClaseCalificaciones);

module.exports = router;