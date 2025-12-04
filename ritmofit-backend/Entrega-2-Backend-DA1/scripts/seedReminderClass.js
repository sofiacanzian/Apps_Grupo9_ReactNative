const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/db.config');
const Sede = require('../models/sede.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');

const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => date.toTimeString().split(' ')[0];

const ensureSede = async (transaction) => {
    let sede = await Sede.findOne({ transaction });
    if (!sede) {
        sede = await Sede.create({
            nombre: 'RitmoFit Centro',
            direccion: 'Av. Corrientes 1234, CABA',
            telefono: '011-4555-1234',
            latitud: -34.603722,
            longitud: -58.381592,
            disciplinas_ofrecidas: 'Spinning, Yoga, Pilates, Funcional'
        }, { transaction });
    }
    return sede;
};

const ensureInstructor = async (transaction) => {
    let instructor = await User.findOne({
        where: { rol: 'instructor' },
        order: [['id', 'ASC']],
        transaction
    });

    if (!instructor) {
        instructor = await User.create({
            nombre: 'Instructor Demo',
            email: 'instructor.demo@ritmofit.com',
            rol: 'instructor',
            password_hash: bcrypt.hashSync('Instructor123!', 10),
            pin_hash: bcrypt.hashSync('1234', 10),
            email_verificado: true
        }, { transaction });
    }

    return instructor;
};

const seedReminderClass = async () => {
    console.log('Creando clase de prueba para recordatorios (1h 3m en el futuro)...');
    await sequelize.authenticate();
    const transaction = await sequelize.transaction();

    try {
        const delayMs = ((1 * 60) + 3) * 60 * 1000; // 1 hora y 3 minutos
        const startDate = new Date(Date.now() + delayMs);
        startDate.setSeconds(0, 0);

        const fecha = formatDate(startDate);
        const hora = formatTime(startDate);
        const claseNombre = 'Clase prueba recordatorios';

        const sede = await ensureSede(transaction);
        const instructor = await ensureInstructor(transaction);

        await Clase.destroy({
            where: { nombre: claseNombre },
            transaction
        });

        const clase = await Clase.create({
            nombre: claseNombre,
            disciplina: 'Funcional',
            descripcion: 'Generada automáticamente para probar recordatorios y notificaciones.',
            fecha,
            hora_inicio: hora,
            duracion_minutos: 45,
            cupo_maximo: 20,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=600',
            sedeId: sede.id,
            instructorId: instructor.id
        }, { transaction });

        await transaction.commit();
        console.log(`✅ Clase "${clase.nombre}" creada para el ${fecha} a las ${hora}.`);
        process.exit(0);
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error al crear la clase de recordatorio:', error);
        process.exit(1);
    }
};

seedReminderClass();
