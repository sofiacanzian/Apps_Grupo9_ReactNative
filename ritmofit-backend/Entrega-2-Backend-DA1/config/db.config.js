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
        
        // --- 2. SINCRONIZAR LA BASE DE DATOS (UNA SOLA VEZ) ---
        // Intentamos aplicar cambios sin borrar datos. En algunos entornos
        // antiguos (o con muchas migraciones manuales) MySQL puede fallar
        // con 'Too many keys specified'. Para desarrollo intentaremos
        // una sincronización forzada si el alter falla.
        try {
            await sequelize.sync({ alter: true });
            console.log("✅ Modelos de tablas sincronizados con la base de datos (alter).");
        } catch (syncErr) {
            console.error('⚠️ Error al sincronizar con { alter: true }: ', syncErr.message);
            if (syncErr.message && syncErr.message.includes('Too many keys specified')) {
                // Sólo permitir recrear tablas automáticamente en entornos de desarrollo.
                if (process.env.NODE_ENV === 'development' || process.env.FORCE_SYNC === 'true') {
                    console.warn('⚠️ Demasiadas keys detectadas. Intentando sincronizar con { force: true } (RECREAR TABLAS) porque está permitido en este entorno.');
                    try {
                        await sequelize.sync({ force: true });
                        console.log('✅ Sincronización forzada realizada. Las tablas fueron recreadas.');
                    } catch (forceErr) {
                        console.error('❌ Error durante sequelize.sync({ force: true }):', forceErr.message);
                        throw forceErr;
                    }
                } else {
                    console.error('❌ Demasiadas keys para aplicar { alter: true } y sincronización forzada está deshabilitada fuera de desarrollo.');
                    throw syncErr;
                }
            } else {
                // Re-lanzar el error para que el flujo superior lo maneje
                throw syncErr;
            }
        }
        
    } catch (error) {
        console.error('❌ Error al conectar/sincronizar la base de datos:', error.message);
        // Si el servidor falla al arrancar por la DB, salir del proceso
        process.exit(1); 
    }
};

module.exports = { sequelize, connectDB };