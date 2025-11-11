// controllers/user.controller.js
const crypto = require('crypto');
const { sequelize } = require('../config/db.config');
const User = require('../models/user.model');
const Reserva = require('../models/reserva.model');
const Asistencia = require('../models/asistencia.model');
const { sendOTP } = require('../utils/email.service');

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Endpoint para que el usuario autenticado vea su perfil (GET /api/users/me)
exports.getMe = (req, res) => {
    const { id, nombre, email, foto_url, rol, telefono, direccion, fechaNacimiento, username, email_verificado } = req.user;
    res.status(200).json({
        status: 'success',
        user: { id, nombre, email, username, email_verificado, foto_url, rol, telefono, direccion, fechaNacimiento }
    });
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
                attributes: ['id', 'nombre', 'email', 'username', 'email_verificado', 'foto_url', 'rol', 'telefono', 'direccion', 'fechaNacimiento'] 
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

exports.requestAccountDeletionOtp = async (req, res) => {
    try {
        const user = req.user;
        const otpCode = generateOTP();
        const otpExpiration = new Date(Date.now() + 15 * 60 * 1000);

        user.otp_code = otpCode;
        user.otp_expiration = otpExpiration;
        user.otp_context = 'account_delete';
        await user.save();

        const emailSent = await sendOTP(user.email, otpCode);
        if (!emailSent) {
            return res.status(500).json({ message: 'No pudimos enviar el código. Intenta nuevamente más tarde.' });
        }

        return res.status(200).json({ message: 'Te enviamos un código de verificación para eliminar tu cuenta.' });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Error interno del servidor.' });
    }
};

exports.confirmAccountDeletion = async (req, res) => {
    const { otp_code } = req.body;

    if (!otp_code) {
        return res.status(400).json({ message: 'Debes ingresar el código enviado por email.' });
    }

    try {
        const user = req.user;

        if (user.otp_context !== 'account_delete') {
            return res.status(400).json({ message: 'El código no corresponde a una solicitud de eliminación.' });
        }

        const dbCode = String(user.otp_code || '').trim();
        if (dbCode !== String(otp_code).trim()) {
            return res.status(401).json({ message: 'Código OTP inválido.' });
        }

        if (user.otp_expiration && new Date() > user.otp_expiration) {
            return res.status(401).json({ message: 'El código OTP expiró. Solicita uno nuevo.' });
        }

        await sequelize.transaction(async (transaction) => {
            await Asistencia.destroy({ where: { userId: user.id }, transaction });
            await Reserva.destroy({ where: { userId: user.id }, transaction });
            await user.destroy({ transaction });
        });

        return res.status(200).json({ message: 'Cuenta eliminada correctamente.' });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Error interno del servidor.' });
    }
};
