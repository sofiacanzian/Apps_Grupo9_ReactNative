// server.js
require('dotenv').config(); // Carga las variables del .env
const express = require('express');

// 1. Importar la DB y los modelos
const { connectDB } = require('./config/db.config');
require('./models/user.model'); // Importa el modelo para que Sequelize lo sincronice

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); 

// Ruta de Prueba
app.get('/', (req, res) => {
    res.send('API RitmoFit Funciona y está conectada a MySQL!');
});

// Iniciar Servidor y Conexión a DB
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    connectDB(); // Intenta conectar a MySQL y crear la tabla 'users'
});