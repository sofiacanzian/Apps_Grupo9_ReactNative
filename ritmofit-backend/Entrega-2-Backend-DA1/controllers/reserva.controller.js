// controllers/reserva.controller.js
const Reserva = require('../models/reserva.model');
const Clase = require('../models/clase.model');
const User = require('../models/user.model');
const Sede = require('../models/sede.model');
const { sendPushNotification } = require('../utils/push.service');

const RESERVA_INCLUDE = [
    { model: User, attributes: ['id', 'nombre', 'email'] },
    { 
        model: Clase, 
        include: [
            { model: Sede, attributes: ['id', 'nombre', 'direccion'] },
            { model: User, as: 'instructor', attributes: ['id', 'nombre', 'email'] }
        ] 
    },
];

const toDateTime = (fecha, hora) => {
    if (!fecha || !hora) return null;
    return new Date(`${fecha}T${hora}`);
};

const getClaseDateRange = (claseInstance) => {
    if (!claseInstance) return { start: null, end: null };
    const start = toDateTime(claseInstance.fecha, claseInstance.hora_inicio);
    if (!start) return { start: null, end: null };
    const duration = claseInstance.duracion_minutos || 60;
    const end = new Date(start.getTime() + duration * 60000);
    return { start, end };
};

const hydrateReserva = (reservaInstance, now = new Date()) => {
    const data = reservaInstance.toJSON();
    const rango = getClaseDateRange(data.Clase);
    data.fecha_hora_inicio = rango.start;
    data.fecha_hora_fin = rango.end;
    data.esFutura = rango.start ? rango.start >= now : false;
    return data;
};

const expirePastReservations = async (reservas, now = new Date()) => {
    const toExpireIds = reservas
        .filter((reserva) => reserva.estado === 'activa')
        .filter((reserva) => {
            const { start } = getClaseDateRange(reserva.Clase);
            return start && start < now;
        })
        .map((reserva) => reserva.id);

    if (toExpireIds.length) {
        await Reserva.update(
            { estado: 'expirada' },
            { where: { id: toExpireIds } }
        );
        reservas.forEach((reserva) => {
            if (toExpireIds.includes(reserva.id)) {
                reserva.estado = 'expirada';
            }
        });
    }
};

const detectOverlap = (targetRange, reservasUsuario) => {
    return reservasUsuario.some((reserva) => {
        const { start, end } = getClaseDateRange(reserva.Clase);
        if (!start || !end || !targetRange.start || !targetRange.end) return false;
        return start < targetRange.end && targetRange.start < end;
    });
};

const notifyReservaEvent = async ({ expoToken, title, body, data }) => {
    if (!expoToken) return;
    try {
        await sendPushNotification({
            expoPushToken: expoToken,
            title,
            body,
            data,
        });
    } catch (error) {
        // Se loguea pero no se bloquea la request principal
    }
};

/**
 * 1. Reservar una Clase (Solo Socio)
 */
exports.createReserva = async (req, res) => {
    const userId = req.user.id;
    const { claseId } = req.body;

    try {
        const clase = await Clase.findByPk(claseId);
        if (!clase) {
            return res.status(404).json({ message: 'La clase especificada no existe.' });
        }

        const reservasActuales = await Reserva.count({ where: { claseId, estado: 'activa' } });
        if (reservasActuales >= clase.cupo_maximo) {
            return res.status(400).json({ message: 'Lo sentimos, el cupo para esta clase está lleno.' });
        }

        const reservaExistente = await Reserva.findOne({ where: { userId, claseId, estado: 'activa' } });
        if (reservaExistente) {
            return res.status(400).json({ message: 'Ya tienes una reserva activa para esta clase.' });
        }

        const reservasUsuario = await Reserva.findAll({
            where: { userId, estado: 'activa' },
            include: [{ model: Clase, attributes: ['id', 'fecha', 'hora_inicio', 'duracion_minutos'] }],
        });

        const targetRange = getClaseDateRange(clase);
        const haySolapamiento = detectOverlap(targetRange, reservasUsuario);
        if (haySolapamiento) {
            return res.status(400).json({ message: 'Ya tienes una reserva que se superpone en este horario.' });
        }

        const reserva = await Reserva.create({ userId, claseId });
        const nuevaReserva = await Reserva.findByPk(reserva.id, { include: RESERVA_INCLUDE });

        res.status(201).json({ status: 'success', message: 'Reserva creada exitosamente.', data: hydrateReserva(nuevaReserva) });

        notifyReservaEvent({
            expoToken: req.user.expo_push_token,
            title: 'Reserva confirmada',
            body: `${clase.nombre} - ${clase.fecha} ${clase.hora_inicio}`,
            data: { tipo: 'reserva', reservaId: reserva.id, claseId: clase.id },
        });
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
    const { tipo = 'proximas', estado } = req.query;

    const whereCondition = {};
    if (userRole === 'socio') {
        whereCondition.userId = userId;
    } else if (req.query.userId) {
        whereCondition.userId = req.query.userId;
    }
    if (estado) {
        whereCondition.estado = estado;
    }

    try {
        const reservas = await Reserva.findAll({
            where: whereCondition,
            include: RESERVA_INCLUDE,
            order: [['fecha_reserva', 'DESC']],
        });

        const now = new Date();
        await expirePastReservations(reservas, now);

        let data = reservas.map((res) => hydrateReserva(res, now));

        const isHistorial = tipo === 'historial';
        const isTodas = tipo === 'todas';

        if (!isTodas) {
            if (isHistorial) {
                data = data.filter((reserva) => !reserva.esFutura || reserva.estado !== 'activa');
            } else {
                data = data.filter((reserva) => reserva.estado === 'activa' && reserva.esFutura);
            }
        }

        res.status(200).json({ status: 'success', results: data.length, data });
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

        const isOwner = reserva.userId === userId;
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permiso para cancelar esta reserva.' });
        }

        if (reserva.estado !== 'activa') {
            return res.status(400).json({ message: 'La reserva ya fue cancelada o utilizada.' });
        }

        reserva.estado = 'cancelada';
        await reserva.save();

        res.status(200).json({ status: 'success', message: 'Reserva cancelada correctamente.' });

        notifyReservaEvent({
            expoToken: req.user.expo_push_token,
            title: 'Reserva cancelada',
            body: 'Tu reserva fue cancelada correctamente.',
            data: { tipo: 'reserva_cancelada', reservaId },
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
