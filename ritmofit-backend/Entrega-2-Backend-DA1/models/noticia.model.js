const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Noticia = sequelize.define('Noticia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tipo: {
        type: DataTypes.ENUM('noticia', 'promocion', 'evento'),
        defaultValue: 'noticia',
    },
    imagen_url: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    fecha_publicacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    autor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    vigente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    destacada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    enlace: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    ubicacion: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fecha_evento: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    fecha_vencimiento: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    codigo_promocion: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
    },
}, {
    tableName: 'noticias',
});

module.exports = Noticia;
