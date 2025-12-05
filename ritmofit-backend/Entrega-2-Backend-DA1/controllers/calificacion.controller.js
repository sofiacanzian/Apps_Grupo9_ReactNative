const { Op } = require('sequelize');
const Calificacion = require('../models/calificacion.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Asistencia = require('../models/asistencia.model');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnlyString = (date) => date.toISOString().split('T')[0];

const buildCheckinTimestamp = (asistencia) => {
  if (!asistencia) return null;

  if (asistencia.checkin_hora) {
    return new Date(`${asistencia.fecha_asistencia}T${asistencia.checkin_hora}`);
  }

  if (asistencia.Clase && asistencia.Clase.fecha && asistencia.Clase.hora_inicio) {
    return new Date(`${asistencia.Clase.fecha}T${asistencia.Clase.hora_inicio}`);
  }

  if (asistencia.fecha_asistencia) {
    return new Date(`${asistencia.fecha_asistencia}T00:00:00`);
  }

  return asistencia.createdAt ? new Date(asistencia.createdAt) : null;
};

exports.createCalificacion = async (req, res) => {
  const {
    userId,
    claseId,
    rating,
    ratingClase,
    ratingInstructor,
    comentario
  } = req.body;

  const finalClassRating = typeof ratingClase === 'number' ? ratingClase : rating;
  if (!userId || !claseId || typeof finalClassRating !== 'number') {
    return res.status(400).json({ message: 'userId, claseId y rating de la clase son obligatorios.' });
  }

  if (finalClassRating < 1 || finalClassRating > 5) {
    return res.status(400).json({ message: 'La calificación de la clase debe estar entre 1 y 5.' });
  }

  if (ratingInstructor != null && (ratingInstructor < 1 || ratingInstructor > 5)) {
    return res.status(400).json({ message: 'La calificación del profesor debe estar entre 1 y 5.' });
  }

  try {
    const now = new Date();
    const asistencia = await Asistencia.findOne({
      where: { userId, claseId },
      include: [{ model: Clase }]
    });

    if (!asistencia) {
      return res.status(403).json({
        message: 'Solo podés calificar clases asistidas en las últimas 24 horas.'
      });
    }

    const existingCalificacion = await Calificacion.findOne({ where: { userId, claseId } });
    if (existingCalificacion) {
      return res.status(409).json({ message: 'Ya registraste una calificación para esta clase.' });
    }

    const checkinTimestamp = buildCheckinTimestamp(asistencia);
    if (!checkinTimestamp || now.getTime() - checkinTimestamp.getTime() > ONE_DAY_MS) {
      return res.status(403).json({
        message: 'La ventana de 24 horas para calificar esta clase ya expiró.'
      });
    }

    const calificacion = await Calificacion.create({
      userId,
      claseId,
      rating: finalClassRating,
      ratingInstructor: ratingInstructor ?? null,
      comentario
    });
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

exports.getPendingCalificaciones = async (req, res) => {
  const { userId } = req.params;

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - ONE_DAY_MS);
    const dateThreshold = toDateOnlyString(twentyFourHoursAgo);

    const asistencias = await Asistencia.findAll({
      where: {
        userId,
        fecha_asistencia: { [Op.gte]: dateThreshold }
      },
      include: [{ model: Clase }],
      order: [['fecha_asistencia', 'DESC']]
    });

    if (!asistencias.length) {
      return res.status(200).json([]);
    }

    const claseIds = Array.from(new Set(asistencias.map((a) => a.claseId)));

    const calificaciones = claseIds.length
      ? await Calificacion.findAll({
          where: {
            userId,
            claseId: { [Op.in]: claseIds }
          },
          attributes: ['claseId']
        })
      : [];

    const ratedClases = new Set(calificaciones.map((c) => c.claseId));

    const pendientes = asistencias
      .filter((asistencia) => {
        if (ratedClases.has(asistencia.claseId)) {
          return false;
        }
        const checkinTimestamp = buildCheckinTimestamp(asistencia);
        if (!checkinTimestamp) {
          return false;
        }
        return now.getTime() - checkinTimestamp.getTime() <= ONE_DAY_MS;
      })
      .map((asistencia) => {
        const checkinTimestamp = buildCheckinTimestamp(asistencia);
        const expiresAt = new Date(checkinTimestamp.getTime() + ONE_DAY_MS);

        return {
          asistenciaId: asistencia.id,
          claseId: asistencia.claseId,
          clase: asistencia.Clase,
          fechaAsistencia: asistencia.fecha_asistencia,
          checkinHora: asistencia.checkin_hora,
          expiresAt: expiresAt.toISOString()
        };
      });

    res.status(200).json(pendientes);
  } catch (error) {
    console.error('Error en getPendingCalificaciones:', error);
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

    const promedioClase = calificaciones.length > 0
      ? calificaciones.reduce((acc, c) => acc + c.rating, 0) / calificaciones.length
      : 0;

    const valoracionesProfesor = calificaciones.filter((c) => typeof c.ratingInstructor === 'number');
    const promedioInstructor = valoracionesProfesor.length > 0
      ? valoracionesProfesor.reduce((acc, c) => acc + c.ratingInstructor, 0) / valoracionesProfesor.length
      : 0;

    res.status(200).json({ promedio: promedioClase, promedioInstructor, calificaciones });
  } catch (error) {
    console.error('Error en getClaseCalificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};