// controllers/auth.controller.js
const User = require('../models/user.model');
const { sendOTP } = require('../utils/email.service');
const { generateToken } = require('../utils/jwt.service');
const { Op } = require('sequelize');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Login con PIN (envía identifier + pin)
 */
exports.loginWithPin = async (req, res) => {
    const { identifier, pin } = req.body;

    if (!identifier || !pin) {
        return res.status(400).json({ message: 'Credenciales incompletas.' });
    }

    try {
        const user = await findUserByIdentifier(identifier);
        if (!user || !user.pin_hash) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        if (!user.email_verificado) {
            return res.status(403).json({ message: 'Debes verificar tu email antes de iniciar sesión.' });
        }

        const pinValid = await bcrypt.compare(String(pin), user.pin_hash);
        if (!pinValid) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const token = generateToken(user.id);
        return res.status(200).json({
            message: 'Inicio de sesión con PIN exitoso.',
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Error en loginWithPin:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Comprueba si un usuario identificado por email/username tiene PIN seteado
 */
exports.checkPinExists = async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Falta identifier.' });
    try {
        const user = await findUserByIdentifier(identifier);
        if (!user) return res.status(200).json({ hasPin: false });
        return res.status(200).json({ hasPin: !!user.pin_hash });
    } catch (err) {
        console.error('Error en checkPinExists:', err);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Función para generar un código OTP simple de 6 dígitos
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const sanitizeUser = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        direccion: user.direccion,
        fechaNacimiento: user.fechaNacimiento,
        foto_url: user.foto_url,
        username: user.username,
        email_verificado: user.email_verificado,
    };
};

const findUserByIdentifier = (identifier) => {
    return User.findOne({
        where: {
            [Op.or]: [
                { email: identifier },
                { username: identifier }
            ]
            
        }
        
    });
    
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
                otp_expiration: otpExpiration,
                otp_context: 'login'
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
 * Login tradicional con usuario / email + contraseña
 */
exports.loginWithPassword = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Credenciales incompletas.' });
    }

    try {
        const user = await findUserByIdentifier(identifier);
        if (!user || !user.password_hash) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        if (!user.email_verificado) {
            return res.status(403).json({ message: 'Debes verificar tu email antes de iniciar sesión.' });
        }

        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const token = generateToken(user.id);
        return res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Error en loginWithPassword:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Registro de nuevos usuarios (datos básicos + password) y envío de OTP
 */
exports.register = async (req, res) => {
    const { nombre, email, telefono, password, confirmPassword, username } = req.body;

    if (!nombre || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    try {
        if (username) {
            const usernameTaken = await User.findOne({ where: { username } });
            if (usernameTaken) {
                return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
            }
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.email_verificado) {
            return res.status(400).json({ message: 'El email ya está registrado.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        // Si viene PIN en el registro, hashearlo y guardarlo también
        let pinHash = null;
        if (req.body.pin) {
            try {
                pinHash = await bcrypt.hash(String(req.body.pin), 10);
            } catch (err) {
                console.warn('No se pudo hashear el PIN en register:', err);
            }
        }
        const otpCode = generateOTP();
        const otpExpiration = new Date(Date.now() + 15 * 60 * 1000);

        let user;
        if (existingUser) {
            await existingUser.update({
                nombre,
                telefono,
                username: username || existingUser.username,
                password_hash: passwordHash,
                email_verificado: false,
                otp_code: otpCode,
                otp_expiration: otpExpiration,
                otp_context: 'register',
            });
            user = existingUser;
        } else {
            user = await User.create({
                nombre,
                email,
                telefono,
                username,
                password_hash: passwordHash,
                pin_hash: pinHash,
                rol: 'socio',
                email_verificado: false,
                otp_code: otpCode,
                otp_expiration: otpExpiration,
                otp_context: 'register',
            });
        }

        await sendOTP(email, otpCode);

        return res.status(201).json({
            message: 'Registro creado. Verifica tu email con el código enviado.',
            email: user.email,
        });
    } catch (error) {
        console.error('Error en register:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Confirmar OTP de registro para activar la cuenta
 */
exports.verifyRegistrationOtp = async (req, res) => {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
        return res.status(400).json({ message: 'Email y código son obligatorios.' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (user.otp_context !== 'register') {
            return res.status(400).json({ message: 'El código proporcionado no corresponde a un registro pendiente.' });
        }

        const dbCode = String(user.otp_code || '').trim();
        if (dbCode !== String(otp_code).trim()) {
            return res.status(401).json({ message: 'Código OTP inválido.' });
        }

        if (user.otp_expiration && new Date() > user.otp_expiration) {
            return res.status(401).json({ message: 'El código OTP expiró. Solicita uno nuevo.' });
        }

        user.email_verificado = true;
        user.otp_code = null;
        user.otp_expiration = null;
        user.otp_context = null;
        await user.save();

        const token = generateToken(user.id);

        return res.status(200).json({
            message: 'Cuenta verificada correctamente.',
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Error en verifyRegistrationOtp:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Setear/actualizar PIN para el usuario autenticado
 */
exports.setPin = async (req, res) => {
    const { pin } = req.body;
    if (!pin || String(pin).trim().length < 4) {
        return res.status(400).json({ message: 'PIN inválido. Debe tener al menos 4 dígitos.' });
    }

    try {
        const user = req.user; // middleware 'protect' attachs user
        if (!user) return res.status(401).json({ message: 'No autenticado.' });

        const pinHash = await bcrypt.hash(String(pin), 10);
        await user.update({ pin_hash: pinHash });
        return res.status(200).json({ message: 'PIN guardado correctamente.' });
    } catch (err) {
        console.error('Error en setPin:', err);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Remover PIN del usuario autenticado
 */
exports.clearPin = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'No autenticado.' });

        await user.update({ pin_hash: null });
        return res.status(200).json({ message: 'PIN eliminado correctamente.' });
    } catch (err) {
        console.error('Error en clearPin:', err);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Solicitud de restablecimiento de contraseña (envío OTP)
 */
exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'El email es obligatorio.' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Evitamos revelar si existe o no
            return res.status(200).json({ message: 'Si el email existe, se enviará un código de recuperación.' });
        }

        const otpCode = generateOTP();
        const otpExpiration = new Date(Date.now() + 15 * 60 * 1000);

        await user.update({
            otp_code: otpCode,
            otp_expiration: otpExpiration,
            otp_context: 'password_reset',
        });

        await sendOTP(email, otpCode);

        return res.status(200).json({ message: 'Código de recuperación enviado. Revisa tu email.' });
    } catch (error) {
        console.error('Error en requestPasswordReset:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Confirmación de reset: validar OTP y actualizar contraseña
 */
exports.confirmPasswordReset = async (req, res) => {
    const { email, otp_code, newPassword, confirmPassword } = req.body;

    if (!email || !otp_code || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (user.otp_context !== 'password_reset') {
            return res.status(400).json({ message: 'El código no corresponde a un reseteo de contraseña.' });
        }

        const dbCode = String(user.otp_code || '').trim();
        if (dbCode !== String(otp_code).trim()) {
            return res.status(401).json({ message: 'Código OTP inválido.' });
        }

        if (user.otp_expiration && new Date() > user.otp_expiration) {
            return res.status(401).json({ message: 'El código OTP expiró. Solicita uno nuevo.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await user.update({
            password_hash: passwordHash,
            otp_code: null,
            otp_expiration: null,
            otp_context: null,
            email_verificado: true,
        });

        return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        console.error('Error en confirmPasswordReset:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
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

        // Forzar contexto de login
        if (user.otp_context !== 'login') {
            return res.status(401).json({ message: 'Este código OTP no es válido para inicio de sesión.' });
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
        
        // Limpia el código en la base de datos despues de usarlo
        user.otp_code = null; 
        user.otp_expiration = null;
        user.otp_context = null;
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
