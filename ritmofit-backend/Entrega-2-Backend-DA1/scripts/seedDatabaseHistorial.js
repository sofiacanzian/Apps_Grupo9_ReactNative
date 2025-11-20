const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/db.config');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Sede = require('../models/sede.model');
const Asistencia = require('../models/asistencia.model');

const seedHistorial = async () => {
  try {
    console.log('\n🌱 Seed de historial iniciado...\n');

    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');

    // USER
    console.log('📌 Buscando usuario ID = 1');
    const usuario = await User.findByPk(1);
    console.log('   → Usuario encontrado:', usuario ? usuario.email || usuario.nombre : usuario);

    if (!usuario) {
      console.error('❌ Usuario con id 1 no encontrado');
      process.exit(1);
    }

    // DELETE old history
    console.log('\n🗑️ Eliminando historial viejo...');
    const deleted = await Asistencia.destroy({ where: { userId: 1 } });
    console.log(`   → Asistencias eliminadas: ${deleted}`);


    // SEDE
    console.log('\n🏢 Verificando sede...');
    const [sede, createdSede] = await Sede.findOrCreate({
      where: { nombre: 'RitmoFit Test' },
      defaults: {
        direccion: 'Av. Test 123',
        telefono: '011-1234-5678',
        latitud: -34.60,
        longitud: -58.38,
        disciplinas_ofrecidas: 'Yoga, Funcional, Box',
      },
    });
    console.log('   → Sede usada:', sede.id, ' (creada?:', createdSede, ')');


    // =========================
    // FECHAS
    // =========================
    const hoy = new Date();
    const getISODate = (date) => date.toISOString().split('T')[0];

    console.log('\n📅 Generando fechas...');

    const addDays = (d, days) => { const n = new Date(d); n.setDate(d.getDate() + days); return n; };

    // Yoga: algunas pasadas y algunas próximas
    const yoga1 = addDays(hoy, -1);
    const yoga2 = addDays(hoy, -3);
    const yoga3 = addDays(hoy, 5);
    const yoga4 = addDays(hoy, 10);

    // Box: usar la etiqueta "Box" para coincidir con enum de Objetivo
    const box1 = addDays(hoy, 8);
    const box2 = addDays(hoy, 12);
    const box3 = addDays(hoy, 15);

    console.log('   → Yoga fechas:', getISODate(yoga1), getISODate(yoga2), getISODate(yoga3), getISODate(yoga4));
    console.log('   → Box fechas:', getISODate(box1), getISODate(box2), getISODate(box3));


    // =========================
    // YOGA
    // =========================
    console.log('\n🧘 Creando clases de Yoga...');

    const yogaClasesData = [
      { fecha: yoga1, nombre: 'Yoga Relax — Sesión de respiración y estiramiento profundo' },
      { fecha: yoga2, nombre: 'Yoga Flow — Secuencia fluida para movilidad completa' },
      { fecha: yoga3, nombre: 'Yoga Energético — Serie dinámica para fuerza y equilibrio' },
      { fecha: yoga4, nombre: 'Yoga Postural — Alineación y control consciente del cuerpo' },
    ];

    const yogaClases = [];

    for (const c of yogaClasesData) {
      console.log(`   → Creando clase: ${c.nombre} (${getISODate(c.fecha)})`);
      const clase = await Clase.create({
        nombre: c.nombre,
        disciplina: 'Yoga',
        descripcion: 'Clase de Yoga enfocada en respiración, elongación y control corporal.',
        fecha: getISODate(c.fecha),
        hora_inicio: '09:00:00',
        duracion_minutos: 60,
        cupo_maximo: 20,
        nivel: 'principiante',
        sedeId: sede.id,
        instructorId: 1,
      });
      console.log('     ✔ Creada clase ID:', clase.id);
      yogaClases.push(clase);
    }


    // =========================
    // BOXEO
    // =========================
    console.log('\n🥊 Creando clases de Boxeo...');

    const boxClasesData = [
      { fecha: box1, nombre: 'Box Técnico — Golpes básicos y guardia' },
      { fecha: box2, nombre: 'Box Cardio — Combinaciones con intensidad' },
      { fecha: box3, nombre: 'Box Avanzado — Trabajo de potencia y defensa' },
    ];

    const boxClases = [];

    for (const c of boxClasesData) {
      console.log(`   → Creando clase: ${c.nombre} (${getISODate(c.fecha)})`);
      const clase = await Clase.create({
        nombre: c.nombre,
        disciplina: 'Box',
        descripcion: 'Entrenamiento de boxeo con técnica, combinaciones y trabajo físico.',
        fecha: getISODate(c.fecha),
        hora_inicio: '18:00:00',
        duracion_minutos: 50,
        cupo_maximo: 15,
        nivel: 'intermedio',
        sedeId: sede.id,
        instructorId: 1,
      });
      console.log('     ✔ Creada clase ID:', clase.id);
      boxClases.push(clase);
    }

    // =========================
    // PILATES (10 clases distribuidas en el año)
    // =========================
    console.log('\n🤸 Creando 10 clases de Pilates repartidas por el año...');
    const pilatesOffsets = [-330, -270, -210, -150, -90, -30, 0, 30, 90, 180];
    const pilatesClasesData = pilatesOffsets.map((offs, i) => ({
      fecha: addDays(hoy, offs),
      nombre: `Pilates Serie ${i + 1} — Fortalecimiento y movilidad`,
    }));

    const pilatesClases = [];
    for (const c of pilatesClasesData) {
      console.log(`   → Creando clase: ${c.nombre} (${getISODate(c.fecha)})`);
      const clase = await Clase.create({
        nombre: c.nombre,
        disciplina: 'Pilates',
        descripcion: 'Clase de Pilates para fuerza del core y movilidad.',
        fecha: getISODate(c.fecha),
        hora_inicio: '08:00:00',
        duracion_minutos: 50,
        cupo_maximo: 18,
        nivel: 'principiante',
        sedeId: sede.id,
        instructorId: 1,
      });
      console.log('     ✔ Creada clase ID:', clase.id);
      pilatesClases.push(clase);
    }

    // =========================
    // OTRAS CLASES (1 cada una: CrossFit, Zumba, Spinning, y una adicional de Pilates)
    // =========================
    console.log('\n🔀 Creando clases sueltas: CrossFit, Zumba, Spinning, Pilates...');
    const extrasData = [
      { fecha: addDays(hoy, -7), nombre: 'CrossFit WOD — Fuerza funcional', disciplina: 'CrossFit', hora: '07:00:00' },
      { fecha: addDays(hoy, -14), nombre: 'Zumba Fiesta — Cardio con ritmo', disciplina: 'Zumba', hora: '19:00:00' },
      { fecha: addDays(hoy, -21), nombre: 'Spinning Endurance — Resistencia en pista', discipline: 'Spinning', hora: '18:00:00' },
      { fecha: addDays(hoy, -28), nombre: 'Pilates Extra — Control y respiración', discipline: 'Pilates', hora: '10:00:00' },
    ];

    const extraClases = [];
    for (const c of extrasData) {
      const disc = c.disciplina || c.discipline || 'Pilates';
      console.log(`   → Creando clase: ${c.nombre} (${getISODate(c.fecha)})`);
      const clase = await Clase.create({
        nombre: c.nombre,
        disciplina: disc,
        descripcion: `${disc} especial`,
        fecha: getISODate(c.fecha),
        hora_inicio: c.hora || '09:00:00',
        duracion_minutos: 50,
        cupo_maximo: 20,
        nivel: 'intermedio',
        sedeId: sede.id,
        instructorId: 1,
      });
      console.log('     ✔ Creada clase ID:', clase.id);
      extraClases.push(clase);
    }



    // =========================
    // ASISTENCIAS
    // =========================
    console.log('\n📝 Creando asistencias...');

    const asistencias = [
      ...yogaClases.map((clase) => ({
        userId: 1,
        claseId: clase.id,
        fecha_asistencia: clase.fecha,
        checkin_hora: '09:02',
        confirmado_por_qr: true,
        duracion_minutos: 60,
      })),
      ...boxClases.map((clase) => ({
        userId: 1,
        claseId: clase.id,
        fecha_asistencia: clase.fecha,
        checkin_hora: '18:01',
        confirmado_por_qr: true,
        duracion_minutos: 50,
      })),
      ...pilatesClases.map((clase) => ({
        userId: 1,
        claseId: clase.id,
        fecha_asistencia: clase.fecha,
        checkin_hora: '08:05',
        confirmado_por_qr: true,
        duracion_minutos: 50,
      })),
      ...extraClases.map((clase) => ({
        userId: 1,
        claseId: clase.id,
        fecha_asistencia: clase.fecha,
        checkin_hora: '10:00',
        confirmado_por_qr: true,
        duracion_minutos: 50,
      })),
    ];

    console.log('   → Asistencias a crear:', asistencias.length);
    asistencias.forEach((a, i) => console.log(`     #${i + 1}`, a));

    await Asistencia.bulkCreate(asistencias);

    console.log('\n🔍 Verificando que las asistencias existen en DB...');
    const test = await Asistencia.findAll({ where: { userId: 1 } });
    console.log('   → Total encontradas:', test.length);
    test.forEach((t) => console.log('     ✔ Asistencia ID:', t.id, 'Clase ID:', t.claseId));


    console.log('\n✅ Seed finalizado. Todo creado correctamente.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en seedHistorial:', error);
    process.exit(1);
  }
};

seedHistorial();
