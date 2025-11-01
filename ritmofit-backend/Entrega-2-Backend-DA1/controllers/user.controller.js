// controllers/user.controller.js
const User = require('../models/user.model');

// Endpoint para que el usuario autenticado vea su perfil (GET /api/users/me)
exports.getMe = (req, res) => {
    // 🚨 AÑADIR LOS NUEVOS CAMPOS A LA RESPUESTA GET 🚨
    const { id, nombre, email, foto_url, rol, telefono, direccion, fechaNacimiento } = req.user;
    res.status(200).json({ status: 'success', user: { id, nombre, email, foto_url, rol, telefono, direccion, fechaNacimiento } });
};

// Endpoint para que el usuario autenticado edite su perfil (PUT /api/users/me)
exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        // 🚨 AÑADIR LOS NUEVOS CAMPOS AQUÍ 🚨
        const { nombre, foto_url, telefono, direccion, fechaNacimiento } = req.body;

        // 1. Crear un objeto con solo los campos permitidos y proporcionados
        const updateData = {};
        
        if (nombre) updateData.nombre = nombre;
        // La foto_url puede ser una cadena vacía ('') si el usuario la quiere quitar
        if (foto_url !== undefined) updateData.foto_url = foto_url; 
        
        // 🚨 Lógica para los nuevos campos 🚨
        if (telefono !== undefined) updateData.telefono = telefono;
        if (direccion !== undefined) updateData.direccion = direccion;
        if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
        
        // Si no hay datos para actualizar, rechazar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'No se proporcionaron datos válidos para actualizar.' });
        }

        // 2. Actualizar el usuario
        const [updated] = await User.update(updateData, {
            where: { id: userId },
            // returning: true - MySQL no soporta returning en update, por eso se hace un findByPk después
        });

        if (updated) {
            // 3. Devolver los datos actualizados, incluyendo los nuevos campos
            const updatedUser = await User.findByPk(userId, { 
                attributes: ['id', 'nombre', 'email', 'foto_url', 'rol', 'telefono', 'direccion', 'fechaNacimiento'] 
            });
            return res.status(200).json({ status: 'success', user: updatedUser });
        } else {
            // Si no se actualizó (ej. usuario no encontrado o no hubo cambios)
            return res.status(200).json({ status: 'success', message: 'Perfil actualizado o sin cambios.' }); 
        }
    } catch (error) {
        // Error de base de datos o validación
        res.status(400).json({ status: 'error', message: error.message });
    }
};