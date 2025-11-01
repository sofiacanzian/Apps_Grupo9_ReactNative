// controllers/clase.controller.js
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');
const User = require('../models/user.model'); 
const Reserva = require('../models/reserva.model'); // <-- Importación necesaria para el conteo de cupos
const { Op } = require('sequelize');

// Función para validar que el ID sea de un usuario con rol 'instructor'
const validateInstructor = async (instructorId) => {
    const instructor = await User.findByPk(instructorId);
    if (!instructor || instructor.rol !== 'instructor') {
        throw new Error('El instructorId proporcionado es inválido o el usuario no es un instructor.');
    }
    return instructor;
};

/**
 * 1. Crear una nueva Clase (Solo Admin/Instructor)
 */
exports.createClase = async (req, res) => {
    try {
        const { instructorId, sedeId, ...claseData } = req.body;

        await Sede.findByPk(sedeId);
        await validateInstructor(instructorId);
        
        const clase = await Clase.create({ instructorId, sedeId, ...claseData });

        res.status(201).json({ status: 'success', data: clase });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * 2. Obtener todas las Clases (Catálogo y Cálculo de Cupos Disponibles)
 */
exports.getAllClases = async (req, res) => {
    try {
        const clases = await Clase.findAll({
            include: [
                { model: Sede, attributes: ['nombre', 'direccion'] },
                { model: User, as: 'User', attributes: ['nombre', 'email'], where: { rol: 'instructor' } }
            ],
            where: req.query.fecha ? { fecha: req.query.fecha } : {}
        });

        // 🚨 LÓGICA DE CÁLCULO DE CUPOS DISPONIBLES 🚨
        const clasesConCupo = await Promise.all(clases.map(async (clase) => {
            // Contar cuántas reservas activas hay para esta clase
            const reservasActuales = await Reserva.count({ where: { claseId: clase.id } });
            
            // Convertir el objeto Sequelize a un objeto JSON mutable
            const claseData = clase.toJSON();
            
            // Calcular y añadir el nuevo campo al objeto que se envía al frontend
            claseData.cupo_disponible = claseData.cupo_maximo - reservasActuales;
            
            return claseData;
        }));

        res.status(200).json({ 
            status: 'success', 
            results: clasesConCupo.length, 
            data: clasesConCupo // Devolvemos la lista con el campo cupo_disponible
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * 3. Actualizar una Clase (Solo Admin/Instructor)
 */
exports.updateClase = async (req, res) => {
    try {
        const { instructorId } = req.body;
        if (instructorId) {
            await validateInstructor(instructorId);
        }

        const [updated] = await Clase.update(req.body, {
            where: { id: req.params.id }
        });

        if (updated) {
            const updatedClase = await Clase.findByPk(req.params.id);
            return res.status(200).json({ status: 'success', data: updatedClase });
        }
        res.status(404).json({ status: 'fail', message: 'Clase no encontrada para actualizar.' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * 4. Eliminar una Clase (Solo Admin)
 */
exports.deleteClase = async (req, res) => {
    try {
        const deleted = await Clase.destroy({ where: { id: req.params.id } });
        if (deleted) {
            return res.status(204).send();
        }
        res.status(404).json({ status: 'fail', message: 'Clase no encontrada para eliminar.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};