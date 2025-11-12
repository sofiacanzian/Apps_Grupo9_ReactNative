// models/clase.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');
const Sede = require('./sede.model'); // Importar Sede
const User = require('./user.model'); // Importar User (para el Instructor)

const Clase = sequelize.define('Clase', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    disciplina: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha: { 
        type: DataTypes.DATEONLY, // Usar solo la fecha (AAAA-MM-DD)
        allowNull: false,
    },
    hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    cupo_maximo: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    nivel: {
        type: DataTypes.ENUM('principiante', 'intermedio', 'avanzado'),
        allowNull: false,
        defaultValue: 'principiante',
    },
    imagen_url: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'clases'
});

// Relaciones:
// 1. Una Clase pertenece a una Sede (Clave foránea: sedeId)
Clase.belongsTo(Sede, { foreignKey: 'sedeId', allowNull: false });
Sede.hasMany(Clase, { foreignKey: 'sedeId' });

// 2. Una Clase tiene un Instructor (Clave foránea: instructorId, apunta a la tabla User)
Clase.belongsTo(User, { foreignKey: 'instructorId', allowNull: false, as: 'instructor' }); // User actúa como Instructor
User.hasMany(Clase, { foreignKey: 'instructorId', as: 'clasesImpartidas' });

module.exports = Clase;
