// models/asistencia.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');
const User = require('./user.model'); 
const Clase = require('./clase.model'); 

const Asistencia = sequelize.define('Asistencia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    fecha_asistencia: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    duracion_minutos: { // Redundante pero útil para reportes
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    checkin_hora: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    confirmado_por_qr: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
}, {
    tableName: 'asistencias'
});

// Relaciones:
Asistencia.belongsTo(User, { foreignKey: 'userId', allowNull: false });
Asistencia.belongsTo(Clase, { foreignKey: 'claseId', allowNull: false });

module.exports = Asistencia;
