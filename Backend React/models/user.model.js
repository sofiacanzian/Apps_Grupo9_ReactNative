// models/user.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    rol: {
        type: DataTypes.ENUM('socio', 'instructor', 'admin'),
        defaultValue: 'socio',
    },
    // Campos para la autenticación OTP
    otp_code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    otp_expiration: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'users' // Nombre de la tabla en MySQL
});

module.exports = User;