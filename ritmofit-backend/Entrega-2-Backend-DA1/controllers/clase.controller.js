// controllers/clase.controller.js
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');
const User = require('../models/user.model'); 
const Reserva = require('../models/reserva.model'); // Para cálculo de cupos y validaciones
const { Op } = require('sequelize');

// Función para validar que el ID sea de un usuario con rol 'instructor'
const validateInstructor = async (instructorId) => {
    const instructor = await User.findByPk(instructorId);
    if (!instructor || instructor.rol !== 'instructor') {
        throw new Error('El instructorId proporcionado es inválido o el usuario no es un instructor.');
    }
    return instructor;
};

const clasesInclude = [
    { 
        model: Sede, 
        attributes: ['id', 'nombre', 'direccion', 'latitud', 'longitud', 'telefono', 'disciplinas_ofrecidas'] 
    },
    { 
        model: User, 
        as: 'instructor', 
        attributes: ['id', 'nombre', 'email', 'foto_url', 'telefono'] 
    }
];

const buildFilters = (query = {}) => {
    const { fecha, disciplina, nivel, q } = query;
    const sedeId = query.sedeId || query.sede_id;
    const filters = {};

    if (fecha) filters.fecha = fecha;
    if (sedeId) filters.sedeId = sedeId;
    if (nivel) filters.nivel = nivel;
    if (disciplina) {
        filters.disciplina = { [Op.like]: `%${disciplina}%` };
    }

    if (q) {
        filters[Op.or] = [
            { nombre: { [Op.like]: `%${q}%` } },
            { disciplina: { [Op.like]: `%${q}%` } },
        ];
    }

    return filters;
};

const addUpcomingFilter = (filters, includePast = false) => {
    if (includePast && includePast !== 'false') {
        return filters;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const upcomingCondition = {
        [Op.or]: [
            { fecha: { [Op.gt]: today } },
            {
                [Op.and]: [
                    { fecha: today },
                    { hora_inicio: { [Op.gte]: time } }
                ]
            }
        ]
    };

    if (!filters[Op.and]) {
        filters[Op.and] = [];
    }

    filters[Op.and].push(upcomingCondition);
    return filters;
};

const toDateTime = (fecha, hora) => {
    if (!fecha || !hora) return null;
    return new Date(`${fecha}T${hora}`);
};

const appendDisponibilidad = async (claseInstance) => {
    const reservasActivas = await Reserva.count({ where: { claseId: claseInstance.id, estado: 'activa' } });
    const data = claseInstance.toJSON();
    data.reservas_activas = reservasActivas;
    data.cupo_disponible = Math.max(data.cupo_maximo - reservasActivas, 0);
    data.fecha_hora_inicio = toDateTime(data.fecha, data.hora_inicio);
    return data;
};

/**
 * 1. Crear una nueva Clase (Solo Admin/Instructor)
 */
exports.createClase = async (req, res) => {
    try {
        const { instructorId, sedeId, ...claseData } = req.body;

        const sede = await Sede.findByPk(sedeId);
        if (!sede) {
            return res.status(404).json({ status: 'fail', message: 'La sede especificada no existe.' });
        }
        await validateInstructor(instructorId);
        
        const clase = await Clase.create({ instructorId, sedeId, ...claseData });
        const claseWithRelations = await Clase.findByPk(clase.id, { include: clasesInclude });
        const data = await appendDisponibilidad(claseWithRelations);
        res.status(201).json({ status: 'success', data });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * 2. Obtener todas las Clases (Catálogo y Cálculo de Cupos Disponibles)
 */
exports.getAllClases = async (req, res) => {
    try {
        const where = addUpcomingFilter(buildFilters(req.query), req.query.includePast);

        const clases = await Clase.findAll({
            include: clasesInclude,
            where,
            order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
        });

        const clasesConCupo = await Promise.all(clases.map(async (clase) => {
            return appendDisponibilidad(clase);
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
 * 2.b Obtener detalle de una Clase
 */
exports.getClaseById = async (req, res) => {
    try {
        const clase = await Clase.findByPk(req.params.id, { include: clasesInclude });
        if (!clase) {
            return res.status(404).json({ status: 'fail', message: 'Clase no encontrada.' });
        }
        const data = await appendDisponibilidad(clase);
        res.status(200).json({ status: 'success', data });
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
            const updatedClase = await Clase.findByPk(req.params.id, { include: clasesInclude });
            const data = await appendDisponibilidad(updatedClase);
            return res.status(200).json({ status: 'success', data });
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
