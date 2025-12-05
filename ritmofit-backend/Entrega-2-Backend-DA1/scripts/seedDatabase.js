const path = require('path');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/db.config');
const Sede = require('../models/sede.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Reserva = require('../models/reserva.model');
const Noticia = require('../models/noticia.model');
const Asistencia = require('../models/asistencia.model');
const Calificacion = require('../models/calificacion.model');
const Notificacion = require('../models/notificacion.model');

const PRESERVED_EMAIL = 'llacheta@uade.edu.ar';
const PRESERVED_ID = 43;

const PRESENTATION_DATE = process.env.SEED_PRESENTATION_DATE || '2025-12-05T12:00:00-03:00';
const baseNow = (() => {
    const parsed = new Date(PRESENTATION_DATE);
    if (Number.isNaN(parsed.getTime())) {
        return new Date();
    }
    return parsed;
})();

const cloneDate = (date) => new Date(date.getTime());
const shiftDate = (date, { months = 0, days = 0, hours = 0, minutes = 0 } = {}) => {
    const next = cloneDate(date);
    if (months) next.setMonth(next.getMonth() + months);
    if (days) next.setDate(next.getDate() + days);
    if (hours) next.setHours(next.getHours() + hours);
    if (minutes) next.setMinutes(next.getMinutes() + minutes);
    return next;
};

const withSeconds = (time) => (time.length === 8 ? time : `${time}:00`);
const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => date.toTimeString().split(' ')[0];
const addDays = (offset, reference = baseNow) => shiftDate(reference, { days: offset });
const addHoursFromBase = (hours, reference = baseNow) => shiftDate(reference, { hours });
const getDecemberRange = () => {
    const now = baseNow;
    let year = now.getFullYear();
    const decemberEndThisYear = new Date(year, 11, 31, 23, 59, 59, 999);
    if (now > decemberEndThisYear) {
        year += 1;
    }
    const start = new Date(year, 11, 1, 12, 0, 0, 0);
    const end = new Date(year, 11, 31, 12, 0, 0, 0);
    return { start, end, year };
};

const locateUserToPreserve = async (transaction) => {
    let preserved = await User.findOne({ where: { email: PRESERVED_EMAIL }, transaction });
    if (preserved) {
        console.log(`   - Se preservara el usuario ${preserved.email}`);
        return preserved;
    }

    if (PRESERVED_ID) {
        preserved = await User.findByPk(PRESERVED_ID, { transaction });
        if (preserved) {
            console.log(`   - Se preservara el usuario con id ${PRESERVED_ID}`);
            return preserved;
        }
    }

    console.log('   - No se encontro un usuario existente para preservar.');
    return null;
};

const clearTables = async (transaction, preservedUser) => {
    console.log('Limpiando tablas antes del seed...');
    const tables = [Asistencia, Calificacion, Reserva, Notificacion, Clase, Noticia, Sede];
    for (const model of tables) {
        await model.destroy({ where: {}, force: true, truncate: false, transaction });
    }

    const userWhere = preservedUser ? { id: { [Op.ne]: preservedUser.id } } : {};
    await User.destroy({ where: userWhere, force: true, truncate: false, transaction });
    if (preservedUser) {
        await preservedUser.reload({ transaction });
    }
};

const createSedes = async (transaction) => {
    const sedesSeed = [
        {
            alias: 'centro',
            nombre: 'RitmoFit Centro',
            direccion: 'Av. Corrientes 1234, CABA',
            telefono: '011-4555-1234',
            latitud: -34.603722,
            longitud: -58.381592,
            disciplinas_ofrecidas: 'Spinning, Yoga, Pilates, Funcional'
        },
        {
            alias: 'palermo',
            nombre: 'RitmoFit Palermo',
            direccion: 'Av. Santa Fe 3456, Palermo',
            telefono: '011-4777-5678',
            latitud: -34.588888,
            longitud: -58.419444,
            disciplinas_ofrecidas: 'Zumba, Box, Funcional, Yoga'
        },
        {
            alias: 'belgrano',
            nombre: 'RitmoFit Belgrano',
            direccion: 'Av. Cabildo 2345, Belgrano',
            telefono: '011-4788-9012',
            latitud: -34.562778,
            longitud: -58.456389,
            disciplinas_ofrecidas: 'Spinning, Pilates, Stretching'
        },
        {
            alias: 'nordelta',
            nombre: 'RitmoFit Nordelta',
            direccion: 'Av. del Golf 550, Tigre',
            telefono: '011-4890-2211',
            latitud: -34.404002,
            longitud: -58.653171,
            disciplinas_ofrecidas: 'HIIT, CrossFit, Natacion'
        }
    ];

    const sedes = {};
    for (const sede of sedesSeed) {
        const { alias, ...payload } = sede;
        const record = await Sede.create(payload, { transaction });
        sedes[alias] = record;
    }
    console.log(`   - Sedes creadas: ${Object.keys(sedes).length}`);
    return sedes;
};

const createUsers = async (transaction, preservedUser) => {
    const userSeed = [
        {
            alias: 'admin',
            nombre: 'Lucia Torres',
            username: 'ritmoadmin',
            email: 'admin@ritmofit.com',
            rol: 'admin',
            password: 'Admin123!',
            pin: '4321',
            telefono: '011-4000-1000',
            direccion: 'Oficinas Centrales RitmoFit',
            fechaNacimiento: '1989-04-12',
            foto_url: 'https://i.pravatar.cc/150?img=48'
        },
        {
            alias: 'martina',
            nombre: 'Martina Gonzalez',
            username: 'martina.fit',
            email: 'martina.instructor@ritmofit.com',
            rol: 'instructor',
            password: 'Instructor123!',
            pin: '1111',
            telefono: '011-4600-1111',
            fechaNacimiento: '1991-06-02',
            foto_url: 'https://i.pravatar.cc/150?img=12'
        },
        {
            alias: 'diego',
            nombre: 'Diego Martinez',
            username: 'diegofit',
            email: 'diego.instructor@ritmofit.com',
            rol: 'instructor',
            password: 'Instructor123!',
            pin: '2222',
            telefono: '011-4700-2222',
            fechaNacimiento: '1987-09-19',
            foto_url: 'https://i.pravatar.cc/150?img=15'
        },
        {
            alias: 'valentina',
            nombre: 'Valentina Rios',
            username: 'valen.rios',
            email: 'valentina.instructor@ritmofit.com',
            rol: 'instructor',
            password: 'Instructor123!',
            pin: '3333',
            telefono: '011-4300-7777',
            fechaNacimiento: '1993-11-07',
            foto_url: 'https://i.pravatar.cc/150?img=32'
        },
        {
            alias: 'carlos',
            nombre: 'Carlos Perez',
            username: 'coachcarlos',
            email: 'carlos.instructor@ritmofit.com',
            rol: 'instructor',
            password: 'Instructor123!',
            pin: '4444',
            telefono: '011-4900-5555',
            fechaNacimiento: '1985-02-01',
            foto_url: 'https://i.pravatar.cc/150?img=33'
        },
        {
            alias: 'sofia',
            nombre: 'Sofia Castro',
            username: 'sofia.castro',
            email: 'sofia@ritmofit.com',
            rol: 'socio',
            password: 'Socio123!',
            pin: '5555',
            telefono: '011-4100-2222',
            direccion: 'Av. Las Heras 2100, Palermo',
            fechaNacimiento: '1995-03-14',
            foto_url: 'https://i.pravatar.cc/150?img=45'
        },
        {
            alias: 'lucas',
            nombre: 'Lucas Benitez',
            username: 'lucas.b',
            email: 'lucas@ritmofit.com',
            rol: 'socio',
            password: 'Socio123!',
            pin: '6666',
            telefono: '011-4100-3333',
            direccion: 'Amenabar 1900, Belgrano',
            fechaNacimiento: '1992-08-21',
            foto_url: 'https://i.pravatar.cc/150?img=23'
        },
        {
            alias: 'camila',
            nombre: 'Camila Duarte',
            username: 'camid',
            email: 'camila@ritmofit.com',
            rol: 'socio',
            password: 'Socio123!',
            pin: '7777',
            telefono: '011-4100-4444',
            direccion: 'Conde 2500, Colegiales',
            fechaNacimiento: '1996-12-02',
            foto_url: 'https://i.pravatar.cc/150?img=36'
        },
        {
            alias: 'nico',
            nombre: 'Nicolas Herrera',
            username: 'nicoh',
            email: 'nicolas@ritmofit.com',
            rol: 'socio',
            password: 'Socio123!',
            pin: '8888',
            telefono: '011-4100-5555',
            direccion: 'Montaneses 900, Nuñez',
            fechaNacimiento: '1990-01-30',
            foto_url: 'https://i.pravatar.cc/150?img=52'
        },
        {
            alias: 'agustin',
            nombre: 'Agustin Vidal',
            username: 'agus.vidal',
            email: 'agustin@ritmofit.com',
            rol: 'socio',
            password: 'Socio123!',
            pin: '9999',
            telefono: '011-4100-7777',
            direccion: 'Amenabar 2300, Belgrano',
            fechaNacimiento: '1994-05-11',
            foto_url: 'https://i.pravatar.cc/150?img=57'
        },
        {
            alias: 'julieta',
            nombre: 'Julieta Molina',
            username: 'juli.fit',
            email: 'julieta@ritmofit.com',
            rol: 'socio',
            password: 'Socio123!',
            pin: '1010',
            telefono: '011-4100-8888',
            direccion: 'Virrey del Pino 1500, Palermo',
            fechaNacimiento: '1998-09-04',
            foto_url: 'https://i.pravatar.cc/150?img=27'
        }
    ];

    const users = {};
    for (const user of userSeed) {
        const { alias, password, pin, ...payload } = user;
        payload.password_hash = bcrypt.hashSync(password, 10);
        payload.pin_hash = bcrypt.hashSync(String(pin), 10);
        payload.email_verificado = true;
        const record = await User.create(payload, { transaction });
        users[alias] = record;
    }

    if (preservedUser) {
        users.llacheta = preservedUser;
    }

    console.log(`   - Usuarios creados (sin contar el preservado): ${userSeed.length}`);
    return users;
};

const registerClase = async ({ alias, data, clasesPorAlias, transaction }) => {
    const record = await Clase.create(data, { transaction });
    clasesPorAlias[alias] = { record, fecha: data.fecha };
};

const createClases = async (transaction, sedes, users) => {
    const { year: decemberYear } = getDecemberRange();
    const daysInDecember = new Date(decemberYear, 12, 0).getDate();
    const slotKey = (fecha, hora) => `${fecha}|${hora}`;
    const usedSlots = new Set();
    const clasesPorAlias = {};

    const featuredTemplates = [
        {
            alias: 'sunriseYoga',
            nombre: 'Sunrise Yoga Flow',
            disciplina: 'Yoga',
            descripcion: 'Vinyasa suave para activar el cuerpo',
            dayOfMonth: 6,
            hora: '07:30',
            duracion: 60,
            cupo: 18,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
            sedeAlias: 'palermo',
            instructorAlias: 'valentina'
        },
        {
            alias: 'powerCycling',
            nombre: 'Power Cycling',
            disciplina: 'Spinning',
            descripcion: 'Intervalos de alta intensidad con musica electronica',
            dayOfMonth: 3,
            hora: '18:30',
            duracion: 50,
            cupo: 22,
            nivel: 'avanzado',
            imagen_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
            sedeAlias: 'centro',
            instructorAlias: 'diego'
        },
        {
            alias: 'functionalExpress',
            nombre: 'Functional Express',
            disciplina: 'Funcional',
            descripcion: 'Circuito de fuerza y cardio en 40 minutos',
            dayOfMonth: 9,
            hora: '13:00',
            duracion: 40,
            cupo: 16,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
            sedeAlias: 'belgrano',
            instructorAlias: 'martina'
        },
        {
            alias: 'boxingBasics',
            nombre: 'Boxing Basics',
            disciplina: 'Box',
            descripcion: 'Tecnica de golpe y trabajo de bolsas',
            dayOfMonth: 13,
            hora: '20:00',
            duracion: 55,
            cupo: 14,
            nivel: 'principiante',
            imagen_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
            sedeAlias: 'palermo',
            instructorAlias: 'carlos'
        },
        {
            alias: 'mobilityLab',
            nombre: 'Mobility Lab',
            disciplina: 'Stretching',
            descripcion: 'Sesiones guiadas para mejorar amplitud articular',
            dayOfMonth: 2,
            hora: '19:15',
            duracion: 45,
            cupo: 20,
            nivel: 'principiante',
            imagen_url: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600',
            sedeAlias: 'belgrano',
            instructorAlias: 'valentina'
        },
        {
            alias: 'pilatesCore',
            nombre: 'Pilates Core Control',
            disciplina: 'Pilates',
            descripcion: 'Trabajo de estabilidad en reformer',
            dayOfMonth: 18,
            hora: '09:00',
            duracion: 55,
            cupo: 12,
            nivel: 'avanzado',
            imagen_url: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=600',
            sedeAlias: 'centro',
            instructorAlias: 'martina'
        },
        {
            alias: 'eveningFlow',
            nombre: 'Evening Flow',
            disciplina: 'Yoga',
            descripcion: 'Clase restaurativa al atardecer',
            dayOfMonth: 1,
            hora: '19:00',
            duracion: 60,
            cupo: 15,
            nivel: 'principiante',
            imagen_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
            sedeAlias: 'nordelta',
            instructorAlias: 'valentina'
        },
        {
            alias: 'hiitLunch',
            nombre: 'Lunch HIIT Blast',
            disciplina: 'HIIT',
            descripcion: 'Entrenamiento express para la hora del almuerzo',
            dayOfMonth: 22,
            hora: '12:30',
            duracion: 35,
            cupo: 18,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1554288246-0d58b94cf357?w=600',
            sedeAlias: 'nordelta',
            instructorAlias: 'diego'
        }
    ];

    const recurringPatterns = [
        {
            nombreBase: 'December Ride',
            disciplina: 'Spinning',
            descripcion: 'Sesion de potencia con metricas en vivo.',
            hora: '07:00',
            duracion: 45,
            cupo: 24,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
            sedeAlias: 'centro',
            instructorAlias: 'diego'
        },
        {
            nombreBase: 'Balance & Core',
            disciplina: 'Yoga',
            descripcion: 'Secuencia guiada para cerrar el dia.',
            hora: '18:00',
            duracion: 60,
            cupo: 20,
            nivel: 'principiante',
            imagen_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
            sedeAlias: 'palermo',
            instructorAlias: 'valentina'
        },
        {
            nombreBase: 'Metcon Circuit',
            disciplina: 'Funcional',
            descripcion: 'Circuito hibrido fuerza + cardio.',
            hora: '13:15',
            duracion: 40,
            cupo: 18,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
            sedeAlias: 'belgrano',
            instructorAlias: 'martina'
        },
        {
            nombreBase: 'Box + HIIT',
            disciplina: 'Box',
            descripcion: 'Golpes tecnicos con trabajo de intervalos.',
            hora: '19:30',
            duracion: 50,
            cupo: 16,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
            sedeAlias: 'palermo',
            instructorAlias: 'carlos'
        }
    ];

    for (const clase of featuredTemplates) {
        const { alias, dayOfMonth, hora, duracion, cupo, sedeAlias, instructorAlias, ...rest } = clase;
        const fecha = formatDate(new Date(decemberYear, 11, dayOfMonth, 12, 0, 0, 0));
        const horaNormalizada = withSeconds(hora);
        const data = {
            ...rest,
            fecha,
            hora_inicio: horaNormalizada,
            duracion_minutos: duracion,
            cupo_maximo: cupo,
            sedeId: sedes[sedeAlias].id,
            instructorId: users[instructorAlias].id
        };
        await registerClase({ alias, data, clasesPorAlias, transaction });
        usedSlots.add(slotKey(fecha, horaNormalizada));
    }

    const decemberEntries = [];
    for (let day = 1; day <= daysInDecember; day += 2) {
        const template = recurringPatterns[(day - 1) % recurringPatterns.length];
        const fecha = formatDate(new Date(decemberYear, 11, day, 12, 0, 0, 0));
        const hora = withSeconds(template.hora);
        const slot = slotKey(fecha, hora);
        if (usedSlots.has(slot)) continue;

        decemberEntries.push({
            nombre: `${template.nombreBase} ${String(day).padStart(2, '0')}/12`,
            disciplina: template.disciplina,
            descripcion: template.descripcion,
            fecha,
            hora_inicio: hora,
            duracion_minutos: template.duracion,
            cupo_maximo: template.cupo,
            nivel: template.nivel,
            imagen_url: template.imagen_url,
            sedeId: sedes[template.sedeAlias].id,
            instructorId: users[template.instructorAlias].id
        });
        usedSlots.add(slot);
    }

    if (decemberEntries.length) {
        await Clase.bulkCreate(decemberEntries, { transaction });
    }

    const historialNow = baseNow;
    const historialConfigs = [
        {
            alias: 'histCalificable',
            nombre: 'Historial calificable',
            disciplina: 'Yoga',
            descripcion: 'Clase tomada hace menos de 24h para calificar.',
            date: (() => {
                const d = shiftDate(historialNow, { days: -1 });
                d.setHours(21, 30, 0, 0);
                return d;
            })(),
            duracion: 60,
            cupo: 18,
            nivel: 'principiante',
            imagen_url: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=600',
            sedeAlias: 'palermo',
            instructorAlias: 'valentina'
        },
        {
            alias: 'histIncalificable',
            nombre: 'Historial fuera de ventana',
            disciplina: 'Funcional',
            descripcion: 'Clase de hace 2 dias, ya no admite calificacion.',
            date: (() => {
                const d = shiftDate(historialNow, { days: -2 });
                d.setHours(10, 0, 0, 0);
                return d;
            })(),
            duracion: 50,
            cupo: 20,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=600',
            sedeAlias: 'centro',
            instructorAlias: 'martina'
        },
        {
            alias: 'histPasadoMes',
            nombre: 'Historial antiguo',
            disciplina: 'Pilates',
            descripcion: 'Clase de hace 3 meses para vista "Todos".',
            date: (() => {
                const d = shiftDate(historialNow, { months: -3 });
                d.setHours(18, 0, 0, 0);
                return d;
            })(),
            duracion: 45,
            cupo: 12,
            nivel: 'avanzado',
            imagen_url: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=600',
            sedeAlias: 'belgrano',
            instructorAlias: 'carlos'
        }
    ];

    if (users.llacheta) {
        historialConfigs.push({
            alias: 'llachetaLateFlow',
            nombre: 'Flow nocturno socios',
            disciplina: 'Yoga',
            descripcion: 'Sesion nocturna para mostrar calificacion pendiente.',
            date: (() => {
                const d = shiftDate(historialNow, { days: -1 });
                d.setHours(21, 45, 0, 0);
                return d;
            })(),
            duracion: 55,
            cupo: 16,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
            sedeAlias: 'centro',
            instructorAlias: 'martina'
        });
    }

    for (const clase of historialConfigs) {
        const { alias, date, duracion, cupo, sedeAlias, instructorAlias, ...rest } = clase;
        const data = {
            ...rest,
            fecha: formatDate(date),
            hora_inicio: formatTime(date),
            duracion_minutos: duracion,
            cupo_maximo: cupo,
            sedeId: sedes[sedeAlias].id,
            instructorId: users[instructorAlias].id
        };
        await registerClase({ alias, data, clasesPorAlias, transaction });
    }

    const reminderDate = shiftDate(baseNow, { minutes: 63 });
    reminderDate.setSeconds(0, 0);
    const reminderData = {
        alias: 'recordatorioPush',
        data: {
            nombre: 'Recordatorio Push Test',
            disciplina: 'Funcional',
            descripcion: 'Generada para probar recordatorios y notificaciones.',
            fecha: formatDate(reminderDate),
            hora_inicio: formatTime(reminderDate),
            duracion_minutos: 45,
            cupo_maximo: 20,
            nivel: 'intermedio',
            imagen_url: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=600',
            sedeId: sedes.centro.id,
            instructorId: users.diego.id
        }
    };
    await registerClase({ ...reminderData, clasesPorAlias, transaction });

    console.log(`   - Clases destacadas creadas: ${featuredTemplates.length}`);
    console.log(`   - Clases calendario diciembre: ${decemberEntries.length}`);
    console.log(`   - Clases especiales (historial + recordatorios): ${historialConfigs.length + 1}`);

    return {
        recordsByAlias: clasesPorAlias,
        totals: {
            featured: featuredTemplates.length,
            december: decemberEntries.length,
            especiales: historialConfigs.length + 1
        }
    };
};

const createReservas = async (transaction, users, clases) => {
    const reservaSeed = [
        {
            alias: 'reservaSofiaYoga',
            userAlias: 'sofia',
            claseAlias: 'sunriseYoga',
            estado: 'activa',
            reservaOffsetHours: -6
        },
        {
            alias: 'reservaLucasCycling',
            userAlias: 'lucas',
            claseAlias: 'powerCycling',
            estado: 'asistida',
            reservaOffsetHours: -48
        },
        {
            alias: 'reservaCamilaMobility',
            userAlias: 'camila',
            claseAlias: 'mobilityLab',
            estado: 'asistida',
            reservaOffsetHours: -30
        },
        {
            alias: 'reservaNicoFunctional',
            userAlias: 'nico',
            claseAlias: 'functionalExpress',
            estado: 'cancelada',
            reservaOffsetHours: -10
        },
        {
            alias: 'reservaAgustinHiit',
            userAlias: 'agustin',
            claseAlias: 'hiitLunch',
            estado: 'activa',
            reservaOffsetHours: -1
        },
        {
            alias: 'reservaJulietaEvening',
            userAlias: 'julieta',
            claseAlias: 'eveningFlow',
            estado: 'activa',
            reservaOffsetHours: -3
        },
        {
            alias: 'reservaHistorialCalificable',
            userAlias: 'sofia',
            claseAlias: 'histCalificable',
            estado: 'asistida',
            reservaOffsetHours: -8
        },
        {
            alias: 'reservaHistorialIncalificable',
            userAlias: 'lucas',
            claseAlias: 'histIncalificable',
            estado: 'expirada',
            reservaOffsetHours: -60
        },
        {
            alias: 'reservaHistorialPasado',
            userAlias: 'camila',
            claseAlias: 'histPasadoMes',
            estado: 'ausente',
            reservaOffsetHours: -140
        }
    ];

    if (users.llacheta) {
        reservaSeed.push(
            {
                alias: 'reservaLlachetaPendiente',
                userAlias: 'llacheta',
                claseAlias: 'recordatorioPush',
                estado: 'activa',
                reservaDate: shiftDate(baseNow, { hours: -3 })
            },
            {
                alias: 'reservaLlachetaCalificable',
                userAlias: 'llacheta',
                claseAlias: 'llachetaLateFlow',
                estado: 'asistida',
                reservaDate: shiftDate(baseNow, { days: -1, hours: -4 })
            },
            {
                alias: 'reservaLlachetaCancelada',
                userAlias: 'llacheta',
                claseAlias: 'functionalExpress',
                estado: 'cancelada',
                reservaDate: shiftDate(baseNow, { days: -2, hours: -6 })
            }
        );
    }

    const reservas = {};
    for (const reserva of reservaSeed) {
        const { alias, userAlias, claseAlias, reservaOffsetHours, reservaDate, ...rest } = reserva;
        const record = await Reserva.create({
            ...rest,
            fecha_reserva: reservaDate || addHoursFromBase(reservaOffsetHours),
            userId: users[userAlias].id,
            claseId: clases[claseAlias].record.id
        }, { transaction });
        reservas[alias] = record;
    }
    console.log(`   - Reservas creadas: ${Object.keys(reservas).length}`);
    return reservas;
};

const createAsistencias = async (transaction, users, clases) => {
    const asistenciaSeed = [
        {
            userAlias: 'lucas',
            claseAlias: 'powerCycling',
            checkin: '18:20:00',
            duracion: 50,
            confirmado_por_qr: true
        },
        {
            userAlias: 'camila',
            claseAlias: 'mobilityLab',
            checkin: '19:10:00',
            duracion: 45,
            confirmado_por_qr: true
        },
        {
            userAlias: 'sofia',
            claseAlias: 'eveningFlow',
            checkin: '18:55:00',
            duracion: 60,
            confirmado_por_qr: false
        },
        {
            userAlias: 'sofia',
            claseAlias: 'histCalificable',
            checkin: '21:20:00',
            duracion: 60,
            confirmado_por_qr: true
        },
        {
            userAlias: 'lucas',
            claseAlias: 'histIncalificable',
            checkin: '10:05:00',
            duracion: 50,
            confirmado_por_qr: true
        },
        {
            userAlias: 'camila',
            claseAlias: 'histPasadoMes',
            checkin: '18:02:00',
            duracion: 45,
            confirmado_por_qr: false
        }
    ];

    if (users.llacheta) {
        asistenciaSeed.push({
            userAlias: 'llacheta',
            claseAlias: 'llachetaLateFlow',
            checkin: '21:40:00',
            duracion: 55,
            confirmado_por_qr: true
        });
    }

    for (const asistencia of asistenciaSeed) {
        const { userAlias, claseAlias, checkin, duracion, ...rest } = asistencia;
        await Asistencia.create({
            ...rest,
            userId: users[userAlias].id,
            claseId: clases[claseAlias].record.id,
            fecha_asistencia: clases[claseAlias].fecha,
            checkin_hora: checkin,
            duracion_minutos: duracion
        }, { transaction });
    }
    console.log(`   - Asistencias creadas: ${asistenciaSeed.length}`);
};

const createCalificaciones = async (transaction, users, clases) => {
    const calificacionSeed = [
        {
            userAlias: 'lucas',
            claseAlias: 'powerCycling',
            rating: 5,
            ratingInstructor: 5,
            comentario: 'Clase intensa y bien guiada.'
        },
        {
            userAlias: 'camila',
            claseAlias: 'mobilityLab',
            rating: 4,
            ratingInstructor: 4,
            comentario: 'Mejoro mi movilidad cada semana.'
        },
        {
            userAlias: 'sofia',
            claseAlias: 'histCalificable',
            rating: 5,
            ratingInstructor: 5,
            comentario: 'Experiencia impecable y super personalizada.'
        }
    ];

    for (const calificacion of calificacionSeed) {
        const { userAlias, claseAlias, ...rest } = calificacion;
        await Calificacion.create({
            ...rest,
            userId: users[userAlias].id,
            claseId: clases[claseAlias].record.id
        }, { transaction });
    }
    console.log(`   - Calificaciones creadas: ${calificacionSeed.length}`);
};

const createNoticias = async (transaction) => {
    const now = cloneDate(baseNow);
    const nextWeek = addDays(7);
    const twoDays = addDays(2);

    const noticiasSeed = [
        {
            titulo: 'Renovamos el equipamiento de cardio',
            descripcion: 'Nuevas bicicletas y cintas ya estan disponibles en RitmoFit Centro.',
            contenido: 'Reemplazamos el parque aerobico completo y sumamos pantallas interactivas.',
            tipo: 'noticia',
            imagen_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
            fecha_publicacion: now,
            autor: 'Equipo Operaciones',
            vigente: true,
            destacada: true
        },
        {
            titulo: 'Promo verano 3x2 en membresias',
            descripcion: 'Pagas dos meses y entrenas tres en cualquier sede.',
            contenido: 'Aplica para planes anuales y trimestrales. Cupos limitados.',
            tipo: 'promocion',
            imagen_url: 'https://images.unsplash.com/photo-1526403224731-5d7d0b9b7f7f?w=800',
            fecha_publicacion: now,
            fecha_vencimiento: nextWeek,
            autor: 'Marketing',
            vigente: true,
            codigo_promocion: 'VERANO3X2'
        },
        {
            titulo: 'Sunset Rooftop Workout',
            descripcion: 'Clase especial al aire libre en la terraza de Nordelta.',
            contenido: 'Incluye DJ en vivo y barra hidratante. Se requiere reserva.',
            tipo: 'evento',
            imagen_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
            fecha_publicacion: now,
            fecha_evento: twoDays,
            autor: 'Eventos',
            vigente: true,
            destacada: true,
            ubicacion: 'Terraza Nordelta'
        },
        {
            titulo: 'Programa de bienestar corporativo',
            descripcion: 'RitmoFit desembarca en empresas con talleres in company.',
            contenido: 'Contactanos para sumar tu empresa y acceder a beneficios.',
            tipo: 'noticia',
            imagen_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800',
            fecha_publicacion: now,
            autor: 'Equipo Comercial',
            vigente: true
        },
        {
            titulo: 'Apertura de nueva sede RitmoFit Palermo',
            descripcion: 'Inauguramos con clases gratuitas el fin de semana.',
            contenido: 'Habra clases gratuitas y promociones especiales durante la primera semana.',
            tipo: 'noticia',
            imagen_url: 'https://images.unsplash.com/photo-1526403224731-5d7d0b9b7f7f?w=800',
            fecha_publicacion: now,
            autor: 'Equipo RitmoFit',
            vigente: true,
            destacada: true
        },
        {
            titulo: 'Promocion 2x1 en Spinning',
            descripcion: 'Llevate a un amigo y ambos pagan una sola clase.',
            contenido: 'Promo valida en sedes seleccionadas hasta agotar cupos.',
            tipo: 'promocion',
            imagen_url: 'https://images.unsplash.com/photo-1508948956644-1f9b39b2b2d4?w=800',
            fecha_publicacion: now,
            fecha_vencimiento: nextWeek,
            autor: 'Marketing',
            vigente: true,
            codigo_promocion: 'SPIN2X1'
        },
        {
            titulo: 'Evento con instructor internacional',
            descripcion: 'Clase magistral con invitado desde Brasil.',
            contenido: 'Cupos limitados, reserva tu lugar ahora.',
            tipo: 'evento',
            imagen_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
            fecha_publicacion: now,
            fecha_evento: addDays(1),
            autor: 'Comunidad',
            vigente: true
        }
    ];

    await Noticia.bulkCreate(noticiasSeed, { transaction });
    console.log(`   - Noticias/promos creadas: ${noticiasSeed.length}`);
};

const createNotificaciones = async (transaction, users, clases, reservas) => {
    const notificacionSeed = [
        {
            userAlias: 'sofia',
            tipo: 'reminder',
            titulo: 'Recordatorio de clase',
            mensaje: 'Tu clase Sunrise Yoga Flow comienza manana a las 07:30.',
            data: {
                claseId: clases.sunriseYoga.record.id,
                fecha: clases.sunriseYoga.fecha
            }
        },
        {
            userAlias: 'nico',
            tipo: 'cancellation',
            titulo: 'Reserva cancelada',
            mensaje: 'Se cancelo tu reserva a Functional Express por cupo liberado.',
            data: {
                reservaId: reservas.reservaNicoFunctional?.id || null,
                claseId: clases.functionalExpress.record.id
            }
        },
        {
            userAlias: 'lucas',
            tipo: 'reschedule',
            titulo: 'Cambio de horario',
            mensaje: 'Power Cycling adelanto su inicio a las 18:20 para el dia de hoy.',
            data: {
                claseId: clases.powerCycling.record.id,
                hora_nueva: '18:20'
            }
        },
        {
            userAlias: 'agustin',
            tipo: 'reminder',
            titulo: 'Recordatorio HIIT',
            mensaje: 'Lunch HIIT Blast arranca en 1 hora, hidratate bien.',
            data: {
                claseId: clases.hiitLunch.record.id,
                fecha: clases.hiitLunch.fecha
            }
        },
        {
            userAlias: 'julieta',
            tipo: 'reminder',
            titulo: 'Nueva sede',
            mensaje: 'Recorda visitar la apertura de Palermo este finde.',
            data: {
                featuredNoticia: 'Apertura de nueva sede RitmoFit Palermo'
            }
        }
    ];

    if (users.llacheta) {
        notificacionSeed.push({
            userAlias: 'llacheta',
            tipo: 'reminder',
            titulo: 'Califica tu clase de anoche',
            mensaje: 'Tu Flow nocturno del 4/12 sigue disponible para calificar.',
            data: {
                claseId: clases.llachetaLateFlow?.record.id,
                fecha: clases.llachetaLateFlow?.fecha
            }
        });
    }

    let created = 0;
    for (const notif of notificacionSeed) {
        const { userAlias, ...payload } = notif;
        const owner = users[userAlias];
        if (!owner) continue;
        await Notificacion.create({
            ...payload,
            userId: owner.id
        }, { transaction });
        created += 1;
    }

    console.log(`   - Notificaciones creadas: ${created}`);
};

const seedDatabase = async () => {
    console.log('Iniciando seed integral de RitmoFit...');
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    const transaction = await sequelize.transaction();

    try {
        const preservedUser = await locateUserToPreserve(transaction);
        await clearTables(transaction, preservedUser);

        const sedes = await createSedes(transaction);
        const users = await createUsers(transaction, preservedUser);
        const { recordsByAlias: clases, totals: clasesTotals } = await createClases(transaction, sedes, users);
        const reservas = await createReservas(transaction, users, clases);
        await createAsistencias(transaction, users, clases);
        await createCalificaciones(transaction, users, clases);
        await createNoticias(transaction);
        await createNotificaciones(transaction, users, clases, reservas);

        await transaction.commit();
        console.log('Seed ejecutado correctamente.');
        console.log('Resumen:');
        console.log(`   * Total sedes: ${Object.keys(sedes).length}`);
        console.log(`   * Total usuarios (incluye preservado si existia): ${Object.keys(users).length}`);
        const totalClases = clasesTotals.featured + clasesTotals.december + clasesTotals.especiales;
        console.log(`   * Total clases: ${totalClases}`);
        console.log(`       - Destacadas: ${clasesTotals.featured}`);
        console.log(`       - Calendario diciembre: ${clasesTotals.december}`);
        console.log(`       - Escenarios especiales: ${clasesTotals.especiales}`);
        console.log(`   * Total reservas: ${Object.keys(reservas).length}`);
        process.exit(0);
    } catch (error) {
        await transaction.rollback();
        console.error('Error al ejecutar el seed:', error);
        process.exit(1);
    }
};

seedDatabase();
