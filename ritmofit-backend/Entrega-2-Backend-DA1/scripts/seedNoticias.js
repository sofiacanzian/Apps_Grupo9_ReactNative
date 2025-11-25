require('dotenv').config();
const { sequelize } = require('../config/db.config');
const Noticia = require('../models/noticia.model');

const seedNoticias = async () => {
  try {
    console.log('🌱 Iniciando seed de noticias...');

    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados (noticias)');

    const ahora = new Date();
    const manana = new Date(ahora);
    manana.setDate(ahora.getDate() + 1);
    const dentroDeUnaSemana = new Date(ahora);
    dentroDeUnaSemana.setDate(ahora.getDate() + 7);

    const noticias = [
      {
        titulo: 'Apertura de nueva sede RitmoFit Palermo',
        descripcion: '¡Inauguramos nuestra nueva sede en Palermo con clases gratuitas el fin de semana!',
        contenido: 'Estamos muy felices de anunciar la apertura de la nueva sede RitmoFit Palermo. Habrá clases gratuitas y promociones especiales durante la primera semana.',
        tipo: 'noticia',
        imagen_url: 'https://images.unsplash.com/photo-1526403224731-5d7d0b9b7f7f?w=800',
        fecha_publicacion: ahora,
        autor: 'Equipo RitmoFit',
        vigente: true,
        destacada: true,
        enlace: null,
      },
      {
        titulo: 'Promoción 2x1 en clases de Spinning',
        descripcion: 'Aprovechá la promo 2x1 válida toda la semana en nuestras clases de Spinning.',
        contenido: 'Traé a un amigo y ambos pagan una sola clase. Promo válida en sedes seleccionadas hasta agotar cupos.',
        tipo: 'promocion',
        imagen_url: 'https://images.unsplash.com/photo-1508948956644-1f9b39b2b2d4?w=800',
        fecha_publicacion: ahora,
        fecha_vencimiento: dentroDeUnaSemana,
        autor: 'Marketing',
        vigente: true,
        codigo_promocion: 'SPIN2X1',
      },
      {
        titulo: 'Evento: Clase especial con instructor internacional',
        descripcion: 'Clase magistral a cargo de un instructor invitado desde Brasil.',
        contenido: 'No te pierdas esta oportunidad única. Cupos limitados, reservá tu lugar ahora.',
        tipo: 'evento',
        imagen_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
        fecha_publicacion: ahora,
        fecha_evento: manana,
        autor: 'Comunidad',
        vigente: true,
        destacada: false,
      },
      {
        titulo: 'Mantenimiento programado en la app',
        descripcion: 'Habrá una ventana de mantenimiento programado el próximo lunes por la madrugada.',
        contenido: 'Durante la ventana de mantenimiento puede haber interrupciones en el registro y reservas. Pedimos disculpas por las molestias.',
        tipo: 'noticia',
        imagen_url: null,
        fecha_publicacion: ahora,
        autor: 'Equipo Técnico',
        vigente: true,
      },
      {
        titulo: 'Descuento especial para miembros antiguos',
        descripcion: 'Oferta exclusiva para usuarios con más de 1 año de antigüedad.',
        contenido: 'Verificá tu perfil para ver si sos elegible y reclamá tu descuento en la próxima suscripción.',
        tipo: 'promocion',
        imagen_url: 'https://images.unsplash.com/photo-1526403224731-5d7d0b9b7f7f?w=800',
        fecha_publicacion: ahora,
        fecha_vencimiento: dentroDeUnaSemana,
        autor: 'Soporte',
        vigente: true,
      }
    ];

    const created = await Noticia.bulkCreate(noticias, { ignoreDuplicates: true });

    console.log(`✅ Seed noticias completado. Intentadas: ${noticias.length} - Creadas: ${created.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar seedNoticias:', error);
    process.exit(1);
  }
};

seedNoticias();
