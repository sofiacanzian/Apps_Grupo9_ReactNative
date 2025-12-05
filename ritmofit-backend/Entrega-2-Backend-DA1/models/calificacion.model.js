const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');
const User = require('./user.model');
const Clase = require('./clase.model');

const Calificacion = sequelize.define('Calificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  ratingInstructor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'calificaciones',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'claseId'],
      name: 'calificacion_user_clase_unique'
    }
  ]
});

// Relaciones
Calificacion.belongsTo(User, { foreignKey: 'userId', allowNull: false });
User.hasMany(Calificacion, { foreignKey: 'userId' });

Calificacion.belongsTo(Clase, { foreignKey: 'claseId', allowNull: false });
Clase.hasMany(Calificacion, { foreignKey: 'claseId' });

module.exports = Calificacion;