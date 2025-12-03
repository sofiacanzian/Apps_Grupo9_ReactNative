const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../config/db.config');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');
const Asistencia = require('../models/asistencia.model');

const seedHistorial = async () => {
  try {
    console.log('🌱 Seed de historial iniciado...');

    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');

    // Obtener primer usuario disponible o crear uno de prueba
    let usuario = await User.findOne();
    if (!usuario) {
      console.log('⚠️ No se encontraron usuarios. Creando usuario de prueba...');
      usuario = await User.create({
        nombre: 'Usuario Test',
        email: 'test@ritmofit.com',
        rol: 'socio',
        activo: true
      });
    }
    const userId = usuario.id;

    // Obtener un instructor válido
    const instructor = await User.findOne({ where: { rol: 'instructor' } });
    const instructorId = instructor ? instructor.id : userId; // Fallback al usuario si no hay instructor
    if (!instructor) console.log('⚠️ No se encontró instructor, usando el usuario actual como instructor.');

    // Eliminar todas las asistencias del usuario
    const deletedAsistencias = await Asistencia.destroy({
      where: { userId: userId }
    });
    console.log(`🗑️  Eliminadas ${deletedAsistencias} asistencias del usuario ${userId}`);

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

    // Calcular fechas
    const ahora = new Date();

    // Calificable: hace 2 horas (dentro de las 24 horas)
    const fechaCalificable = new Date(ahora);
    fechaCalificable.setHours(ahora.getHours() - 2);
    const horaCalificable = fechaCalificable.toTimeString().split(' ')[0].substring(0, 5);

    // Incalificable: hace 2 días (más de 24 horas pero menos de 1 mes)
    const fechaIncalificable = new Date(ahora);
    fechaIncalificable.setDate(ahora.getDate() - 2);
    fechaIncalificable.setHours(10, 0, 0, 0); // 10:00 AM

    // Pasado el mes: hace 3 meses (más de 1 mes, solo aparece en "todos")
    const fechaPasadoMes = new Date(ahora);
    fechaPasadoMes.setMonth(ahora.getMonth() - 3);
    fechaPasadoMes.setHours(18, 0, 0, 0); // 6:00 PM

    // Crear clase calificable
    const claseCalificable = await Clase.create({
      nombre: 'calificable',
      disciplina: 'Yoga',
      descripcion: 'Clase que puede ser calificada (dentro de 24 horas)',
      fecha: fechaCalificable.toISOString().split('T')[0],
      hora_inicio: horaCalificable + ':00',
      duracion_minutos: 60,
      cupo_maximo: 15,
      nivel: 'principiante',
      sedeId: sede[0].id,
      instructorId: instructorId,
    });

    // Crear clase incalificable
    const claseIncalificable = await Clase.create({
      nombre: 'incalificable',
      disciplina: 'Funcional',
      descripcion: 'Clase que no puede ser calificada (pasaron más de 24 horas)',
      fecha: fechaIncalificable.toISOString().split('T')[0],
      hora_inicio: '10:00:00',
      duracion_minutos: 50,
      cupo_maximo: 20,
      nivel: 'intermedio',
      sedeId: sede[0].id,
      instructorId: instructorId,
    });

    // Crear clase pasado el mes
    const clasePasadoMes = await Clase.create({
      nombre: 'pasado el mes',
      disciplina: 'Pilates',
      descripcion: 'Clase de hace 3 meses (solo aparece en "todos")',
      fecha: fechaPasadoMes.toISOString().split('T')[0],
      hora_inicio: '18:00:00',
      duracion_minutos: 45,
      cupo_maximo: 12,
      nivel: 'avanzado',
      sedeId: sede[0].id,
      instructorId: instructorId,
    });

    // Crear asistencias para el usuario
    await Asistencia.bulkCreate([
      {
        userId: userId,
        claseId: claseCalificable.id,
        fecha_asistencia: fechaCalificable.toISOString().split('T')[0],
        checkin_hora: horaCalificable,
        confirmado_por_qr: true,
        duracion_minutos: 60,
      },
      {
        userId: userId,
        claseId: claseIncalificable.id,
        fecha_asistencia: fechaIncalificable.toISOString().split('T')[0],
        checkin_hora: '10:05',
        confirmado_por_qr: true,
        duracion_minutos: 50,
      },
      {
        userId: userId,
        claseId: clasePasadoMes.id,
        fecha_asistencia: fechaPasadoMes.toISOString().split('T')[0],
        checkin_hora: '18:02',
        confirmado_por_qr: false,
        duracion_minutos: 45,
      },
    ]);

    console.log('✅ Clases y asistencias creadas');
    console.log(`👤 Usuario: ${usuario.email || usuario.nombre || 'ID ' + userId}`);
    console.log(`✅ Clase calificable: ${claseCalificable.nombre} (hace 2 horas)`);
    console.log(`⛔ Clase incalificable: ${claseIncalificable.nombre} (hace 2 días)`);
    console.log(`📅 Clase pasado el mes: ${clasePasadoMes.nombre} (hace 3 meses)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seedHistorial:', error);
    process.exit(1);
  }
};

seedHistorial();