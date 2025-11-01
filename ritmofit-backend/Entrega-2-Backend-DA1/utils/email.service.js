// utils/email.service.js
const nodemailer = require('nodemailer');

// 1. Configurar el transportador de correo (usando credenciales del .env)
const transporter = nodemailer.createTransport({
    service: 'gmail', // O 'Outlook', 'SendGrid', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 2. Función para enviar el OTP
const sendOTP = async (email, otpCode) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Tu código de acceso único (OTP) para RitmoFit',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; max-width: 500px; margin: auto;">
                <h2 style="color: #4CAF50;">Bienvenido a RitmoFit</h2>
                <p>Tu código de verificación de un solo uso (OTP) es:</p>
                <h1 style="background-color: #f2f2f2; padding: 10px; text-align: center; color: #333;">${otpCode}</h1>
                <p>Este código expira en 5 minutos. Si no solicitaste este acceso, por favor ignora este correo.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ OTP enviado a: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error al enviar el correo OTP:', error);
        return false;
    }
};

module.exports = { sendOTP };