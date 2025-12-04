// scripts/testCancellation.js
// Cancela la reserva vinculada a "Clase prueba recordatorios" y dispara la notificación push

const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');
const { sendCancellationNotification } = require('../utils/reminder.service');
const Reserva = require('../models/reserva.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');

const REMINDER_CLASS_NAME = 'Clase prueba recordatorios';
const formatTime = (time) => (time ? time.slice(0, 5) : '--:--');

const reservationIncludes = [
    { model: User, attributes: ['id', 'email', 'expo_push_token'] },
    {
        model: Clase,
        include: [
            { model: Sede },
            { model: User, as: 'instructor', attributes: ['id', 'nombre', 'email'] }
        ]
    }
];

async function testCancellation() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos\n');

        const usuarioConToken = await User.findOne({
            where: { expo_push_token: { [Op.ne]: null } },
            order: [['id', 'ASC']]
        });

        if (!usuarioConToken) {
            console.log('❌ No hay usuarios con expo_push_token configurado.');
            console.log('💡 Actualiza un registro en la tabla users antes de continuar.');
            process.exit(1);
        }

        const today = new Date().toISOString().split('T')[0];
        const reminderClass = await Clase.findOne({
            where: {
                nombre: REMINDER_CLASS_NAME,
                fecha: { [Op.gte]: today }
            },
            include: [
                { model: Sede },
                { model: User, as: 'instructor', attributes: ['id', 'nombre', 'email'] }
            ],
            order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
        });

        if (!reminderClass) {
            console.log(`❌ No se encontró "${REMINDER_CLASS_NAME}". Ejecuta npm run seed:reminder-class primero.`);
            process.exit(1);
        }

        let reserva = await Reserva.findOne({
            where: {
                claseId: reminderClass.id,
                userId: usuarioConToken.id
            },
            include: reservationIncludes
        });

        if (!reserva) {
            reserva = await Reserva.create({
                userId: usuarioConToken.id,
                claseId: reminderClass.id,
                estado: 'activa'
            });
            await reserva.reload({ include: reservationIncludes });
            console.log('🆕 Se creó una reserva activa específica para la prueba.');
        } else if (reserva.estado !== 'activa') {
            reserva.estado = 'activa';
            await reserva.save();
            await reserva.reload({ include: reservationIncludes });
            console.log('🔁 La reserva existente se reactivó para poder cancelarla.');
        } else {
            console.log('✅ Ya había una reserva activa lista para cancelar.');
        }

        console.log('\n📋 Reserva objetivo:');
        console.log(`   - Reserva ID: ${reserva.id}`);
        console.log(`   - Usuario: ${reserva.User.email}`);
        console.log(`   - Clase: ${reserva.Clase.nombre} el ${reserva.Clase.fecha} ${formatTime(reserva.Clase.hora_inicio)}`);

        console.log('\n🛑 Marcando la reserva como cancelada y enviando notificación...');
        await reserva.update({ estado: 'cancelada' });

        await sendCancellationNotification({
            user: reserva.User,
            clase: reserva.Clase,
            motivo: 'cancelada para pruebas manuales'
        });

        console.log('📬 Notificación de cancelación enviada.');

        await reserva.update({ estado: 'activa' });
        console.log('♻️ La reserva volvió a estado ACTIVA para que puedas repetir la prueba.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testCancellation();
