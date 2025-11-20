// models/reserva.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');
const User = require('./user.model'); 
const Clase = require('./clase.model'); 

const Reserva = sequelize.define('Reserva', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    estado: {
        type: DataTypes.ENUM('activa', 'cancelada', 'asistida', 'ausente', 'expirada'),
        allowNull: false,
        defaultValue: 'activa',
    },
    fecha_reserva: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Fecha y hora de cuando se hizo la reserva
    },
}, {
    tableName: 'reservas'
});

// Relaciones:
// 1. Una Reserva pertenece a un Usuario (Socio)
Reserva.belongsTo(User, { foreignKey: 'userId', allowNull: false });

// 2. Una Reserva pertenece a una Clase
Reserva.belongsTo(Clase, { foreignKey: 'claseId', allowNull: false });

module.exports = Reserva;
