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
const historialRoutes = require('./routes/historial.routes');
const calificacionRoutes = require('./routes/calificacion.routes');
const objetivoRoutes = require('./routes/objetivo.routes');


const app = express();
const PORT = process.env.PORT || 3000;

// =================================================================
// 1. Middlewares de Express
// =================================================================

// 2. CONFIGURACIÓN CORS: HABILITA EL ACCESO DESDE EL FRONTEND (web y mobile)
const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:8081',
    'http://10.0.2.2:8081',
    'exp://127.0.0.1:8081',
    'exp://10.0.2.2:8081'
];

const configuredOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : defaultOrigins;

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || configuredOrigins.includes(origin) || configuredOrigins.includes('*')) {
            return callback(null, true);
        }
        console.warn(`CORS bloqueó el origen: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
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
app.use('/api/historial', historialRoutes);

// Rutas para calificaciones
app.use('/api/calificaciones', calificacionRoutes);

// Rutas para objetivos
app.use('/api/objetivos', objetivoRoutes);

// =================================================================
// 3. Inicio del Servidor
// =================================================================

// Conectar a la DB e Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    connectDB();
});
