// controllers/reserva.controller.js
const Reserva = require('../models/reserva.model');
const Clase = require('../models/clase.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');
const Sede = require('../models/sede.model'); // <--- 🚨 ESTO ES CRUCIAL (Sede faltante)

/**
 * 1. Reservar una Clase (Solo Socio)
 */
exports.createReserva = async (req, res) => {
    const userId = req.user.id; // Obtenido del token JWT (middleware.protect)
    const { claseId } = req.body;

    try {
        // 1. Verificar si la Clase existe y obtener el cupo máximo
        const clase = await Clase.findByPk(claseId);
        if (!clase) {
            return res.status(404).json({ message: 'La clase especificada no existe.' });
        }

        // 2. Verificar el cupo disponible
        const reservasActuales = await Reserva.count({ where: { claseId } });
        if (reservasActuales >= clase.cupo_maximo) {
            return res.status(400).json({ message: 'Lo sentimos, el cupo para esta clase está lleno.' });
        }

        // 3. Verificar si el usuario ya tiene una reserva para esta clase
        const reservaExistente = await Reserva.findOne({ where: { userId, claseId } });
if (reservaExistente) {
    return res.status(400).json({ message: 'Ya tienes una reserva activa para esta clase.' }); // 🚨 ESTE ES EL ERROR QUE ESTÁS RECIBIENDO 🚨
}

        // 4. Crear la Reserva
        const reserva = await Reserva.create({ userId, claseId });

        res.status(201).json({ status: 'success', message: 'Reserva creada exitosamente.', data: reserva });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * 2. Obtener todas las Reservas de UN USUARIO (Socio) o TODAS (Admin/Instructor)
 */
exports.getAllReservas = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.rol;

    let whereCondition = {};
    if (userRole === 'socio') {
        // Un socio solo puede ver sus propias reservas
        whereCondition = { userId }; 
    }
    // Admin/Instructor no tienen whereCondition, ven todas las reservas

    try {
        const reservas = await Reserva.findAll({
            where: whereCondition,
            include: [
                { model: User, attributes: ['nombre', 'email'] },
                { model: Clase, include: [{ model: Sede, attributes: ['nombre'] }] }
                
            ]
        });

        res.status(200).json({ status: 'success', results: reservas.length, data: reservas });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * 3. Cancelar una Reserva (Solo el Socio dueño o el Admin)
 */
exports.deleteReserva = async (req, res) => {
    const reservaId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.rol;

    try {
        const reserva = await Reserva.findByPk(reservaId);

        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }

        // Restricción: Solo el dueño de la reserva o el admin pueden cancelarla.
        const isOwner = reserva.userId === userId;
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permiso para cancelar esta reserva.' });
        }

        await reserva.destroy();

        res.status(204).send(); // 204 No Content
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};