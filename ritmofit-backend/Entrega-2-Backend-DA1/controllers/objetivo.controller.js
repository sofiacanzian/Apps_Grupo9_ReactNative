// controllers/objetivo.controller.js
const Objetivo = require('../models/objetivo.model');
const Asistencia = require('../models/asistencia.model');
const Clase = require('../models/clase.model');
const { Op } = require('sequelize');

// Calcular fecha de fin según duración del período
const calcularFechaFin = (fechaInicio, duracionPeriodo) => {
    const fecha = new Date(fechaInicio);
    switch (duracionPeriodo) {
        case 'semana':
            fecha.setDate(fecha.getDate() + 7);
            break;
        case 'mes':
            fecha.setMonth(fecha.getMonth() + 1);
            break;
        case '6 meses':
            fecha.setMonth(fecha.getMonth() + 6);
            break;
        case '12 meses':
            fecha.setFullYear(fecha.getFullYear() + 1);
            break;
        default:
            fecha.setMonth(fecha.getMonth() + 1);
    }
    return fecha;
};

// Obtener inicio de período apropiado según duracion
const obtenerInicioPeriodo = (fechaReferencia, duracionPeriodo) => {
    const fecha = new Date(fechaReferencia);
    switch (duracionPeriodo) {
        case 'semana': {
            // empezar el lunes de la semana actual
            const dia = fecha.getDay(); // 0 Domingo .. 6 Sab
            const diffToMonday = (dia === 0) ? -6 : (1 - dia);
            const inicio = new Date(fecha);
            inicio.setDate(fecha.getDate() + diffToMonday);
            inicio.setHours(0,0,0,0);
            return inicio;
        }
        case 'mes': {
            const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
            inicio.setHours(0,0,0,0);
            return inicio;
        }
        case '6 meses': {
            const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
            inicio.setMonth(inicio.getMonth() - 5);
            inicio.setHours(0,0,0,0);
            return inicio;
        }
        case '12 meses': {
            const inicio = new Date(fecha.getFullYear(), 0, 1);
            inicio.setHours(0,0,0,0);
            return inicio;
        }
        default: {
            const inicio = new Date(fecha);
            inicio.setHours(0,0,0,0);
            return inicio;
        }
    }
};

// Crear un nuevo objetivo
exports.createObjetivo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cantidad_clases, disciplina, duracion_periodo } = req.body;

        if (!cantidad_clases || !disciplina || !duracion_periodo) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'cantidad_clases, disciplina y duracion_periodo son obligatorios.' 
            });
        }

        if (!['Box', 'Pilates', 'Spinning', 'CrossFit', 'Zumba', 'Yoga'].includes(disciplina)) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Disciplina inválida.' 
            });
        }

        if (!['semana', 'mes', '6 meses', '12 meses'].includes(duracion_periodo)) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Duración de período inválida.' 
            });
        }

        // Ajustar inicio del período para que incluya las clases pasadas dentro del mismo periodo
        const fechaInicio = obtenerInicioPeriodo(new Date(), duracion_periodo);
        const fechaFin = calcularFechaFin(fechaInicio, duracion_periodo);

        const objetivo = await Objetivo.create({
            userId,
            cantidad_clases,
            disciplina,
            duracion_periodo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
        });

        res.status(201).json({ status: 'success', data: objetivo });
    } catch (error) {
        console.error('Error en createObjetivo:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Obtener todos los objetivos del usuario
exports.getUserObjetivos = async (req, res) => {
    try {
        const userId = req.user.id;
        const objetivos = await Objetivo.findAll({
            where: { userId, activo: true },
            order: [['fecha_inicio', 'DESC']],
        });

        // Calcular progreso para cada objetivo
        const objetivosConProgreso = await Promise.all(
            objetivos.map(async (objetivo) => {
                const progreso = await calcularProgreso(objetivo);
                return {
                    ...objetivo.toJSON(),
                    progreso,
                };
            })
        );

        res.status(200).json({ status: 'success', data: objetivosConProgreso });
    } catch (error) {
        console.error('Error en getUserObjetivos:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Calcular progreso de un objetivo
const calcularProgreso = async (objetivo) => {
    try {
        // Obtener todas las asistencias del usuario en el rango de fechas (usar DATEONLY strings)
        const fechaInicioOnly = new Date(objetivo.fecha_inicio).toISOString().split('T')[0];
        const fechaFinOnly = new Date(objetivo.fecha_fin).toISOString().split('T')[0];

        const asistencias = await Asistencia.findAll({
            where: {
                userId: objetivo.userId,
                fecha_asistencia: {
                    [Op.gte]: fechaInicioOnly,
                    [Op.lte]: fechaFinOnly,
                },
            },
            include: [{
                model: Clase,
                attributes: ['id', 'disciplina'],
            }],
        });

        // Filtrar por disciplina (case-insensitive) y usar comparación de fechas DATEONLY
        const objetivoDisc = (objetivo.disciplina || '').toString().toLowerCase();

        const clasesAsistidas = asistencias.filter((asistencia) => {
            const claseDisc = (asistencia.Clase?.disciplina || '').toString().toLowerCase();
            return claseDisc === objetivoDisc;
        }).length;

        const porcentaje = objetivo.cantidad_clases > 0 
            ? Math.min(100, Math.round((clasesAsistidas / objetivo.cantidad_clases) * 100))
            : 0;
        const completado = clasesAsistidas >= objetivo.cantidad_clases;

        // Actualizar estado de completado si cambió
        if (objetivo.completado !== completado) {
            await objetivo.update({ completado });
        }

        return {
            clasesAsistidas,
            clasesObjetivo: objetivo.cantidad_clases,
            porcentaje,
            completado,
        };
    } catch (error) {
        console.error('Error calculando progreso:', error);
        return {
            clasesAsistidas: 0,
            clasesObjetivo: objetivo.cantidad_clases,
            porcentaje: 0,
            completado: false,
        };
    }
};

// Obtener progreso de un objetivo específico
exports.getObjetivoProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const objetivo = await Objetivo.findOne({
            where: { id, userId },
        });

        if (!objetivo) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Objetivo no encontrado.' 
            });
        }

        const progreso = await calcularProgreso(objetivo);

        res.status(200).json({ status: 'success', data: progreso });
    } catch (error) {
        console.error('Error en getObjetivoProgress:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Actualizar un objetivo
exports.updateObjetivo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { cantidad_clases, disciplina, duracion_periodo } = req.body;

        const objetivo = await Objetivo.findOne({
            where: { id, userId },
        });

        if (!objetivo) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Objetivo no encontrado.' 
            });
        }

        const updateData = {};
        if (cantidad_clases !== undefined) updateData.cantidad_clases = cantidad_clases;
        if (disciplina !== undefined) {
            if (!['Box', 'Pilates', 'Spinning', 'CrossFit', 'Zumba', 'Yoga'].includes(disciplina)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Disciplina inválida.' 
                });
            }
            updateData.disciplina = disciplina;
        }
        if (duracion_periodo !== undefined) {
            if (!['semana', 'mes', '6 meses', '12 meses'].includes(duracion_periodo)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Duración de período inválida.' 
                });
            }
            updateData.duracion_periodo = duracion_periodo;
            // Recalcular fecha_fin si cambió la duración
            updateData.fecha_fin = calcularFechaFin(objetivo.fecha_inicio, duracion_periodo);
        }

        await objetivo.update(updateData);
        await objetivo.reload();

        const progreso = await calcularProgreso(objetivo);

        res.status(200).json({ 
            status: 'success', 
            data: {
                ...objetivo.toJSON(),
                progreso,
            }
        });
    } catch (error) {
        console.error('Error en updateObjetivo:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Eliminar (desactivar) un objetivo
exports.deleteObjetivo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const objetivo = await Objetivo.findOne({
            where: { id, userId },
        });

        if (!objetivo) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Objetivo no encontrado.' 
            });
        }

        // Marcar como inactivo en lugar de eliminar
        await objetivo.update({ activo: false });

        res.status(200).json({ 
            status: 'success', 
            message: 'Objetivo eliminado correctamente.' 
        });
    } catch (error) {
        console.error('Error en deleteObjetivo:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

