// scripts/testReminders.js
// Prepara todo para que el job de recordatorios use la clase "Clase prueba recordatorios"

const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Reserva = require('../models/reserva.model');
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

async function setupReminderTest() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos\n');

        const usersWithToken = await User.findAll({
            where: { expo_push_token: { [Op.ne]: null } },
            attributes: ['id', 'email', 'nombre', 'expo_push_token'],
            order: [['id', 'ASC']]
        });

        if (usersWithToken.length === 0) {
            console.log('❌ No hay usuarios con expo_push_token configurado.');
            console.log('💡 Asigna uno manualmente, por ejemplo:');
            console.log("   UPDATE users SET expo_push_token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' WHERE email = 'tu@email.com';");
            process.exit(1);
        }

        console.log('📱 Usuarios con push token disponibles:');
        usersWithToken.forEach((u) => {
            console.log(`   - ${u.email} (ID: ${u.id})`);
        });

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
            console.log(`\n❌ No se encontró "${REMINDER_CLASS_NAME}" en la agenda.`);
            console.log('💡 Ejecuta: npm run seed:reminder-class');
            process.exit(1);
        }

        console.log(`\n⏰ Clase objetivo: ${reminderClass.nombre} - ${reminderClass.fecha} ${formatTime(reminderClass.hora_inicio)} (${reminderClass.Sede?.nombre})`);

        const preferredUser = usersWithToken[0];
        let reserva = await Reserva.findOne({
            where: { claseId: reminderClass.id, userId: preferredUser.id },
            include: reservationIncludes
        });

        if (!reserva) {
            reserva = await Reserva.create({
                userId: preferredUser.id,
                claseId: reminderClass.id,
                estado: 'activa'
            });
            await reserva.reload({ include: reservationIncludes });
            console.log('🆕 Se creó una reserva activa para esta clase.');
        } else if (reserva.estado !== 'activa') {
            reserva.estado = 'activa';
            await reserva.save();
            await reserva.reload({ include: reservationIncludes });
            console.log('🔁 La reserva existente se reactivó para la prueba.');
        } else {
            console.log('✅ Ya existía una reserva activa lista para usar.');
        }

        const startDate = new Date(`${reminderClass.fecha}T${reminderClass.hora_inicio}`);
        const minutesUntilStart = Math.round((startDate - new Date()) / 60000);

        console.log('\n📋 Estado listo para el job de recordatorios:');
        console.log(`   - Reserva ID: ${reserva.id}`);
        console.log(`   - Usuario inscrito: ${reserva.User.email}`);
        console.log(`   - Push token: ${reserva.User.expo_push_token}`);
        console.log(`   - Clase: ${reserva.Clase.nombre} (${reminderClass.Sede?.nombre})`);
        console.log(`   - Inicio en: ${minutesUntilStart} minutos`);

        console.log('\n🚀 Siguientes pasos:');
        console.log('1. Corre npm run dev (o el proceso que ejecuta el cron jobs/reminder.job.js).');
        console.log('2. Observa los logs hasta ver "🕐 [Reminder Job]"; el push saldrá ~60 minutos antes del inicio.');
        console.log('3. Repite npm run seed:reminder-class para reagendar la clase cuando lo necesites.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

setupReminderTest();
