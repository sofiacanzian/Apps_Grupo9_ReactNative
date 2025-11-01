// server.js
require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/db.config');
const cors = require('cors'); // <-- 1. IMPORTAR CORS

// --- Importación de Rutas ---
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes'); 
const sedeRoutes = require('./routes/sede.routes'); 
const claseRoutes = require('./routes/clase.routes'); 
const reservaRoutes = require('./routes/reserva.routes'); 
const asistenciaRoutes = require('./routes/asistencia.routes'); // <-- AGREGAR


const app = express();
const PORT = process.env.PORT || 3000;

// =================================================================
// 1. Middlewares de Express
// =================================================================

// 2. CONFIGURACIÓN CORS: HABILITA EL ACCESO DESDE EL FRONTEND DE VITE
const corsOptions = {
    // Origen permitido: La URL exacta donde corre Vite
    origin: 'http://localhost:5173', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Importante si usas sesiones o tokens en cookies
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); // <-- 3. USAR EL MIDDLEWARE CORS
app.use(express.json()); 

// Permite que Express maneje datos JSON en el cuerpo de las peticiones
// app.use(express.json()); // (Ya lo tienes)

// =================================================================
// 2. Rutas
// =================================================================

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API RitmoFit Funcionando. Accede a /api/auth/request-otp para iniciar el flujo de autenticación.');
});

// Rutas de Autenticación (Registro, Login con OTP)
app.use('/api/auth', authRoutes);

// Rutas de Usuarios (Ejemplo: Obtener perfil)
app.use('/api/users', userRoutes); 

// Rutas CRUD para Sedes
app.use('/api/sedes', sedeRoutes); 

// Rutas CRUD para Clases
app.use('/api/clases', claseRoutes); 

// Rutas CRUD para Reservas
app.use('/api/reservas', reservaRoutes); 
app.use('/api/asistencias', asistenciaRoutes); // <-- CONECTAR


// =================================================================
// 3. Inicio del Servidor
// =================================================================

// Conectar a la DB e Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    connectDB();
});