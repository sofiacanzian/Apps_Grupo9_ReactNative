const express = require('express');
const router = express.Router();
const noticiasController = require('../controllers/noticias.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas públicas
router.get('/', noticiasController.getNoticias);
router.get('/:id', noticiasController.getNoticiaById);

// Rutas que requieren autenticación del usuario (marcar leída)
// Permitimos que usuarios autenticados marquen noticias leídas
router.post('/:id/leida', authMiddleware.protect, noticiasController.marcarLeida);

// Rutas protegidas (solo admin) para crear/editar/borrar
router.use(authMiddleware.protect, authMiddleware.restrictTo('admin'));
router.post('/', noticiasController.createNoticia);
router.patch('/:id', noticiasController.updateNoticia);
router.delete('/:id', noticiasController.deleteNoticia);

module.exports = router;
