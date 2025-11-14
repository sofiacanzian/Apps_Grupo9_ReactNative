// scripts/seedDatabase.js
// Script para poblar la base de datos con datos de prueba
// ejecutable bd


require('dotenv').config();
const { sequelize } = require('../config/db.config');
const Sede = require('../models/sede.model');
const User = require('../models/user.model');
const Clase = require('../models/clase.model');

const seedDatabase = async () => {
    try {
        console.log('🌱 Iniciando seed de la base de datos...');

        // Sincronizar modelos (crea las tablas si no existen)
        await sequelize.sync({ force: false }); // force: true borraría todo
        console.log('✅ Modelos sincronizados');

        // --- 1. CREAR SEDES ---
        console.log('\n📍 Creando sedes...');
        const sedes = await Sede.bulkCreate([
            {
                nombre: 'RitmoFit Centro',
                direccion: 'Av. Corrientes 1234, CABA',
                telefono: '011-4555-1234',
                latitud: -34.603722,
                longitud: -58.381592,
                disciplinas_ofrecidas: 'Spinning, Yoga, Pilates, CrossFit'
            },
            {
                nombre: 'RitmoFit Palermo',
                direccion: 'Av. Santa Fe 3456, Palermo',
                telefono: '011-4777-5678',
                latitud: -34.588888,
                longitud: -58.419444,
                disciplinas_ofrecidas: 'Zumba, Box, Funcional, Yoga'
            },
             {
                nombre: 'RitmoFit Villa Crespo',
                direccion: 'Av.Juan B Justo 1252, Villa Crespo',
                telefono: '011-4984-9586',
                latitud: -34.588347,
                longitud: -58.419123,
                disciplinas_ofrecidas: 'HIT, Box, Funcional'
            },
            {
                nombre: 'RitmoFit Belgrano',
                direccion: 'Av. Cabildo 2345, Belgrano',
                telefono: '011-4788-9012',
                latitud: -34.562778,
                longitud: -58.456389,
                disciplinas_ofrecidas: 'Spinning, Pilates, Stretching'
            }
        ], { ignoreDuplicates: true });
        console.log(`✅ ${sedes.length} sedes creadas`);

        // --- 2. Crea instructores ---
        console.log('\n👨‍🏫 Creando instructores...');
        const instructores = await User.bulkCreate([
            {
                nombre: 'Martín González',
                email: 'martin.instructor@ritmofit.com',
                rol: 'instructor',
                foto_url: 'https://i.pravatar.cc/150?img=12'
            },
            {
                nombre: 'Laura Fernández',
                email: 'laura.instructor@ritmofit.com',
                rol: 'instructor',
                foto_url: 'https://i.pravatar.cc/150?img=47'
            },
            {
                nombre: 'Carlos Pérez',
                email: 'carlos.instructor@ritmofit.com',
                rol: 'instructor',
                foto_url: 'https://i.pravatar.cc/150?img=33'
            },
            {
                nombre: 'Ana Rodriguez',
                email: 'ana.instructor@ritmofit.com',
                rol: 'instructor',
                foto_url: 'https://i.pravatar.cc/150?img=45'
            },
            {
                nombre: 'Diego Martínez',
                email: 'diego.instructor@ritmofit.com',
                rol: 'instructor',
                foto_url: 'https://i.pravatar.cc/150?img=15'
            }
        ], { ignoreDuplicates: true });
        console.log(`✅ ${instructores.length} instructores creados`);

        // --- 3. Crea clases (próximos 7 días) ---
        console.log('\n🏋️ Creando clases...');
        
        const hoy = new Date();
        const clases = [];

        // Función helper para formatear fecha
        const getFecha = (diasDesdeHoy) => {
            const fecha = new Date();
            fecha.setDate(hoy.getDate() + diasDesdeHoy);
            return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        };

        // Catálogo de clases variadas
        const catalogoClases = [
            // DÍA 0 (HOY)
            { nombre: 'Spinning Matutino', disciplina: 'Spinning', descripcion: 'Clase intensiva de spinning para comenzar el día con energía', hora_inicio: '08:00:00', duracion_minutos: 45, cupo_maximo: 20, nivel: 'intermedio', sedeId: 1, instructorId: 1, imagen_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300' },
            { nombre: 'Yoga Flow', disciplina: 'Yoga', descripcion: 'Sesión de yoga fluido para todos los niveles', hora_inicio: '10:00:00', duracion_minutos: 60, cupo_maximo: 15, nivel: 'principiante', sedeId: 2, instructorId: 2, imagen_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300' },
            { nombre: 'CrossFit Extremo', disciplina: 'CrossFit', descripcion: 'Entrenamiento de alta intensidad para nivel avanzado', hora_inicio: '18:00:00', duracion_minutos: 50, cupo_maximo: 12, nivel: 'avanzado', sedeId: 1, instructorId: 3, imagen_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300' },
            
            // DÍA 1
            { nombre: 'Pilates Matinal', disciplina: 'Pilates', descripcion: 'Fortalecimiento del core y flexibilidad', hora_inicio: '09:00:00', duracion_minutos: 55, cupo_maximo: 18, nivel: 'principiante', sedeId: 3, instructorId: 4, imagen_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300' },
            { nombre: 'Zumba Party', disciplina: 'Zumba', descripcion: 'Baile y cardio al ritmo de la música latina', hora_inicio: '19:00:00', duracion_minutos: 45, cupo_maximo: 25, nivel: 'principiante', sedeId: 2, instructorId: 5, imagen_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300' },
            
            // DÍA 2
            { nombre: 'Box Fitness', disciplina: 'Box', descripcion: 'Entrenamiento de boxeo y acondicionamiento físico', hora_inicio: '07:30:00', duracion_minutos: 60, cupo_maximo: 16, nivel: 'intermedio', sedeId: 2, instructorId: 1, imagen_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=300' },
            { nombre: 'Yoga Restaurativo', disciplina: 'Yoga', descripcion: 'Yoga suave para relajación y recuperación', hora_inicio: '20:00:00', duracion_minutos: 60, cupo_maximo: 12, nivel: 'principiante', sedeId: 1, instructorId: 2, imagen_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300' },
            
            // DÍA 3
            { nombre: 'Spinning Power', disciplina: 'Spinning', descripcion: 'Intervalos de alta intensidad en bicicleta', hora_inicio: '18:30:00', duracion_minutos: 45, cupo_maximo: 20, nivel: 'avanzado', sedeId: 3, instructorId: 3, imagen_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300' },
            { nombre: 'Funcional Total', disciplina: 'Funcional', descripcion: 'Entrenamiento funcional de cuerpo completo', hora_inicio: '10:00:00', duracion_minutos: 50, cupo_maximo: 15, nivel: 'intermedio', sedeId: 2, instructorId: 4, imagen_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300' },
            
            // DÍA 4
            { nombre: 'Pilates Avanzado', disciplina: 'Pilates', descripcion: 'Pilates con equipo para nivel avanzado', hora_inicio: '08:00:00', duracion_minutos: 55, cupo_maximo: 10, nivel: 'avanzado', sedeId: 1, instructorId: 5, imagen_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300' },
            { nombre: 'Stretching y Movilidad', disciplina: 'Stretching', descripcion: 'Estiramientos profundos y trabajo de movilidad', hora_inicio: '19:30:00', duracion_minutos: 45, cupo_maximo: 20, nivel: 'principiante', sedeId: 3, instructorId: 1, imagen_url: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=300' },
            
            // DÍA 5
            { nombre: 'CrossFit Basics', disciplina: 'CrossFit', descripcion: 'Introducción al CrossFit para principiantes', hora_inicio: '09:30:00', duracion_minutos: 50, cupo_maximo: 14, nivel: 'principiante', sedeId: 1, instructorId: 2, imagen_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300' },
            { nombre: 'Zumba Toning', disciplina: 'Zumba', descripcion: 'Zumba con pesas para tonificar', hora_inicio: '18:00:00', duracion_minutos: 45, cupo_maximo: 22, nivel: 'intermedio', sedeId: 2, instructorId: 3, imagen_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300' },
            
            // DÍA 6
            { nombre: 'Yoga Vinyasa', disciplina: 'Yoga', descripcion: 'Flujo dinámico de posturas de yoga', hora_inicio: '10:00:00', duracion_minutos: 60, cupo_maximo: 16, nivel: 'intermedio', sedeId: 3, instructorId: 4, imagen_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300' },
            { nombre: 'Spinning Sunset', disciplina: 'Spinning', descripcion: 'Clase de spinning al atardecer', hora_inicio: '19:00:00', duracion_minutos: 45, cupo_maximo: 20, nivel: 'principiante', sedeId: 1, instructorId: 5, imagen_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300' },
        ];

        // Distribuir clases en los próximos 7 días
        let diaIndex = 0;
        for (const claseTemplate of catalogoClases) {
            const clase = {
                ...claseTemplate,
                fecha: getFecha(diaIndex)
            };
            clases.push(clase);
            
            // Avanzar al siguiente día cada 2-3 clases
            if (Math.random() > 0.4) {
                diaIndex = Math.min(diaIndex + 1, 6);
            }
        }

        await Clase.bulkCreate(clases, { ignoreDuplicates: true });
        console.log(`✅ ${clases.length} clases creadas para los próximos 7 días`);

        console.log('\n✅ ¡Seed completado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - Sedes: ${sedes.length}`);
        console.log(`   - Instructores: ${instructores.length}`);
        console.log(`   - Clases: ${clases.length}`);
        console.log('\n💡 Ahora puedes acceder a la app y ver las clases disponibles');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al ejecutar seed:', error);
        process.exit(1);
    }
};

// Ejecutar seed
seedDatabase();
