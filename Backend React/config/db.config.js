// config/db.config.js
const { Sequelize } = require('sequelize');

// Usamos las variables definidas en .env
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        // **Clave: Indicamos el dialecto MySQL**
        dialect: 'mysql', 
        logging: false, 
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Esta función conecta y crea/actualiza las tablas en la DB
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión con MySQL establecida correctamente.');

        // Sincroniza todos los modelos (creará las tablas)
        await sequelize.sync({ alter: true }); 
        console.log("Modelos de tablas sincronizados con la base de datos.");

    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error.message);
    }
};

module.exports = { sequelize, connectDB };