// models/sede.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Sede = sequelize.define('Sede', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'sedes'
});

module.exports = Sede;