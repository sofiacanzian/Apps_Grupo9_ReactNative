// scripts/testCancellation.js
// Script para probar la notificación de cancelación

const { sequelize } = require('../config/db.config');
const { sendCancellationNotification } = require('../utils/reminder.service');
const Reserva = require('../models/reserva.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');

async function testCancellation() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos\n');

        // Buscar una reserva activa con usuario que tenga push token
        const reserva = await Reserva.findOne({
            where: { estado: 'activa' },
            include: [
                {
                    model: User,
                    where: { expo_push_token: { [require('sequelize').Op.ne]: null } }
                },
                {
                    model: Clase,
                    include: [{ model: Sede }]
                }
            ]
        });

        if (!reserva) {
            console.log('❌ No se encontró ninguna reserva activa con usuario que tenga push token');
            console.log('💡 Asegúrate de restaurar la reserva: UPDATE reservas SET estado = "activa" WHERE id = 1;');
            process.exit(1);
        }

        console.log(`📋 Reserva encontrada:`);
        console.log(`   - ID: ${reserva.id}`);
        console.log(`   - Usuario: ${reserva.User.email}`);
        console.log(`   - Clase: ${reserva.Clase.nombre}`);
        console.log(`   - Estado actual: ${reserva.estado}\n`);

        // Simular cancelación
        reserva.estado = 'cancelada';
        await reserva.save();
        console.log('✅ Reserva marcada como cancelada\n');

        // Enviar notificación de cancelación
        console.log('📤 Enviando notificación de cancelación...\n');
        await sendCancellationNotification({
            user: reserva.User,
            clase: reserva.Clase,
            motivo: 'cancelada por el usuario'
        });

        console.log('\n✨ ¡Test completado exitosamente!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testCancellation();
