require('dotenv').config();
const { sequelize } = require('../config/db.config');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');
const Asistencia = require('../models/asistencia.model'); // Asegurate de tener este modelo

const seedHistorial = async () => {
  try {
    console.log('🌱 Seed de historial iniciado...');

    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');

    // Crear sede si no existe
    const sede = await Sede.findOrCreate({
      where: { nombre: 'RitmoFit Test' },
      defaults: {
        direccion: 'Av. Test 123',
        telefono: '011-1234-5678',
        latitud: -34.60,
        longitud: -58.38,
        disciplinas_ofrecidas: 'Yoga, Funcional',
      },
    });

    // Crear usuario socio
    const [socio] = await User.findOrCreate({
      where: { email: 'socio@ritmofit.com' },
      defaults: {
        nombre: 'Santino Tester',
        rol: 'socio',
        email_verificado: true,
      },
    });

    // Crear clases
    const hoy = new Date();
    const fechaAyer = new Date(hoy);
    fechaAyer.setDate(hoy.getDate() - 1);

    const fechaVieja = new Date(hoy);
    fechaVieja.setDate(hoy.getDate() - 3);

    const claseAyer = await Clase.create({
      nombre: 'Yoga Flow Test',
      disciplina: 'Yoga',
      descripcion: 'Clase de yoga para probar historial',
      fecha: fechaAyer.toISOString().split('T')[0],
      hora_inicio: '10:00:00',
      duracion_minutos: 60,
      cupo_maximo: 15,
      nivel: 'principiante',
      sedeId: sede[0].id,
      instructorId: 1,
    });

    const claseVieja = await Clase.create({
      nombre: 'Funcional Power Test',
      disciplina: 'Funcional',
      descripcion: 'Clase funcional para historial viejo',
      fecha: fechaVieja.toISOString().split('T')[0],
      hora_inicio: '18:00:00',
      duracion_minutos: 50,
      cupo_maximo: 20,
      nivel: 'intermedio',
      sedeId: sede[0].id,
      instructorId: 2,
    });

    // Crear asistencias
    await Asistencia.bulkCreate([
      {
        userId: socio.id,
        claseId: claseAyer.id,
        fecha_asistencia: fechaAyer.toISOString().split('T')[0],
        checkin_hora: '10:05',
        confirmado_por_qr: true,
      },
      {
        userId: socio.id,
        claseId: claseVieja.id,
        fecha_asistencia: fechaVieja.toISOString().split('T')[0],
        checkin_hora: '18:02',
        confirmado_por_qr: false,
      },
    ]);

    console.log('✅ Clases y asistencias creadas');
    console.log(`👤 Usuario: ${socio.email}`);
    console.log(`🧘 Clase calificable: ${claseAyer.nombre}`);
    console.log(`⛔ Clase expirada: ${claseVieja.nombre}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seedHistorial:', error);
    process.exit(1);
  }
};

seedHistorial();