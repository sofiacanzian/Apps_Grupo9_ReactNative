const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/db.config');
const Sede = require('../models/sede.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Reserva = require('../models/reserva.model');

(async () => {
    try {
        const sedes = await Sede.findAll({ attributes: ['id', 'nombre'], order: [['id', 'ASC']] });
        const instructores = await User.findAll({ attributes: ['id', 'nombre', 'email'], where: { rol: 'instructor' }, order: [['id', 'ASC']] });
        const latestClases = await Clase.findAll({ attributes: ['id', 'nombre', 'fecha', 'hora_inicio'], order: [['id', 'DESC']], limit: 5 });
        const reservasLlacheta = await Reserva.findAll({
            attributes: ['id', 'estado', 'fecha_reserva', 'claseId'],
            where: { userId: 43 },
            order: [['id', 'DESC']],
            limit: 5
        });

        console.log('Sedes disponibles:');
        console.table(sedes.map((s) => s.toJSON()));

        console.log('\nInstructores disponibles:');
        console.table(instructores.map((u) => u.toJSON()));

        console.log('\nUltimas clases:');
        console.table(latestClases.map((c) => c.toJSON()));

        console.log('\nReservas usuario 43:');
        console.table(reservasLlacheta.map((r) => r.toJSON()));

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error al obtener datos:', error);
        process.exit(1);
    }
})();
