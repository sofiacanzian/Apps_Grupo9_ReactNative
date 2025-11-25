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
        // NOTA: Usar { alter: true } aplica cambios sin borrar datos. 
        // Si tienes problemas, bórralo y usa await sequelize.sync();
        await sequelize.sync({ alter: true }); 
    console.log("✅ Modelos de tablas sincronizados con la base de datos.");
        
    } catch (error) {
        console.error('❌ Error al conectar/sincronizar la base de datos:', error.message);
        // Si el servidor falla al arrancar por la DB, salir del proceso
        process.exit(1); 
    }
};

module.exports = { sequelize, connectDB };