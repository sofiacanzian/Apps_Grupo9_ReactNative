// controllers/asistencia.controller.js
const Asistencia = require('../models/asistencia.model');
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');
const User = require('../models/user.model');
const Reserva = require('../models/reserva.model');
const { Op } = require('sequelize');

/**
 * Endpoint para obtener el historial de asistencias (Punto 8).
 * Filtra por userId (el usuario logueado) y por rango de fechas.
 */
exports.getHistorial = async (req, res) => {
    const userId = req.user.id; // Obtenido del token JWT
    const { fechaInicio, fechaFin } = req.query;

    let whereCondition = { userId };
    
    // 1. Lógica de filtro por rango de fechas
    if (fechaInicio || fechaFin) {
        whereCondition.fecha_asistencia = {};
        if (fechaInicio) {
            // >= fechaInicio
            whereCondition.fecha_asistencia[Op.gte] = new Date(fechaInicio); 
        }
        if (fechaFin) {
            // <= fechaFin
            whereCondition.fecha_asistencia[Op.lte] = new Date(fechaFin); 
        }
    }

    try {
        const historial = await Asistencia.findAll({
            where: whereCondition,
            attributes: ['id', 'fecha_asistencia', 'duracion_minutos', 'checkin_hora', 'confirmado_por_qr'],
            include: [
                { 
                    model: Clase, 
                    attributes: ['id', 'nombre', 'disciplina', 'fecha', 'hora_inicio', 'duracion_minutos'],
                    include: [
                        { model: Sede, attributes: ['id', 'nombre', 'direccion'] },
                        { model: User, as: 'instructor', attributes: ['id', 'nombre'] }
                    ]
                }
            ],
            order: [['fecha_asistencia', 'DESC']]
        });

        res.status(200).json({ status: 'success', data: historial });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Endpoint de Check-in (Simulación de escaneo QR)
 * NOTA: Para un MVP, se salta la creación de QR y solo se registra la asistencia.
 */
exports.checkIn = async (req, res) => {
    const userId = req.user.id;
    const { claseId } = req.body; 

    try {
        const clase = await Clase.findByPk(claseId, { include: [{ model: Sede, attributes: ['nombre'] }] });
        if (!clase) {
            return res.status(404).json({ message: "Clase no encontrada." });
        }

        const reservaActiva = await Reserva.findOne({ where: { userId, claseId, estado: 'activa' } });
        if (!reservaActiva) {
            return res.status(400).json({ message: 'Debes tener una reserva activa para registrar asistencia.' });
        }

        const asistenciaExistente = await Asistencia.findOne({ where: { userId, claseId } });
        if (asistenciaExistente) {
            return res.status(400).json({ message: 'La asistencia ya fue registrada para esta clase.' });
        }
        
        const fechaHoy = new Date();
        const asistencia = await Asistencia.create({
            userId,
            claseId,
            fecha_asistencia: fechaHoy.toISOString().split('T')[0],
            checkin_hora: fechaHoy.toTimeString().split(' ')[0],
            duracion_minutos: clase.duracion_minutos,
            confirmado_por_qr: true,
        });

        reservaActiva.estado = 'asistida';
        await reservaActiva.save();

        res.status(201).json({ status: 'success', message: 'Check-in exitoso.', data: asistencia });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
