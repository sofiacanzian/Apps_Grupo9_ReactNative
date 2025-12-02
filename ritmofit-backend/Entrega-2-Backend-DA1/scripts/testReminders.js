// scripts/testReminders.js
// Script para facilitar las pruebas del sistema de recordatorios

const { sequelize } = require('../config/db.config');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');
const Reserva = require('../models/reserva.model');
const Sede = require('../models/sede.model');

async function setupReminderTest() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la base de datos\n');

        // 1. Verificar usuarios con push token
        console.log('📱 Verificando usuarios con expo_push_token...');
        const usersWithToken = await User.findAll({
            where: { expo_push_token: { [require('sequelize').Op.ne]: null } },
            attributes: ['id', 'email', 'nombre', 'expo_push_token']
        });

        if (usersWithToken.length === 0) {
            console.log('⚠️  No hay usuarios con expo_push_token');
            console.log('💡 Puedes agregar uno manualmente:');
            console.log(`
UPDATE users 
SET expo_push_token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' 
WHERE email = 'tu@email.com';
            `);
        } else {
            console.log(`✅ Encontrados ${usersWithToken.length} usuarios con push token:`);
            usersWithToken.forEach(u => {
                console.log(`   - ${u.email} (ID: ${u.id})`);
            });
        }

        // 2. Verificar sedes disponibles
        console.log('\n🏢 Verificando sedes...');
        const sedes = await Sede.findAll({ limit: 3 });
        if (sedes.length === 0) {
            console.log('⚠️  No hay sedes en la base de datos');
            console.log('💡 Ejecuta: npm run seed (o node scripts/seedDatabase.js)');
        } else {
            console.log(`✅ Encontradas ${sedes.length} sedes disponibles`);
        }

        // 3. Buscar clases que comienzan pronto
        console.log('\n⏰ Buscando clases próximas (en las próximas 2 horas)...');
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        const today = now.toISOString().split('T')[0];
        const oneHourTime = oneHourFromNow.toTimeString().split(' ')[0].substring(0, 5);
        const twoHoursTime = twoHoursFromNow.toTimeString().split(' ')[0].substring(0, 5);

        const upcomingClases = await Clase.findAll({
            where: {
                fecha: today,
                hora_inicio: {
                    [require('sequelize').Op.gte]: oneHourTime,
                    [require('sequelize').Op.lte]: twoHoursTime
                }
            },
            include: [{ model: Sede }]
        });

        if (upcomingClases.length === 0) {
            console.log(`⚠️  No hay clases entre ${oneHourTime} y ${twoHoursTime} hoy`);
            console.log('\n💡 Opción 1: Crear una clase de prueba manualmente');
            console.log(`   Fecha: ${today}`);
            console.log(`   Hora inicio: ${oneHourTime} (aprox 1 hora desde ahora)`);
            
            // Sugerir crear una clase de prueba
            if (sedes.length > 0 && usersWithToken.length > 0) {
                console.log('\n💡 Opción 2: Ejecutar este script con el flag --create');
                console.log('   node scripts/testReminders.js --create');
            }
        } else {
            console.log(`✅ Encontradas ${upcomingClases.length} clases próximas:`);
            upcomingClases.forEach(c => {
                console.log(`   - ${c.nombre} a las ${c.hora_inicio} (ID: ${c.id})`);
            });
        }

        // 4. Verificar reservas activas para clases próximas
        if (upcomingClases.length > 0) {
            console.log('\n📋 Verificando reservas activas para estas clases...');
            const claseIds = upcomingClases.map(c => c.id);
            
            const reservasActivas = await Reserva.findAll({
                where: {
                    clase_id: { [require('sequelize').Op.in]: claseIds },
                    estado: 'activa'
                },
                include: [
                    { model: User, attributes: ['id', 'email', 'expo_push_token'] },
                    { model: Clase, attributes: ['id', 'nombre', 'hora_inicio'] }
                ]
            });

            if (reservasActivas.length === 0) {
                console.log('⚠️  No hay reservas activas para estas clases');
                console.log('💡 Necesitas crear una reserva para probar el sistema');
            } else {
                console.log(`✅ Encontradas ${reservasActivas.length} reservas activas:`);
                reservasActivas.forEach(r => {
                    const hasToken = r.User?.expo_push_token ? '✅' : '❌';
                    console.log(`   ${hasToken} Reserva ID: ${r.id} - ${r.User?.email} - Clase: ${r.Clase?.nombre}`);
                });
            }
        }

        // Crear clase y reserva de prueba si se pasa --create
        if (process.argv.includes('--create')) {
            console.log('\n🔧 Creando clase y reserva de prueba...');
            
            if (sedes.length === 0) {
                console.log('❌ No se puede crear: faltan sedes. Ejecuta el seed primero.');
                process.exit(1);
            }

            if (usersWithToken.length === 0) {
                console.log('❌ No se puede crear: no hay usuarios con expo_push_token');
                process.exit(1);
            }

            // Buscar un instructor
            const instructor = await User.findOne({ where: { rol: 'instructor' } });
            if (!instructor) {
                console.log('❌ No se puede crear: no hay instructores');
                process.exit(1);
            }

            // Crear clase para dentro de 1.5 horas
            const testClaseTime = new Date(now.getTime() + 90 * 60 * 1000); // 1.5 horas
            const testClaseDate = testClaseTime.toISOString().split('T')[0];
            const testClaseHora = testClaseTime.toTimeString().split(' ')[0].substring(0, 5);

            const nuevaClase = await Clase.create({
                nombre: '🧪 Clase de Prueba - Recordatorios',
                descripcion: 'Clase creada automáticamente para probar el sistema de recordatorios',
                instructor_id: instructor.id,
                sede_id: sedes[0].id,
                fecha: testClaseDate,
                hora_inicio: testClaseHora,
                hora_fin: new Date(testClaseTime.getTime() + 60 * 60 * 1000).toTimeString().split(' ')[0].substring(0, 5),
                capacidad_maxima: 20,
                cupos_disponibles: 20
            });

            console.log(`✅ Clase creada: ID ${nuevaClase.id} - ${testClaseDate} a las ${testClaseHora}`);

            // Crear reserva con el primer usuario que tiene token
            const nuevaReserva = await Reserva.create({
                user_id: usersWithToken[0].id,
                clase_id: nuevaClase.id,
                estado: 'activa'
            });

            console.log(`✅ Reserva creada: ID ${nuevaReserva.id} para ${usersWithToken[0].email}`);
            console.log(`\n✨ Todo listo! El job enviará el recordatorio entre ${oneHourTime} y ${twoHoursTime}`);
        }

        // Resumen final
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 RESUMEN DEL ESTADO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Usuarios con push token: ${usersWithToken.length > 0 ? '✅' : '❌'}`);
        console.log(`Sedes disponibles: ${sedes.length > 0 ? '✅' : '❌'}`);
        console.log(`Clases próximas (1-2h): ${upcomingClases.length > 0 ? '✅' : '⚠️  Ninguna'}`);
        
        console.log('\n📋 SIGUIENTES PASOS:');
        if (upcomingClases.length > 0 && usersWithToken.length > 0) {
            console.log('1. Inicia el servidor: npm run dev');
            console.log('2. Espera a ver: "🕐 [Reminder Job] Ejecutando revisión..."');
            console.log('3. El recordatorio se enviará automáticamente');
        } else {
            console.log('1. Ejecuta: node scripts/testReminders.js --create');
            console.log('2. Luego inicia el servidor: npm run dev');
            console.log('3. Monitorea los logs del job cada 30 minutos');
        }

        console.log('\n💡 TIPS:');
        console.log('- Para testing rápido, cambia el cron a: * * * * * (cada minuto)');
        console.log('- Archivo: jobs/reminder.job.js, línea del cron.schedule');
        console.log('- Para probar cancelación: DELETE /api/reservas/:id');
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

setupReminderTest();
