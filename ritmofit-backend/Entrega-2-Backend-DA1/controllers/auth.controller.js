// controllers/auth.controller.js
const User = require('../models/user.model');
const { sendOTP } = require('../utils/email.service');
const { generateToken } = require('../utils/jwt.service');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Función para generar un código OTP simple de 6 dígitos
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Endpoint para solicitar el código OTP (Paso 1).
 */
exports.requestOtp = async (req, res) => {
    const { email, nombre } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'El campo email es obligatorio.' });
    }

    try {
        let [user] = await User.findOrCreate({
            where: { email },
            defaults: { nombre: nombre || 'Socio RitmoFit' }
        });
        
        const otpCode = generateOTP();
        const otpExpiration = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de ventana

        // 1. Guardar el OTP de forma robusta en la base de datos
        const [updatedRows] = await User.update(
            {
                otp_code: otpCode,
                otp_expiration: otpExpiration
            },
            {
                where: { id: user.id }
            }
        );

        if (updatedRows === 0) {
            throw new Error("No se pudo actualizar el OTP en la base de datos.");
        }

        // 2. Enviar el OTP por correo
        const emailSent = await sendOTP(email, otpCode);

        if (!emailSent) {
            return res.status(500).json({ message: 'Error al enviar el código de verificación por email.' });
        }

        res.status(200).json({ 
            message: 'Código de verificación enviado al correo electrónico.',
        });

    } catch (error) {
        console.error("Error en requestOtp:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Endpoint para validar el código OTP e iniciar sesión (Paso 2).
 */
exports.loginWithOtp = async (req, res) => {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
        return res.status(400).json({ message: 'Email y código OTP son obligatorios.' });
    }

    try {
        // 1. Buscar el usuario SOLO por email
        const user = await User.findOne({ where: { email } });

        if (!user) {
             return res.status(401).json({ message: 'Email no registrado.' });
        }

        // 2. 🚨 VERIFICACIÓN FORZADA (Arregla la falla de string vs objeto de Sequelize) 🚨
        const dbCode = String(user.otp_code).trim();
        const incomingCode = String(req.body.otp_code).trim();

        console.log('--- DEBUG FINAL ---');
        console.log('DB Code (Limpiado):', dbCode);
        console.log('Input Code (Limpiado):', incomingCode);
        console.log('-------------------');

        if (dbCode !== incomingCode) {
             return res.status(401).json({ message: 'Código OTP inválido.' });
        }
        
        // 3. Verificar Expiración (OPCIONAL: Descomentar para producción)
        /* if (new Date() > user.otp_expiration) {
            user.otp_code = null;
            user.otp_expiration = null;
            await user.save();
            return res.status(401).json({ message: 'Código OTP expirado. Solicita uno nuevo.' });
        }
        */

        // 4. Generar JWT y limpiar el OTP
        const token = generateToken(user.id);
        
        // Limpiar el código en la base de datos tras el uso
        user.otp_code = null; 
        user.otp_expiration = null;
        await user.save();

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                rol: user.rol,
            }
        });

    } catch (error) {
        console.error("Error en loginWithOtp:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};