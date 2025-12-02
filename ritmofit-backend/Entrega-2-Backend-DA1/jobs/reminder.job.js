// jobs/reminder.job.js
const cron = require('node-cron');
const { sendUpcomingReminders } = require('../utils/reminder.service');

/**
 * Job que se ejecuta cada 30 minutos para enviar recordatorios
 * de clases que comienzan en 1 hora
 */
const initReminderJob = () => {
    // Ejecutar cada 30 minutos: '*/30 * * * *'
    // Para pruebas puedes usar '* * * * *' (cada minuto)
    cron.schedule('*/30 * * * *', async () => {
        console.log('🕐 [Reminder Job] Ejecutando revisión de recordatorios...');
        try {
            await sendUpcomingReminders();
        } catch (error) {
            console.error('❌ [Reminder Job] Error:', error);
        }
    });

    console.log('✅ Reminder job iniciado - se ejecutará cada 30 minutos');
};

module.exports = { initReminderJob };
