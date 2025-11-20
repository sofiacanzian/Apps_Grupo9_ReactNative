require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../config/db.config');

const fixObjetivosTable = async () => {
    try {
        console.log('🔧 Verificando y corrigiendo tabla objetivos...');
        
        await sequelize.authenticate();
        console.log('✅ Conexión establecida');

        // Verificar si la tabla existe
        const [results] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'objetivos'
        `);

        if (results[0].count > 0) {
            console.log('🗑️  Eliminando tabla objetivos existente...');
            await sequelize.query('DROP TABLE IF EXISTS objetivos');
            console.log('✅ Tabla eliminada');
        }

        // Cargar el modelo para recrear la tabla
        require('../models/objetivo.model');
        
        // Sincronizar solo el modelo Objetivo
        const Objetivo = require('../models/objetivo.model');
        await Objetivo.sync({ force: false });
        
        console.log('✅ Tabla objetivos creada correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fixObjetivosTable();

