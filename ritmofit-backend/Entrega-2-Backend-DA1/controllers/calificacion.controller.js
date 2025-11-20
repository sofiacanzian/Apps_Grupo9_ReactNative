const Calificacion = require('../models/calificacion.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');

exports.createCalificacion = async (req, res) => {
  const { userId, claseId, rating, comentario } = req.body;

  if (!userId || !claseId || !rating) {
    return res.status(400).json({ message: 'userId, claseId y rating son obligatorios.' });
  }

  try {
    const calificacion = await Calificacion.create({ userId, claseId, rating, comentario });
    res.status(201).json({ message: 'Calificación registrada.', calificacion });
  } catch (error) {
    console.error('Error en createCalificacion:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getUserCalificaciones = async (req, res) => {
  const { userId } = req.params;

  try {
    const calificaciones = await Calificacion.findAll({
      where: { userId },
      include: [{ model: Clase }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    res.status(200).json(calificaciones);
  } catch (error) {
    console.error('Error en getUserCalificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.getClaseCalificaciones = async (req, res) => {
  const { claseId } = req.params;

  try {
    const calificaciones = await Calificacion.findAll({
      where: { claseId },
      include: [{ model: User }],
    });

    const promedio = calificaciones.length > 0
      ? calificaciones.reduce((acc, c) => acc + c.rating, 0) / calificaciones.length
      : 0;

    res.status(200).json({ promedio, calificaciones });
  } catch (error) {
    console.error('Error en getClaseCalificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};