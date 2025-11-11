// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model'); // Modelo User

/**
 * Middleware para proteger rutas: verifica la validez del JWT.
 */
exports.protect = async (req, res, next) => {
    let token;

    // 1. Obtener el token del header (Authorization: Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No hay token proporcionado.' });
    }

    try {
        // 2. Verificar el token (firma y expiración)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 🚨 CORRECCIÓN CLAVE: Usar parseInt() para asegurar que la DB (MySQL INTEGER) lo encuentre 🚨
        const userId = parseInt(decoded.id, 10); 
        
        // 3. Buscar el usuario en la DB por el ID (Primary Key)
        // La búsqueda ahora funciona porque el tipo de dato es correcto (INTEGER)
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(401).json({ message: 'El token pertenece a un usuario que ya no existe.' });
        }

        if (!user.activo) {
            return res.status(401).json({ message: 'La cuenta ha sido eliminada o desactivada.' });
        }

        req.user = user; // Adjuntar el objeto de usuario al request
        next(); // Continuar
        
    } catch (error) {
        // Captura si el token está expirado o si la firma es inválida
        console.error("Error de autenticación JWT:", error.message);
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

/**
 * Middleware para restringir acceso por rol (solo 'admin' o 'instructor').
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user ya está adjunto por el middleware 'protect'
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                message: 'No tienes permiso para realizar esta acción.'
            });
        }
        next();
    };
};
