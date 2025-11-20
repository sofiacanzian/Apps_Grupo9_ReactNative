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
        // Las relaciones se definen en cada modelo individual
        require('../models/user.model');
        require('../models/sede.model');      
        require('../models/clase.model');     
        require('../models/reserva.model');   
        require('../models/asistencia.model');
        require('../models/objetivo.model');
        require('../models/calificacion.model'); 
        
        // --- 2. SINCRONIZAR LA BASE DE DATOS (UNA SOLA VEZ) ---
        // Intentar sincronizar con alter primero
        try {
            await sequelize.sync({ alter: true });
            console.log("✅ Modelos de tablas sincronizados con la base de datos.");
        } catch (syncError) {
            // Si hay error de "too many keys", sincronizar solo tablas nuevas sin alterar existentes
            if (syncError.message.includes('too many keys') || syncError.message.includes('max 64 keys')) {
                console.warn('⚠️  Advertencia: Error de índices detectado. Sincronizando solo tablas nuevas...');
                try {
                    // Sincronizar solo el modelo Objetivo que es nuevo
                    const Objetivo = require('../models/objetivo.model');
                    await Objetivo.sync({ alter: false });
                    console.log("✅ Tabla objetivos creada/verificada.");
                    console.log("⚠️  Nota: Algunas tablas existentes no se alteraron debido a límites de índices.");
                } catch (syncError2) {
                    console.warn('⚠️  No se pudo crear la tabla objetivos. Puede que ya exista.');
                    console.warn('   Error:', syncError2.message);
                }
            } else {
                throw syncError;
            }
        }
        
    } catch (error) {
        console.error('❌ Error al conectar/sincronizar la base de datos:', error.message);
        // Si el servidor falla al arrancar por la DB, salir del proceso
        process.exit(1); 
    }
};

module.exports = { sequelize, connectDB };