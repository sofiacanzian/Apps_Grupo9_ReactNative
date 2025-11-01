// controllers/sede.controller.js
const Sede = require('../models/sede.model');

/**
 * Crear una nueva Sede (Solo Admin)
 */
exports.createSede = async (req, res) => {
    try {
        const sede = await Sede.create(req.body);
        res.status(201).json({ status: 'success', data: sede });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * Obtener todas las Sedes (Acceso Público)
 */
exports.getAllSedes = async (req, res) => {
    try {
        const sedes = await Sede.findAll();
        res.status(200).json({ status: 'success', results: sedes.length, data: sedes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtener una Sede por ID (Acceso Público)
 */
exports.getSede = async (req, res) => {
    try {
        const sede = await Sede.findByPk(req.params.id);
        if (!sede) {
            return res.status(404).json({ status: 'fail', message: 'Sede no encontrada.' });
        }
        res.status(200).json({ status: 'success', data: sede });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualizar una Sede (Solo Admin)
 */
exports.updateSede = async (req, res) => {
    try {
        const [updated] = await Sede.update(req.body, {
            where: { id: req.params.id }
        });

        if (updated) {
            const updatedSede = await Sede.findByPk(req.params.id);
            return res.status(200).json({ status: 'success', data: updatedSede });
        }
        res.status(404).json({ status: 'fail', message: 'Sede no encontrada para actualizar.' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * Eliminar una Sede (Solo Admin)
 */
exports.deleteSede = async (req, res) => {
    try {
        const deleted = await Sede.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            return res.status(204).send(); // 204 No Content
        }
        res.status(404).json({ status: 'fail', message: 'Sede no encontrada para eliminar.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};