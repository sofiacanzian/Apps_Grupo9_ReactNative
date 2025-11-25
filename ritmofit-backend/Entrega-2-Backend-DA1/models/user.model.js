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
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
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
    password_hash: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pin_hash: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email_verificado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    otp_code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    otp_expiration: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    otp_context: {
        type: DataTypes.ENUM('login', 'register', 'password_reset', 'account_delete'),
        allowNull: true,
    },
    foto_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    expo_push_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    push_token_updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    fecha_baja: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'users'
});

module.exports = User;
