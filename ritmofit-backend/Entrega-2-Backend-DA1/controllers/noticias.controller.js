const Noticia = require('../models/noticia.model');

/**
 * Crear noticia (Admin)
 */
exports.createNoticia = async (req, res) => {
    try {
        const noticia = await Noticia.create(req.body);
        res.status(201).json({ status: 'success', data: noticia });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * Obtener listado de noticias con filtros y paginación (Público)
 */
exports.getNoticias = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            tipo,
            destacadas,
            vigente,
            sort = '-fecha_publicacion',
        } = req.query;

        const where = {};
        if (tipo) where.tipo = tipo;
        if (destacadas === 'true' || destacadas === true) where.destacada = true;
        if (vigente === 'true' || vigente === true) where.vigente = true;

        const order = [];
        if (sort) {
            // soporta prefijo '-' para descendente
            const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
            const field = sort.replace(/^[-+]/, '');
            order.push([field, direction]);
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const noticias = await Noticia.findAll({
            where,
            order,
            limit: parseInt(limit, 10),
            offset,
        });

        res.status(200).json({ status: 'success', results: noticias.length, data: noticias });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtener detalle de una noticia por ID (Público)
 */
exports.getNoticiaById = async (req, res) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) return res.status(404).json({ status: 'fail', message: 'Noticia no encontrada.' });
        res.status(200).json({ status: 'success', data: noticia });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualizar noticia (Admin)
 */
exports.updateNoticia = async (req, res) => {
    try {
        const [updated] = await Noticia.update(req.body, { where: { id: req.params.id } });
        if (updated) {
            const updatedNoticia = await Noticia.findByPk(req.params.id);
            return res.status(200).json({ status: 'success', data: updatedNoticia });
        }
        res.status(404).json({ status: 'fail', message: 'Noticia no encontrada para actualizar.' });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

/**
 * Eliminar noticia (Admin)
 */
exports.deleteNoticia = async (req, res) => {
    try {
        const deleted = await Noticia.destroy({ where: { id: req.params.id } });
        if (deleted) return res.status(204).send();
        res.status(404).json({ status: 'fail', message: 'Noticia no encontrada para eliminar.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Marcar noticia como leída (opcional). Si se desea tracking real, añadir modelo de lecturas.
 */
exports.marcarLeida = async (req, res) => {
    try {
        // Por ahora solo respondemos éxito. Aquí se puede implementar tracking en BD.
        return res.status(200).json({ status: 'success', message: 'Noticia marcada como leída' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
