// models/objetivo.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');
const User = require('./user.model');

const Objetivo = sequelize.define('Objetivo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    cantidad_clases: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
    },
    disciplina: {
        type: DataTypes.ENUM('Box', 'Pilates', 'Spinning', 'CrossFit', 'Zumba', 'Yoga'),
        allowNull: false,
    },
    duracion_periodo: {
        type: DataTypes.ENUM('semana', 'mes', '6 meses', '12 meses'),
        allowNull: false,
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    completado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'objetivos'
});

// Relaciones
// Solo definimos belongsTo para crear la clave foránea sin índices adicionales
Objetivo.belongsTo(User, { 
    foreignKey: 'userId', 
    allowNull: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

module.exports = Objetivo;

