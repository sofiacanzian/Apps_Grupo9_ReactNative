// config/db.config.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión con MySQL establecida correctamente.');

        // --- 1. CARGAR TODOS LOS MODELOS (SIN DUPLICIDADES) ---
        // Se cargan los modelos para que Sequelize sepa que existen
        require('../models/user.model');
        require('../models/sede.model');
        require('../models/clase.model');
        require('../models/reserva.model');
        require('../models/asistencia.model');
        require('../models/noticia.model');
<<<<<<< HEAD
        
        // --- 2. SINCRONIZAR LA BASE DE DATOS (OPCIONAL) ---
        // Solo sincronizar si está explícitamente habilitado para evitar deadlocks
        if (process.env.SYNC_DB === 'true') {
            try {
                await sequelize.sync({ alter: true });
                console.log("✅ Modelos de tablas sincronizados con la base de datos (alter).");
            } catch (syncErr) {
                console.error('⚠️ Error al sincronizar con { alter: true }: ', syncErr.message);
                if (syncErr.message && syncErr.message.includes('Too many keys specified')) {
                    if (process.env.NODE_ENV === 'development' || process.env.FORCE_SYNC === 'true') {
                        console.warn('⚠️ Intentando sincronizar con { force: true } (RECREAR TABLAS).');
                        await sequelize.sync({ force: true });
                        console.log('✅ Sincronización forzada realizada. Las tablas fueron recreadas.');
                    }
                }
            }
        } else {
            console.log("ℹ️  Sincronización de BD deshabilitada. Las tablas deben existir previamente.");
        }
        
    } catch (error) {
        console.error('❌ Error al conectar/sincronizar la base de datos:', error.message);
        // No salir del proceso, solo loguear el error
        // Las tablas ya existen, solo falló el sync
=======

        // --- 2. SINCRONIZAR LA BASE DE DATOS (UNA SOLA VEZ) ---
        // Usamos sync sin alter ni force para evitar errores de "too many keys"
        // Las tablas ya deberían existir de los scripts de seed
        await sequelize.sync({ force: false, alter: false });
        console.log("✅ Modelos de tablas sincronizados con la base de datos.");

    } catch (error) {
        console.error('❌ Error al conectar/sincronizar la base de datos:', error.message);
        // Si el servidor falla al arrancar por la DB, salir del proceso
        process.exit(1);
>>>>>>> origin/main
    }
};

module.exports = { sequelize, connectDB };