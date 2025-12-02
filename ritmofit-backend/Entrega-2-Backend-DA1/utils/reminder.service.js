// utils/reminder.service.js
const { sendPushNotification } = require('./push.service');
const Reserva = require('../models/reserva.model');
const Clase = require('../models/clase.model');
const User = require('../models/user.model');
const Sede = require('../models/sede.model');
const { Op } = require('sequelize');

/**
 * Envía recordatorios a usuarios con reservas activas que comienzan en 1 hora
 */
const sendUpcomingReminders = async () => {
    try {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const twoHoursFromNow = new Date(now.getTime() + 120 * 60 * 1000);

        // Buscar todas las reservas activas
        const reservas = await Reserva.findAll({
            where: {
                estado: 'activa',
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'nombre', 'email', 'expo_push_token'],
                    where: {
                        expo_push_token: { [Op.ne]: null },
                    },
                },
                {
                    model: Clase,
                    attributes: ['id', 'nombre', 'fecha', 'hora_inicio', 'duracion_minutos'],
                    include: [
                        {
                            model: Sede,
                            attributes: ['nombre', 'direccion'],
                        },
                    ],
                },
            ],
        });

        let remindersSent = 0;

        for (const reserva of reservas) {
            const clase = reserva.Clase;
            const user = reserva.User;

            if (!clase || !user || !user.expo_push_token) continue;

            // Construir fecha/hora de la clase
            const claseDateTime = new Date(`${clase.fecha}T${clase.hora_inicio}`);

            // Verificar si la clase comienza entre 1 y 2 horas desde ahora
            // (esto evita enviar múltiples recordatorios si el job corre frecuentemente)
            if (claseDateTime >= oneHourFromNow && claseDateTime < twoHoursFromNow) {
                const sede = clase.Sede?.nombre || 'la sede';
                const direccion = clase.Sede?.direccion || '';

                try {
                    await sendPushNotification({
                        expoPushToken: user.expo_push_token,
                        title: '🔔 Recordatorio de clase',
                        body: `Tu clase "${clase.nombre}" comienza en 1 hora en ${sede}. ${direccion}`,
                        data: {
                            tipo: 'recordatorio',
                            reservaId: reserva.id,
                            claseId: clase.id,
                            fecha: clase.fecha,
                            hora: clase.hora_inicio,
                        },
                    });
                    remindersSent++;
                    console.log(`✅ Recordatorio enviado a ${user.email} para clase ${clase.nombre}`);
                } catch (error) {
                    console.error(`❌ Error enviando recordatorio a ${user.email}:`, error.message);
                }
            }
        }

        console.log(`📢 Recordatorios enviados: ${remindersSent}`);
        return { success: true, remindersSent };
    } catch (error) {
        console.error('❌ Error en sendUpcomingReminders:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Envía notificación cuando se cancela una reserva
 */
const sendCancellationNotification = async ({ user, clase, motivo = 'cancelada' }) => {
    if (!user?.expo_push_token || !clase) return;

    try {
        await sendPushNotification({
            expoPushToken: user.expo_push_token,
            title: '❌ Reserva cancelada',
            body: `Tu reserva para "${clase.nombre}" el ${clase.fecha} a las ${clase.hora_inicio} ha sido ${motivo}.`,
            data: {
                tipo: 'cancelacion',
                claseId: clase.id,
                fecha: clase.fecha,
                hora: clase.hora_inicio,
            },
        });
        console.log(`✅ Notificación de cancelación enviada a ${user.email}`);
    } catch (error) {
        console.error(`❌ Error enviando notificación de cancelación a ${user.email}:`, error.message);
    }
};

/**
 * Envía notificación cuando se reprograma una clase
 */
const sendRescheduleNotification = async ({ user, claseAntigua, claseNueva }) => {
    if (!user?.expo_push_token || !claseAntigua || !claseNueva) return;

    try {
        await sendPushNotification({
            expoPushToken: user.expo_push_token,
            title: '📅 Clase reprogramada',
            body: `La clase "${claseAntigua.nombre}" del ${claseAntigua.fecha} se movió al ${claseNueva.fecha} a las ${claseNueva.hora_inicio}.`,
            data: {
                tipo: 'reprogramacion',
                claseId: claseNueva.id,
                fechaAntigua: claseAntigua.fecha,
                fechaNueva: claseNueva.fecha,
                horaNueva: claseNueva.hora_inicio,
            },
        });
        console.log(`✅ Notificación de reprogramación enviada a ${user.email}`);
    } catch (error) {
        console.error(`❌ Error enviando notificación de reprogramación a ${user.email}:`, error.message);
    }
};

module.exports = {
    sendUpcomingReminders,
    sendCancellationNotification,
    sendRescheduleNotification,
};
