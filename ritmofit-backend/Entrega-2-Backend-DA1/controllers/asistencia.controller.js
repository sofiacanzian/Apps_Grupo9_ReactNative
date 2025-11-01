// controllers/asistencia.controller.js
const Asistencia = require('../models/asistencia.model');
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');
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
            attributes: ['fecha_asistencia', 'duracion_minutos', 'checkin_hora'],
            include: [
                { 
                    model: Clase, 
                    attributes: ['nombre'], 
                    include: [{ model: Sede, attributes: ['nombre'] }] 
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
    const { claseId, userId } = req.body; 
    // En un sistema real, userId vendría del token y claseId vendría del QR escaneado.

    try {
        const clase = await Clase.findByPk(claseId);
        if (!clase) {
            return res.status(404).json({ message: "Clase no encontrada." });
        }
        
        // Simplemente crea el registro de asistencia
        const asistencia = await Asistencia.create({
            userId,
            claseId,
            fecha_asistencia: new Date().toISOString().split('T')[0], // Solo fecha
            checkin_hora: new Date().toTimeString().split(' ')[0],
            duracion_minutos: clase.duracion_minutos
        });

        res.status(201).json({ status: 'success', message: 'Check-in exitoso.', data: asistencia });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};